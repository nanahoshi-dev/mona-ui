import { CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport } from "@angular/cdk/scrolling";
import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChild,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    input,
    OnInit,
    output,
    Signal,
    TemplateRef,
    untracked,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { asyncScheduler, filter, fromEvent, Subject, tap } from "rxjs";
import { twMerge } from "tailwind-merge";
import { TextBoxComponent } from "../../../../inputs/text-box/components/text-box/text-box.component";
import { PlaceholderComponent } from "../../../../layout/placeholder/components/placeholder/placeholder.component";
import { FilterInputComponent } from "../../../filter-input/components/filter-input/filter-input.component";
import { FilterChangeEvent } from "../../../filter-input/models/FilterChangeEvent";
import { isTypeaheadKey, setupTypeahead } from "../../../utils/typeahead.util";
import { ListFooterTemplateDirective } from "../../directives/list-footer-template.directive";
import { ListGroupHeaderTemplateDirective } from "../../directives/list-group-header-template.directive";
import { ListHeaderTemplateDirective } from "../../directives/list-header-template.directive";
import { ListItemTemplateDirective } from "../../directives/list-item-template.directive";
import { ListItemDirective } from "../../directives/list-item.directive";
import { ListNoDataTemplateDirective } from "../../directives/list-no-data-template.directive";
import { ListItem } from "../../models/ListItem";
import { ListKeySelector } from "../../models/ListSelectors";
import { ListSizeInputType, ListSizeType } from "../../models/ListSizeType";
import { SelectionChangeEvent, SelectionSource } from "../../models/SelectionChangeEvent";
import { ListService } from "../../services/list.service";
import { listGroupHeaderVariants, listInnerListVariants, listVariants } from "../../styles/list.styles";
import { cycleThroughMatchedItems } from "../../utils/cycleThroughMatchedItems";
import { getListNavigationDirection } from "../../utils/getListNavigationDirection";
import { ListItemComponent } from "../list-item/list-item.component";

@Component({
    selector: "mona-list",
    imports: [
        FilterInputComponent,
        ListItemComponent,
        NgTemplateOutlet,
        ListItemDirective,
        PlaceholderComponent,
        CdkVirtualScrollViewport,
        CdkFixedSizeVirtualScroll,
        CdkVirtualForOf
    ],
    templateUrl: "./list.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        "[attr.tabindex]": "0",
        "[class]": "classes()",
        "[style.height]": "listHeight()",
        "[style.max-height]": "listMaxHeight()",
        "[style.width]": "listWidth()"
    }
})
export class ListComponent<TData> implements OnInit {
    readonly #destroyRef: DestroyRef = inject(DestroyRef);
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #typeaheadKey$ = new Subject<string>();
    private readonly filterInput = viewChild(FilterInputComponent);
    protected readonly classes = computed(() => {
        const classes = listVariants();
        return twMerge(classes);
    });
    protected readonly footerTemplate = contentChild(ListFooterTemplateDirective, { read: TemplateRef });
    protected readonly groupHeaderClasses = computed(() => {
        const listItemClass = this.listItemClass();
        const hasTemplate = this.groupHeaderTemplate() != null;
        const classes = listGroupHeaderVariants({ hasTemplate });
        return twMerge(classes, listItemClass);
    });
    protected readonly groupHeaderTemplate = contentChild(ListGroupHeaderTemplateDirective, { read: TemplateRef });
    protected readonly headerTemplate = contentChild(ListHeaderTemplateDirective, { read: TemplateRef });
    protected readonly itemTemplate = contentChild(ListItemTemplateDirective, { read: TemplateRef });
    protected readonly innerListClasses = computed(() => {
        const classes = listInnerListVariants();
        const listClass = this.listClass();
        return twMerge(classes, listClass);
    });
    protected readonly listHeight = computed(() => {
        const height = this.height();
        if (height == null) {
            return undefined;
        }
        if (typeof height === "number") {
            return `${height}px`;
        }
        return height;
    });
    protected readonly listMaxHeight = computed(() => {
        const maxHeight = this.maxHeight();
        if (maxHeight == null) {
            return undefined;
        }
        if (typeof maxHeight === "number") {
            return `${maxHeight}px`;
        }
        return maxHeight;
    });
    protected readonly listService = inject<ListService<TData>>(ListService);
    protected readonly listWidth: Signal<ListSizeType> = computed(() => {
        const width = this.width();
        if (width == null) {
            return undefined;
        }
        if (typeof width === "number") {
            return `${width}px`;
        }
        return width;
    });
    protected readonly noDataTemplate = contentChild(ListNoDataTemplateDirective, { read: TemplateRef });
    protected readonly viewportHeight: Signal<ListSizeType> = computed(() => {
        const listHeight = this.listHeight();
        if (listHeight) {
            return listHeight;
        }
        const items = this.listService.viewItems().size();
        const headerItems = this.listService
            .viewItems()
            .where(i => !!i.header)
            .count();
        const itemHeight = this.listService.virtualScrollOptions().height;
        const height = items * itemHeight + headerItems * 2;
        return `${height}px`;
    });
    protected readonly virtualScrollViewport = viewChild(CdkVirtualScrollViewport);

    public readonly data = input<Iterable<TData> | null | undefined>(null);
    public readonly focusOnMount = input(true);
    public readonly height = input<ListSizeInputType>(undefined);
    public readonly itemSelect = output<SelectionChangeEvent<TData>>();
    public readonly listClass = input<string>("");
    public readonly listId = input<string>("");
    public readonly listItemClass = input("");
    public readonly listItemStyle = input<Partial<CSSStyleDeclaration>>({});
    public readonly listStyle = input<Partial<CSSStyleDeclaration>>({});
    public readonly maxHeight = input<ListSizeInputType>(undefined);
    public readonly size = input<ReturnType<TextBoxComponent["size"]>>("medium"); // TODO: Update this to a cva variable when list styles are added
    public readonly textField = input<ListKeySelector<TData, string> | undefined>(null);
    public readonly width = input<ListSizeInputType>(undefined);

    public constructor() {
        effect(() => {
            const textField = this.textField();
            untracked(() => {
                if (textField != null) {
                    this.listService.setTextField(textField);
                }
            });
        });
        effect(() => {
            const data = this.data();
            untracked(() => {
                if (data != null) {
                    this.listService.setData(data);
                }
            });
        });
        afterNextRender({
            read: () => this.setInitialSelectionOrFocus()
        });
    }

    public ngOnInit(): void {
        this.setSubscriptions();
    }

    public onFilterChange(event: FilterChangeEvent): void {
        this.listService.filterChange.emit(event);
        if (!event.isDefaultPrevented()) {
            this.listService.setFilter(event.filter);
        }
    }

    public onListItemClick(item: ListItem<TData>): void {
        this.listService.highlightedItem.set(item);
        if (!this.listService.selectableOptions().enabled) {
            return;
        }
        this.selectItem(item);
        this.itemSelect.emit({ item, source: { via: "mouse" } });
    }

    private cycleThroughMatchedItems(buffer: string): void {
        const nextItem = cycleThroughMatchedItems(
            this.listService.viewItems(),
            this.listService.highlightedItem(),
            item => {
                const text = this.listService.getItemText(item);
                return text.toLowerCase().startsWith(buffer.toLowerCase());
            }
        );
        if (nextItem) {
            const navigationMode = this.listService.navigableOptions().mode;
            this.listService.highlightedItem.set(nextItem);
            if (navigationMode === "select") {
                this.selectItem(nextItem);
            }
            this.scrollToItem(nextItem, true, "instant");
        }
    }

    private focusToItem(item: ListItem<TData>): void {
        if (this.listService.navigableOptions().enabled) {
            this.listService.highlightedItem.set(item);
        }
        this.scrollToItem(item, true);
    }

    private handleNavigation(key: string): void {
        const direction = getListNavigationDirection(key);
        if (!direction) {
            return;
        }
        if (direction === "pageup" || direction === "pagedown") {
            this.handlePageScroll(direction);
            return;
        }
        const navigableOptions = this.listService.navigableOptions();
        const selectableOptions = this.listService.selectableOptions();
        const previousSelectedItems = this.listService.selectedListItems();
        const item = this.listService.navigate(direction, navigableOptions.mode, true);
        if (item && navigableOptions.mode === "select" && selectableOptions.enabled) {
            this.itemSelect.emit({ item, source: { via: "keyboard", key } });
            if (previousSelectedItems.contains(item)) {
                return;
            }
            if (this.listService.selectedKeysChange) {
                this.listService.selectedKeysChange.emit(this.listService.selectedKeys().toArray());
            }
        }
        const filterInput = this.filterInput();
        if (filterInput) {
            filterInput.focus();
        }
    }

    private handlePageScroll(direction: "pageup" | "pagedown"): void {
        const listElement = this.#hostElementRef.nativeElement.firstElementChild as HTMLElement;
        switch (direction) {
            case "pagedown": {
                const virtualScrollViewport = this.virtualScrollViewport();
                if (virtualScrollViewport) {
                    const scrollOffset = virtualScrollViewport.measureScrollOffset();
                    virtualScrollViewport.scrollToOffset(
                        scrollOffset + virtualScrollViewport.getViewportSize(),
                        "smooth"
                    );
                } else {
                    const top = listElement.scrollTop + listElement.clientHeight * 0.8;
                    listElement.scrollTo({ top, behavior: "smooth" });
                }
                break;
            }
            case "pageup": {
                const virtualScrollViewport = this.virtualScrollViewport();
                if (virtualScrollViewport) {
                    const scrollOffset = virtualScrollViewport.measureScrollOffset();
                    virtualScrollViewport.scrollToOffset(
                        scrollOffset - virtualScrollViewport.getViewportSize(),
                        "smooth"
                    );
                } else {
                    const top = listElement.scrollTop - listElement.clientHeight * 0.8;
                    listElement.scrollTo({ top, behavior: "smooth" });
                }
                break;
            }
        }
    }

    private scrollToItem(item: ListItem<TData>, focus: boolean, behavior: ScrollBehavior = "auto"): void {
        const element = this.#hostElementRef.nativeElement.querySelector(`[data-uid="${item.uid}"]`) as HTMLElement;
        if (element) {
            element.scrollIntoView({ block: "center", behavior });
            if (focus) {
                element.focus();
            }
        } else if (this.listService.virtualScrollOptions().enabled) {
            const index = this.listService.viewItems().toList().indexOf(item);
            const itemHeight = this.listService.virtualScrollOptions().height;
            const rect = this.#hostElementRef.nativeElement.getBoundingClientRect();
            const offset = itemHeight * index - rect.height / 2;
            asyncScheduler.schedule(() => {
                this.virtualScrollViewport()?.scrollToOffset(offset, behavior);
                const scrolledElement = this.#hostElementRef.nativeElement.querySelector(
                    `[data-uid="${item.uid}"]`
                ) as HTMLElement;
                if (scrolledElement) {
                    scrolledElement.focus();
                }
            });
        }
    }

    private selectItem(item: ListItem<TData>): void {
        const selectedItems = this.listService.selectedListItems();
        const options = this.listService.selectableOptions();

        if (!options.enabled) {
            return;
        }

        if (
            (options.mode === "single" && !selectedItems.contains(item)) ||
            (options.mode === "single" && options.toggleable) ||
            options.mode === "multiple" ||
            (options.mode === "single" && selectedItems.size() > 1)
        ) {
            this.listService.selectItem(item);
            this.listService.highlightedItem.set(item);
            if (this.listService.selectedKeysChange) {
                this.listService.selectedKeysChange.emit(this.listService.selectedKeys().toArray());
            }
        }
    }

    private setInitialSelectionOrFocus(): void {
        if (!this.focusOnMount()) {
            return;
        }
        const selectedItem = this.listService.selectedListItems().lastOrDefault();
        if (selectedItem) {
            this.focusToItem(selectedItem);
            return;
        }
        const firstItem = this.listService
            .viewItems()
            .where(i => !i.header && !this.listService.isDisabled(i))
            .firstOrDefault();
        if (firstItem) {
            this.focusToItem(firstItem);
        }
    }

    private setKeyboardEvents(): void {
        fromEvent<KeyboardEvent>(this.#hostElementRef.nativeElement, "keydown")
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(event => event.key === "Enter" || event.key === "NumPadEnter")
            )
            .subscribe((event: KeyboardEvent) => {
                const highlightedItem = this.listService.highlightedItem();
                const selectedItem = this.listService.selectedListItems().firstOrDefault();
                const source: SelectionSource = { via: "keyboard", key: event.key };
                if (highlightedItem) {
                    this.selectItem(highlightedItem);
                    this.itemSelect.emit({ item: highlightedItem, source });
                } else if (selectedItem) {
                    this.selectItem(selectedItem);
                    this.itemSelect.emit({ item: selectedItem, source });
                }
            });
    }

    private setNavigationEvents(): void {
        fromEvent<KeyboardEvent>(this.#hostElementRef.nativeElement, "keydown")
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(() => this.listService.navigableOptions().enabled),
                tap(event => {
                    const navigableOptions = this.listService.navigableOptions();
                    if (navigableOptions.enabled) {
                        event.preventDefault();
                    }
                })
            )
            .subscribe(event => {
                if (isTypeaheadKey(event.key)) {
                    event.preventDefault();
                    this.#typeaheadKey$.next(event.key);
                    return;
                }
                this.#typeaheadKey$.next("");
                this.handleNavigation(event.key);
            });
    }

    private setSubscriptions(): void {
        this.setNavigationEvents();
        this.setKeyboardEvents();
        this.setTypeaheadSubscription();
        this.listService.scrollToItem$
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => this.scrollToItem(event.item, event.focus));
        this.listService.focus$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            this.#hostElementRef.nativeElement.focus();
            this.setInitialSelectionOrFocus();
        });
        fromEvent(this.#hostElementRef.nativeElement, "focus")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => this.setInitialSelectionOrFocus());
        fromEvent<FocusEvent>(this.#hostElementRef.nativeElement, "focusout")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => {
                const next = event.relatedTarget as HTMLElement | null;
                if (next && this.#hostElementRef.nativeElement.contains(next)) {
                    return;
                }
                this.listService.highlightedItem.set(null);
            });
    }

    private setTypeaheadSubscription(): void {
        setupTypeahead(this.#typeaheadKey$)
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(buffer => this.cycleThroughMatchedItems(buffer));
    }
}
