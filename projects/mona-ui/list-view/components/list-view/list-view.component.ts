import { NgTemplateOutlet } from "@angular/common";
import {
    afterRenderEffect,
    Component,
    computed,
    contentChild,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    input,
    Optional,
    output,
    SkipSelf,
    TemplateRef,
    untracked
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
    ListComponent,
    ListFooterTemplateDirective,
    ListGroupHeaderTemplateDirective,
    ListHeaderTemplateDirective,
    ListItemTemplateDirective,
    ListKeySelector,
    ListNoDataTemplateDirective,
    ListService
} from "@mirei/mona-ui/list";
import { PageChangeEvent, PagerComponent, PageSizeChangeEvent } from "@mirei/mona-ui/pager";
import { ThemeService } from "@mirei/mona-ui/theme";
import { ImmutableSet } from "@mirei/ts-collections";
import { filter, fromEvent, Subscription } from "rxjs";
import { twMerge } from "tailwind-merge";
import { ListViewFooterTemplateDirective } from "../../directives/list-view-footer-template.directive";
import { ListViewGroupHeaderTemplateDirective } from "../../directives/list-view-group-header-template.directive";
import { ListViewHeaderTemplateDirective } from "../../directives/list-view-header-template.directive";
import { ListViewItemTemplateDirective } from "../../directives/list-view-item-template.directive";
import { ListViewNoDataTemplateDirective } from "../../directives/list-view-no-data-template.directive";
import { listViewBaseThemeVariants, ListViewVariantInputs, ListViewVariantProps } from "../../styles/list-view.styles";

@Component({
    selector: "mona-list-view",
    templateUrl: "./list-view.component.html",
    providers: [
        {
            provide: ListService,
            useFactory: (parentListService: ListService<unknown>): ListService<unknown> => {
                return parentListService ?? new ListService<unknown>();
            },
            deps: [[new Optional(), new SkipSelf(), ListService]]
        }
    ],
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
export class ListViewComponent<T = unknown> implements ListViewVariantInputs {
    readonly #destroyRef = inject(DestroyRef);
    readonly #hostElementRef = inject(ElementRef<HTMLDivElement>);
    readonly #scrollBottomEnabled = computed(() => {
        const pageableOptions = this.listService.pageableOptions();
        return !pageableOptions.enabled;
    });
    readonly #themeService = inject(ThemeService);
    #scrollSubscription: Subscription | null = null;
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
    protected readonly listMaxHeight = computed(() => {
        const maxHeight = this.maxHeight();
        return typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight;
    });
    protected readonly listMaxWidth = computed(() => {
        const maxWidth = this.maxWidth();
        return typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth;
    });
    protected readonly listService = inject<ListService<T>>(ListService);
    protected readonly listWidth = computed(() => {
        const width = this.width();
        return typeof width === "number" ? `${width}px` : width;
    });
    protected readonly noDataTemplate = contentChild(ListViewNoDataTemplateDirective, { read: TemplateRef });
    protected readonly viewItems = computed(() => this.listItems());

    /**
     * @description Accessible name for the list view's `listbox` element. Describe what the list represents.
     * @default ""
     */
    public readonly ariaLabel = input<string>("", { alias: "aria-label" });

    /**
     * @description Sets the height of the list view.
     * @default 100%
     */
    public readonly height = input<string | number>("100%");

    /**
     * @description Sets the classes of the inner UL element.
     * @default ""
     */
    public readonly listClass = input<string>("");

    /**
     * @description Sets the classes of the list items.
     * @default ""
     */
    public readonly listItemClass = input("");

    /**
     * @description Sets the style of the list items.
     * @default {}
     */
    public readonly listItemStyle = input<Partial<CSSStyleDeclaration>>({});

    /**
     * @description Sets the style of the list.
     * @default {}
     */
    public readonly listStyle = input<Partial<CSSStyleDeclaration>>({});

    /**
     * @description Collection of items to render.
     * @default []
     */
    public readonly items = input<Iterable<T>>([]);

    /**
     * @description Sets the maximum height of the list.
     * @default ""
     */
    public readonly maxHeight = input<string | number>("");

    /**
     * @description Sets the maximum width of the list.
     * @default ""
     */
    public readonly maxWidth = input<string | number>("");

    /**
     * @description Border-radius preset applied to the component.
     * @default medium
     */
    public readonly rounded = input<ListViewVariantProps["rounded"]>("medium");

    /**
     * @description Emitted when the list is scrolled to the bottom.
     */
    public readonly scrollBottom = output<Event>();

    /**
     * @description Size preset controlling the component's dimensions.
     * @default medium
     */
    public readonly size = input<ListViewVariantProps["size"]>("medium");

    /**
     * @description Property name or accessor used to derive the display text from a data item.
     * @default ""
     */
    public readonly textField = input<ListKeySelector<T, string> | undefined>("");

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
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

    protected onPageChange(event: PageChangeEvent): void {
        this.listService.pageState.update(s => ({ ...s, page: event.page, skip: event.skip }));
    }

    protected onPageSizeChange(event: PageSizeChangeEvent): void {
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
        this.#scrollSubscription?.unsubscribe();
        if (!element) {
            return;
        }
        this.#scrollSubscription = fromEvent<Event>(element, "scroll")
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
