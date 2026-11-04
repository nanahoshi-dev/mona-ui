import { CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport } from "@angular/cdk/scrolling";
import { NgTemplateOutlet } from "@angular/common";
import type { ListRange } from "@angular/cdk/collections";
import {
    afterNextRender,
    afterRenderEffect,
    booleanAttribute,
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
    signal,
    TemplateRef,
    untracked,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FilterChangeEvent } from "@nanahoshi/mona-ui/common";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { createElementControlId, isTypeaheadKey, setupTypeahead } from "@nanahoshi/mona-ui/internal";
import { FilterInputComponent } from "@nanahoshi/mona-ui/internal/filter-input";
import { PlaceholderComponent } from "@nanahoshi/mona-ui/placeholder";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";
import { asyncScheduler, filter, fromEvent, Subject, tap } from "rxjs";
import { twMerge } from "tailwind-merge";
import { LIST_DEFAULT_MESSAGES } from "../../i18n/list.default-messages";
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
import { listGroupHeaderThemeVariants, listInnerListThemeVariants, listThemeVariants } from "../../styles/list.styles";
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
    host: {
        "[attr.tabindex]": "hostTabIndex()",
        "[class]": "classes()",
        "[style.height]": "listHeight()",
        "[style.max-height]": "listMaxHeight()",
        "[style.max-width]": "listMaxWidth()",
        "[style.width]": "listWidth()"
    }
})
export class ListComponent<TData> implements OnInit {
    readonly #destroyRef: DestroyRef = inject(DestroyRef);
    readonly #generatedListId = createElementControlId();
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #i18n = inject(MonaI18nService);
    /** The rows a virtual list has drawn, so the Tab stop never lands on an option that isn't in the DOM. */
    readonly #renderedRange = signal<ListRange | null>(null);
    readonly #typeaheadKey$ = new Subject<string>();
    /** The option that had focus, kept so focus can move to a neighbour when that option is removed. */
    #focusedOption: { readonly index: number; readonly uid: string } | null = null;
    private readonly filterInput = viewChild(FilterInputComponent);
    private readonly filterInputElement = viewChild(FilterInputComponent, { read: ElementRef });
    /**
     * Id of the highlighted option, used as `aria-activedescendant` by the filter input.
     */
    protected readonly activeDescendant = computed(() => {
        const item = this.listService.highlightedItem();
        return item && !item.isHeader ? item.uid : null;
    });
    protected readonly classes = computed(() => {
        const classes = listThemeVariants();
        return twMerge(classes);
    });
    /**
     * The `listId` input, or a generated id so the listbox can always be referenced by `aria-controls`.
     */
    protected readonly effectiveListId = computed(() => this.listId() || this.#generatedListId);
    /** The empty list element covers the "No data" content and shows the focus ring when it has focus. */
    protected readonly emptyListClasses = computed(() =>
        twMerge(
            this.innerListClasses(),
            "absolute inset-0 focus-visible:inset-ring-2 focus-visible:inset-ring-focus-indicator"
        )
    );
    protected readonly footerTemplate = contentChild(ListFooterTemplateDirective, { read: TemplateRef });
    protected readonly groupHeaderClasses = computed(() => {
        const listItemClass = this.listItemClass();
        const hasTemplate = this.groupHeaderTemplate() != null;
        const classes = listGroupHeaderThemeVariants({ hasTemplate });
        return twMerge(classes, listItemClass);
    });
    protected readonly groupHeaderTemplate = contentChild(ListGroupHeaderTemplateDirective, { read: TemplateRef });
    protected readonly headerTemplate = contentChild(ListHeaderTemplateDirective, { read: TemplateRef });
    /**
     * The host takes the Tab stop when no option can: every option is disabled, or a virtual list's focusable option
     * is scrolled out of the drawn rows. Focusing the host then moves focus to that option.
     */
    protected readonly hostTabIndex = computed(() => {
        const item = this.listService.focusableItem();
        if (!item) {
            // An empty list element is its own Tab stop.
            return this.listService.viewItems().isEmpty() ? -1 : 0;
        }
        if (!this.listService.virtualScrollOptions().enabled) {
            return -1;
        }
        const range = this.#renderedRange();
        const index = this.listService.viewItems().toArray().indexOf(item);
        return range && index >= range.start && index < range.end ? -1 : 0;
    });
    protected readonly innerListClasses = computed(() => {
        const classes = listInnerListThemeVariants();
        const listClass = this.listClass();
        return twMerge(classes, listClass);
    });
    protected readonly itemTemplate = contentChild(ListItemTemplateDirective, { read: TemplateRef });
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
    protected readonly listMaxWidth = computed(() => {
        const maxWidth = this.maxWidth();
        if (maxWidth == null) {
            return undefined;
        }
        if (typeof maxWidth === "number") {
            return `${maxWidth}px`;
        }
        return maxWidth;
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
    protected readonly messages = this.#i18n.componentMessages("list", LIST_DEFAULT_MESSAGES);
    /** Id of the "No data" content, which describes an empty list. */
    protected readonly noDataId = `${this.#generatedListId}-no-data`;
    protected readonly noDataTemplate = contentChild(ListNoDataTemplateDirective, { read: TemplateRef });
    /**
     * The shown items split at group headers: a section without a header holds ungrouped items.
     */
    protected readonly viewSections = computed(() => {
        const sections: Array<{ header: ListItem<TData> | null; items: Array<ListItem<TData>>; key: string }> = [];
        for (const item of this.listService.viewItems()) {
            if (item.isHeader) {
                sections.push({ header: item, items: [], key: item.uid });
                continue;
            }
            if (sections.length === 0) {
                sections.push({ header: null, items: [], key: "" });
            }
            sections[sections.length - 1].items.push(item);
        }
        return sections;
    });
    protected readonly viewportHeight: Signal<ListSizeType> = computed(() => {
        const listHeight = this.listHeight();
        if (listHeight) {
            return listHeight;
        }
        const items = this.listService.viewItems().size();
        const headerItems = this.listService
            .viewItems()
            .where(i => i.isHeader)
            .count();
        const itemHeight = this.listService.virtualScrollOptions().height ?? 28;
        const height = items * itemHeight + headerItems * 2;
        return `${height}px`;
    });
    protected readonly virtualScrollViewport = viewChild(CdkVirtualScrollViewport);

    /**
     * @description Accessible name for the list's `listbox` element. Describe what the list represents.
     * @default ""
     */
    public readonly ariaLabel = input<string>("");

    /**
     * @description Id of the element that names the list, as an alternative to `ariaLabel`.
     * @default ""
     */
    public readonly ariaLabelledBy = input<string>("");

    /**
     * @description Marks the list as loading (`aria-busy`).
     * @default false
     */
    public readonly busy = input(false, { transform: booleanAttribute });

    public readonly data = input<Iterable<TData> | null | undefined>(null);
    public readonly focusOnMount = input(true);
    public readonly height = input<ListSizeInputType>(undefined);

    /**
     * @description Emitted when the user activates an enabled item by clicking it or pressing Enter on it, whether or
     * not the list is selectable.
     */
    public readonly itemActivate = output<ListItem<TData>>();
    public readonly itemSelect = output<SelectionChangeEvent<TData>>();
    public readonly listClass = input<string>("");
    public readonly listId = input<string>("");
    public readonly listItemClass = input("");
    public readonly listItemStyle = input<Partial<CSSStyleDeclaration>>({});

    /**
     * @description `"listbox"` for options to choose from, `"list"` for items that are only shown.
     * @default "listbox"
     */
    public readonly listRole = input<"list" | "listbox">("listbox");
    public readonly listStyle = input<Partial<CSSStyleDeclaration>>({});
    public readonly maxHeight = input<ListSizeInputType>();
    public readonly maxWidth = input<ListSizeInputType>();
    public readonly size = input<ReturnType<TextBoxComponent["size"]>>("medium"); // TODO: Update this to a cva variable when list styles are added
    public readonly textField = input<ListKeySelector<TData, string> | undefined>(null);
    public readonly width = input<ListSizeInputType>();

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
        effect(() => {
            const listRole = this.listRole();
            untracked(() => this.listService.role.set(listRole));
        });
        effect(onCleanup => {
            const viewport = this.virtualScrollViewport();
            if (!viewport) {
                this.#renderedRange.set(null);
                return;
            }
            const subscription = viewport.renderedRangeStream.subscribe(range => this.#renderedRange.set(range));
            onCleanup(() => subscription.unsubscribe());
        });
        afterRenderEffect({
            write: () => {
                this.listService.viewItems();
                untracked(() => this.restoreFocusAfterRemoval());
            }
        });
        afterNextRender({
            read: () => this.setInitialSelectionOrFocus()
        });
    }

    public ngOnInit(): void {
        this.setSubscriptions();
    }

    protected onFilterChange(event: FilterChangeEvent): void {
        this.listService.filterChange$.next(event);
        if (!event.isDefaultPrevented()) {
            this.listService.setFilter(event.filter);
        }
    }

    protected onListItemClick(item: ListItem<TData>): void {
        this.toggleItem(item);
        if (!item.isHeader && !this.listService.isDisabled(item)) {
            this.itemActivate.emit(item);
        }
    }

    protected trackByUid(_: number, item: ListItem<TData>): string {
        return item.uid;
    }

    private cycleThroughMatchedItems(buffer: string): void {
        const nextItem = this.listService.cycleThroughMatchedItems(buffer);
        if (nextItem) {
            const navigationMode = this.listService.navigableOptions().mode;
            const selectableOptions = this.listService.selectableOptions();
            this.listService.highlightedItem.set(nextItem);
            // In multiple mode typeahead only moves focus, as the arrow keys do: selecting would toggle the match.
            if (navigationMode === "select" && selectableOptions.enabled && selectableOptions.mode !== "multiple") {
                this.selectItem(nextItem);
                this.itemSelect.emit({ item: nextItem, source: { via: "keyboard", key: buffer } });
            }
            this.scrollToItem(nextItem, true, "instant");
        }
    }

    /** Focuses the list element of an empty list, which names the list and is described by "No data". */
    private focusEmptyList(): void {
        const id = this.effectiveListId();
        const list = Array.from(this.#hostElementRef.nativeElement.querySelectorAll("ul")).find(
            element => element.id === id
        );
        list?.focus({ preventScroll: true });
    }

    private focusToItem(item: ListItem<TData>): void {
        if (this.listService.navigableOptions().enabled) {
            this.listService.highlightedItem.set(item);
        }
        this.scrollToItem(item, this.filterInput() == null);
    }

    /**
     * Handles multiple-selection shortcuts from the WAI-ARIA listbox pattern:
     * Space toggles the highlighted option and Ctrl/Cmd+A selects every enabled option.
     * @returns whether the event was handled.
     */
    private handleMultipleSelectionKeys(event: KeyboardEvent): boolean {
        const selectableOptions = this.listService.selectableOptions();
        if (!selectableOptions.enabled || selectableOptions.mode !== "multiple") {
            return false;
        }
        if (event.key === " " && !event.ctrlKey && !event.metaKey && !event.altKey) {
            const highlightedItem = this.listService.highlightedItem();
            if (highlightedItem && !this.listService.isDisabled(highlightedItem)) {
                this.selectItem(highlightedItem);
                this.itemSelect.emit({ item: highlightedItem, source: { via: "keyboard", key: event.key } });
            }
            return true;
        }
        if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "a") {
            if (this.listService.selectAllItems()) {
                this.listService.selectedKeysChange$.next(this.listService.selectedKeys().toArray());
            }
            return true;
        }
        return false;
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
        const filterInput = this.filterInput();
        // With a filter input, focus stays in the input and the active option is conveyed by aria-activedescendant.
        const item = this.listService.navigate(direction, navigableOptions.mode, filterInput == null);
        if (item && navigableOptions.mode === "select" && selectableOptions.enabled) {
            this.itemSelect.emit({ item, source: { via: "keyboard", key } });
            if (previousSelectedItems.contains(item)) {
                return;
            }
            this.listService.selectedKeysChange$.next(this.listService.selectedKeys().toArray());
        }
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

    /**
     * Whether a key event is meant for the list: from the host, the list element, one of this list's own options or
     * its filter input. Keys typed into controls in header, footer or item templates (or in a nested list) are left
     * to those controls.
     */
    private isListKeyTarget(event: KeyboardEvent): boolean {
        const host = this.#hostElementRef.nativeElement;
        const target = event.target;
        if (!(target instanceof HTMLElement) || target === host) {
            return true;
        }
        if (this.filterInputElement()?.nativeElement.contains(target)) {
            return true;
        }
        const ownElement = target.closest("mona-list") === host;
        return ownElement && (target.hasAttribute("data-uid") || target.id === this.effectiveListId());
    }

    private rememberFocusedOption(target: EventTarget | null): void {
        if (!(target instanceof HTMLElement) || target.closest("mona-list") !== this.#hostElementRef.nativeElement) {
            return;
        }
        const uid = target.getAttribute("data-uid");
        if (uid == null) {
            return;
        }
        const options = this.listService
            .viewItems()
            .where(i => !i.isHeader)
            .toArray();
        const index = options.findIndex(i => i.uid === uid);
        this.#focusedOption = index < 0 ? null : { index, uid };
        // The focused option is where arrow keys continue from, whether it got focus by Tab, click or script.
        if (
            index >= 0 &&
            this.listService.navigableOptions().enabled &&
            this.listService.highlightedItem() !== options[index]
        ) {
            this.listService.highlightedItem.set(options[index]);
        }
    }

    /**
     * When the option that had focus is removed from the data, focus would fall to the page. Move it to the option
     * now at the same position, or the last one.
     */
    private restoreFocusAfterRemoval(): void {
        const focused = this.#focusedOption;
        if (!focused) {
            return;
        }
        const options = this.listService
            .viewItems()
            .where(i => !i.isHeader)
            .toArray();
        if (options.some(i => i.uid === focused.uid)) {
            return;
        }
        const activeElement = document.activeElement;
        if (
            activeElement &&
            activeElement !== document.body &&
            this.#hostElementRef.nativeElement.contains(activeElement)
        ) {
            return;
        }
        if (activeElement && activeElement !== document.body) {
            this.#focusedOption = null;
            return;
        }
        const enabled = options.filter(i => !this.listService.isDisabled(i));
        const next = enabled[Math.min(focused.index, enabled.length - 1)];
        if (!next) {
            this.#focusedOption = null;
            this.#hostElementRef.nativeElement.focus();
            return;
        }
        this.focusToItem(next);
    }

    private scrollToItem(item: ListItem<TData>, focus: boolean, behavior: ScrollBehavior = "auto"): void {
        const element = this.#hostElementRef.nativeElement.querySelector(`[data-uid="${item.uid}"]`) as HTMLElement;
        if (element) {
            // "nearest" avoids scrolling the page when the option is already visible.
            element.scrollIntoView({ block: "nearest", behavior });
            if (focus) {
                element.focus({ preventScroll: true });
            }
        } else if (this.listService.virtualScrollOptions().enabled) {
            const index = this.listService.viewItems().toList().indexOf(item);
            const itemHeight = this.listService.virtualScrollOptions().height ?? 28;
            const rect = this.#hostElementRef.nativeElement.getBoundingClientRect();
            const offset = itemHeight * index - rect.height / 2;
            asyncScheduler.schedule(() => {
                this.virtualScrollViewport()?.scrollToOffset(offset, behavior);
                const scrolledElement = this.#hostElementRef.nativeElement.querySelector(
                    `[data-uid="${item.uid}"]`
                ) as HTMLElement;
                if (scrolledElement && focus) {
                    scrolledElement.focus({ preventScroll: true });
                }
            });
        }
    }

    private selectItem(item: ListItem<TData>): void {
        const selectedItems = this.listService.selectedListItems();
        const options = this.listService.selectableOptions();

        // A disabled item can't be selected, whether it is clicked, typed to or activated with Enter.
        if (!options.enabled || this.listService.isDisabled(item)) {
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
            this.listService.selectedKeysChange$.next(this.listService.selectedKeys().toArray());
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
            .where(i => !i.isHeader && !this.listService.isDisabled(i))
            .firstOrDefault();
        if (firstItem) {
            this.focusToItem(firstItem);
        }
    }

    private setKeyboardEvents(): void {
        fromEvent<KeyboardEvent>(this.#hostElementRef.nativeElement, "keydown")
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(event => event.key === "Enter" && !event.isComposing && this.isListKeyTarget(event)),
                tap(event => event.preventDefault())
            )
            .subscribe((event: KeyboardEvent) => {
                const highlightedItem = this.listService.highlightedItem();
                const selectedItem = this.listService.selectedListItems().firstOrDefault();
                const source: SelectionSource = { via: "keyboard", key: event.key };
                const item = highlightedItem ?? selectedItem;
                if (item) {
                    this.selectItem(item);
                    this.itemSelect.emit({ item, source });
                    if (!item.isHeader && !this.listService.isDisabled(item)) {
                        this.itemActivate.emit(item);
                    }
                }
            });
    }

    private setNavigationEvents(): void {
        fromEvent<KeyboardEvent>(this.#hostElementRef.nativeElement, "keydown")
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(event => this.listService.navigableOptions().enabled && this.isListKeyTarget(event))
            )
            .subscribe(event => {
                if (this.handleMultipleSelectionKeys(event)) {
                    event.preventDefault();
                    return;
                }
                if (isTypeaheadKey(event.key, event)) {
                    event.preventDefault();
                    this.#typeaheadKey$.next(event.key);
                    return;
                }
                // Alt+Arrow is left to the page and to components built on the list (the list box moves items with it).
                if (getListNavigationDirection(event.key) == null || event.altKey) {
                    return;
                }
                event.preventDefault();
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
        fromEvent<FocusEvent>(this.#hostElementRef.nativeElement, "focus")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => {
                const previous = event.relatedTarget as HTMLElement | null;
                if (previous && this.#hostElementRef.nativeElement.contains(previous)) {
                    return;
                }
                if (this.listService.viewItems().isEmpty()) {
                    this.focusEmptyList();
                    return;
                }
                if (this.focusOnMount()) {
                    this.setInitialSelectionOrFocus();
                    return;
                }
                // The host only holds the Tab stop while its option isn't drawn; hand focus on to that option.
                const item = this.listService.focusableItem();
                if (item) {
                    this.focusToItem(item);
                }
            });
        fromEvent<FocusEvent>(this.#hostElementRef.nativeElement, "focusin")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => this.rememberFocusedOption(event.target));
        fromEvent<FocusEvent>(this.#hostElementRef.nativeElement, "focusout")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => {
                const next = event.relatedTarget as HTMLElement | null;
                if (next && this.#hostElementRef.nativeElement.contains(next)) {
                    return;
                }
                this.#focusedOption = null;
                this.listService.highlightedItem.set(null);
            });
    }

    private setTypeaheadSubscription(): void {
        setupTypeahead(this.#typeaheadKey$)
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(buffer => this.cycleThroughMatchedItems(buffer));
    }

    private toggleItem(item: ListItem<TData>): void {
        this.listService.highlightedItem.set(item);
        if (!this.listService.selectableOptions().enabled) {
            return;
        }
        this.selectItem(item);
        this.itemSelect.emit({ item, source: { via: "mouse" } });
    }
}
