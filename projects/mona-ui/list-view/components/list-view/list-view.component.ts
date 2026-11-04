import { NgTemplateOutlet } from "@angular/common";
import {
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
import { ImmutableList, type Predicate } from "@mirei/ts-collections";
import {
    LIST_VIEW_HOST_LIST_SERVICE,
    ListComponent,
    ListFooterTemplateDirective,
    ListGroupHeaderTemplateDirective,
    ListHeaderTemplateDirective,
    type ListItem,
    ListItemTemplateDirective,
    type ListKeySelector,
    ListNoDataTemplateDirective,
    ListService
} from "@nanahoshi/mona-ui/internal/list";
import { type PageChangeEvent, PagerComponent, type PageSizeChangeEvent } from "@nanahoshi/mona-ui/pager";
import { filter, fromEvent, Subject } from "rxjs";
import { twMerge } from "tailwind-merge";
import { ListViewFooterTemplateDirective } from "../../directives/list-view-footer-template.directive";
import { ListViewGroupHeaderTemplateDirective } from "../../directives/list-view-group-header-template.directive";
import { ListViewHeaderTemplateDirective } from "../../directives/list-view-header-template.directive";
import { ListViewItemTemplateDirective } from "../../directives/list-view-item-template.directive";
import { ListViewNoDataTemplateDirective } from "../../directives/list-view-no-data-template.directive";
import {
    listViewBaseThemeVariants,
    type ListViewVariantInputs,
    type ListViewVariantProps
} from "../../styles/list-view.styles";

/** How close to the end (in pixels) counts as scrolled to the bottom. */
const SCROLL_BOTTOM_THRESHOLD = 3;

@Component({
    selector: "mona-list-view",
    templateUrl: "./list-view.component.html",
    providers: [
        {
            // Each list view has its own service, unless the component whose template it is in shares one on purpose.
            provide: ListService,
            useFactory: (): ListService<unknown> =>
                inject(LIST_VIEW_HOST_LIST_SERVICE, { optional: true, skipSelf: true }) ?? new ListService<unknown>()
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
    readonly #hostElementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    #atBottom = false;
    protected readonly baseClasses = computed(() => {
        const rounded = this.rounded();
        const size = this.size();
        const variantClasses = listViewBaseThemeVariants({ rounded, size });
        const userClass = this.userClass();
        return twMerge(variantClasses, userClass);
    });
    protected readonly footerTemplate = contentChild(ListViewFooterTemplateDirective, { read: TemplateRef });
    protected readonly groupHeaderTemplate = contentChild(ListViewGroupHeaderTemplateDirective, { read: TemplateRef });
    protected readonly headerTemplate = contentChild(ListViewHeaderTemplateDirective, { read: TemplateRef });
    protected readonly itemCount = computed(() => this.listItems().length);
    protected readonly itemTemplate = contentChild(ListViewItemTemplateDirective, { read: TemplateRef });
    protected readonly listHeight = computed(() => {
        const height = this.height();
        return typeof height === "number" ? `${height}px` : height;
    });
    /** The items as given: a list, so equal items (two `"a"` strings) are both shown. */
    protected readonly listItems = computed(() => ImmutableList.create(this.items()));
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

    /**
     * @description Accessible name for the list view's `listbox` element. Describe what the list represents.
     * @default ""
     */
    public readonly ariaLabel = input<string>("", { alias: "aria-label" });

    /**
     * @description Property name or predicate that marks an item as disabled. Disabled items can't be selected,
     * activated or reached by typeahead.
     * @default ""
     */
    public readonly disabledBy = input<string | Predicate<T> | null | undefined>("");

    /**
     * @description Sets the height of the list view. With virtual scrolling, the viewport takes this height, so a
     * percentage needs a parent with a height; `""` sizes the viewport to its items instead.
     * @default 100%
     */
    public readonly height = input<string | number>("100%");

    /**
     * @description Emitted with the data item when the user activates an enabled item by clicking it or pressing
     * Enter on it. Fires whether or not the list view is selectable.
     */
    public readonly itemActivate = output<T>();

    /**
     * @description Collection of items to render.
     * @default []
     */
    public readonly items = input<Iterable<T>>([]);

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
     * Page-size picks from the pager, forwarded to `ListViewPageableDirective`.
     * @internal
     */
    public readonly pageSizeSelect$ = new Subject<PageSizeChangeEvent>();

    /**
     * @description Border-radius preset applied to the component.
     * @default medium
     */
    public readonly rounded = input<ListViewVariantProps["rounded"]>("medium");

    /**
     * @description Emitted once each time the list is scrolled to its end, when the list view isn't paged. Scrolling
     * away and back emits again, as does reaching the new end after more items are added.
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
        effect(() => {
            const disabledBy = this.disabledBy();
            untracked(() => this.listService.setDisabledBy(disabledBy ?? ""));
        });
        this.setScrollBottomEvent();
    }

    protected onItemActivate(item: ListItem<T>): void {
        this.itemActivate.emit(item.data);
    }

    protected onPageChange(event: PageChangeEvent): void {
        this.listService.pageState.update(s => ({ ...s, page: event.page, skip: event.skip, take: event.take }));
    }

    protected onPageSizeSelect(event: PageSizeChangeEvent): void {
        this.pageSizeSelect$.next(event);
    }

    /** Whether the scrolled element is this list view's own list or viewport, not a nested list view or template. */
    private isListScroll(target: EventTarget | null): boolean {
        if (
            !(target instanceof HTMLElement) ||
            target.closest("mona-list-view") !== this.#hostElementRef.nativeElement
        ) {
            return false;
        }
        return target.matches("cdk-virtual-scroll-viewport") || target.matches("mona-list > ul[role='listbox']");
    }

    /**
     * Scroll events don't bubble, so the host listens in the capture phase. That covers the list and the virtual
     * viewport whenever they are rendered, including ones created after the first render.
     */
    private setScrollBottomEvent(): void {
        const host = this.#hostElementRef.nativeElement;
        fromEvent<Event>(host, "scroll", { capture: true })
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(event => this.isListScroll(event.target)),
                filter(event => {
                    const target = event.target as HTMLElement;
                    const atBottom =
                        target.scrollHeight - target.scrollTop - target.clientHeight < SCROLL_BOTTOM_THRESHOLD;
                    const arrived = atBottom && !this.#atBottom;
                    this.#atBottom = atBottom;
                    return arrived && !this.listService.pageableOptions().enabled;
                })
            )
            .subscribe(event => this.scrollBottom.emit(event));
    }
}
