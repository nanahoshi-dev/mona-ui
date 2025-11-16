import { NgTemplateOutlet } from "@angular/common";
import {
    afterRenderEffect,
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChild,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    input,
    output,
    TemplateRef,
    untracked
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ImmutableSet } from "@mirei/ts-collections";
import { filter, fromEvent } from "rxjs";
import { twMerge } from "tailwind-merge";
import { ListComponent } from "../../../common/list/components/list/list.component";
import { ListFooterTemplateDirective } from "../../../common/list/directives/list-footer-template.directive";
import { ListGroupHeaderTemplateDirective } from "../../../common/list/directives/list-group-header-template.directive";
import { ListHeaderTemplateDirective } from "../../../common/list/directives/list-header-template.directive";
import { ListItemTemplateDirective } from "../../../common/list/directives/list-item-template.directive";
import { ListNoDataTemplateDirective } from "../../../common/list/directives/list-no-data-template.directive";
import { ListKeySelector } from "../../../common/list/models/ListSelectors";
import { ListService } from "../../../common/list/services/list.service";
import { PagerComponent } from "../../../pager/components/pager/pager.component";
import { PageChangeEvent } from "../../../pager/models/PageChangeEvent";
import { PageSizeChangeEvent } from "../../../pager/models/PageSizeChangeEvent";
import { ListViewFooterTemplateDirective } from "../../directives/list-view-footer-template.directive";
import { ListViewGroupHeaderTemplateDirective } from "../../directives/list-view-group-header-template.directive";
import { ListViewHeaderTemplateDirective } from "../../directives/list-view-header-template.directive";
import { ListViewItemTemplateDirective } from "../../directives/list-view-item-template.directive";
import { ListViewNoDataTemplateDirective } from "../../directives/list-view-no-data-template.directive";
import { listViewBaseThemeVariants, ListViewVariantInputs, ListViewVariantProps } from "../../styles/list-view.styles";
import { ThemeService } from "../../../theme/services/theme.service";

@Component({
    selector: "mona-list-view",
    templateUrl: "./list-view.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ListService],
    imports: [
        NgTemplateOutlet,
        PagerComponent,
        ListComponent,
        ListHeaderTemplateDirective,
        ListFooterTemplateDirective,
        ListGroupHeaderTemplateDirective,
        ListItemTemplateDirective,
        ListNoDataTemplateDirective
    ],
    host: {
        "[class]": "baseClasses()",
        "[attr.tabindex]": "-1"
    }
})
export class ListViewComponent<T = any> implements ListViewVariantInputs, AfterViewInit {
    readonly #destroyRef = inject(DestroyRef);
    readonly #hostElementRef = inject(ElementRef<HTMLDivElement>);
    readonly #scrollBottomEnabled = computed(() => {
        const pageableOptions = this.listService.pageableOptions();
        return !pageableOptions.enabled;
    });
    readonly #themeService = inject(ThemeService);
    protected readonly baseClasses = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const size = this.size();
        const variantClasses = listViewBaseThemeVariants(theme)({ rounded, size });
        const userClass = this.userClass();
        return twMerge(variantClasses, userClass);
    });
    protected readonly footerTemplate = contentChild(ListViewFooterTemplateDirective, { read: TemplateRef });
    protected readonly groupHeaderTemplate = contentChild(ListViewGroupHeaderTemplateDirective, { read: TemplateRef });
    protected readonly headerTemplate = contentChild(ListViewHeaderTemplateDirective, { read: TemplateRef });
    protected readonly itemCount = computed(() => this.listItems().size());
    protected readonly itemTemplate = contentChild(ListViewItemTemplateDirective, { read: TemplateRef });
    protected readonly listHeight = computed(() => {
        const height = this.height();
        return typeof height === "number" ? `${height}px` : height;
    });
    protected readonly listItems = computed(() => {
        const items = this.items();
        return ImmutableSet.create(items);
    });
    protected readonly listService = inject<ListService<T>>(ListService);
    protected readonly listWidth = computed(() => {
        const width = this.width();
        return typeof width === "number" ? `${width}px` : width;
    });
    protected readonly noDataTemplate = contentChild(ListViewNoDataTemplateDirective, { read: TemplateRef });
    protected readonly viewItems = computed(() => this.listItems());

    /**
     * @description Sets the height of the list view.
     * @default 100%
     */
    public readonly height = input<string | number>("100%");

    /**
     * @description Sets the classes of the inner UL element.
     */
    public readonly listClass = input<string>("");

    /**
     * @description Sets the classes of the list items.
     */
    public readonly listItemClass = input("");

    /**
     * @description Sets the style of the list items.
     */
    public readonly listItemStyle = input<Partial<CSSStyleDeclaration>>({});

    /**
     * @description Sets the style of the list.
     */
    public readonly listStyle = input<Partial<CSSStyleDeclaration>>({});

    /**
     * @description The items to display in the list.
     */
    public readonly items = input<Iterable<T>>([]);

    /**
     * @description Sets the rounding of the list.
     */
    public readonly rounded = input<ListViewVariantProps["rounded"]>("medium");

    /**
     * @description Emits when the list has scrolled to the bottom.
     */
    public readonly scrollBottom = output<Event>();

    /**
     * @description Sets the size of the list.
     */
    public readonly size = input<ListViewVariantProps["size"]>("medium");

    /**
     * @description Sets the field to display in the list.
     */
    public readonly textField = input<ListKeySelector<T, string> | undefined>("");

    public readonly userClass = input<string>("", { alias: "class" });

    /**
     * @description Sets the width of the list view.
     * @default 100%
     */
    public readonly width = input<string | number>("100%");

    public constructor() {
        effect(() => {
            const textField = this.textField();
            untracked(() => this.listService.setTextField(textField ?? ""));
        });
        afterRenderEffect({
            read: () => this.setScrollBottomEvent()
        });
    }

    public ngAfterViewInit(): void {
        // window.setTimeout(() => {
        //     this.setScrollBottomEvent();
        // });
    }

    public onPageChange(event: PageChangeEvent): void {
        this.listService.pageState.update(s => ({ ...s, page: event.page, skip: event.skip }));
    }

    public onPageSizeChange(event: PageSizeChangeEvent): void {
        this.listService.pageState.update(s => ({ ...s, page: 1, skip: 0, take: event.newPageSize }));
    }

    private setScrollBottomEvent(): void {
        let element: HTMLElement | null;
        const virtualScrollEnabled = this.listService.virtualScrollOptions().enabled;
        if (virtualScrollEnabled) {
            element = this.#hostElementRef.nativeElement.querySelector(".cdk-virtual-scroll-viewport");
        } else {
            element = this.#hostElementRef.nativeElement.querySelector("mona-list > ul");
        }
        if (!element) {
            return;
        }
        fromEvent<Event>(element, "scroll")
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(event => {
                    if (!this.#scrollBottomEnabled()) {
                        return false;
                    }
                    const target = event.target as HTMLElement;
                    return Math.abs(target.scrollHeight - target.scrollTop - target.clientHeight) < 3.0;
                })
            )
            .subscribe(event => this.scrollBottom.emit(event));
    }
}
