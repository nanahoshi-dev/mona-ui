import { computed, inject, Injectable, linkedSignal, signal } from "@angular/core";
import {
    from,
    IEnumerable,
    ImmutableList,
    ImmutableSet,
    Predicate,
    Selector,
    toImmutableSet
} from "@mirei/ts-collections";
import { FilterableOptions, FilterChangeEvent, VirtualScrollOptions } from "@nanahoshi/mona-ui/common";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { ReplaySubject, Subject } from "rxjs";
import { GroupableOptions } from "../models/GroupableOptions";
import { ListItem } from "../models/ListItem";
import { ListKeySelector } from "../models/ListSelectors";
import { NavigableOptions } from "../models/NavigableOptions";
import { NavigationDirection } from "../models/NavigationDirection";
import { NavigationMode } from "../models/NavigationMode";
import { PagerSettings } from "../models/PagerSettings";
import { PageState } from "../models/PageState";
import { SelectableOptions } from "../models/SelectableOptions";
import { cycleThroughMatchedItems } from "../utils/cycleThroughMatchedItems";
import { formatGroupHeader, toGroupKey } from "../utils/groupKey";

@Injectable()
export class ListService<TData> {
    readonly #arrangedItems = computed(() => {
        const listItems = this.#listItems();
        const filterText = this.filterText();
        const groupableOptions = this.groupableOptions();
        let enumerable: IEnumerable<ListItem<TData>> = listItems;
        if (filterText) {
            enumerable = enumerable.where(item => this.filterItem(item, filterText));
        }
        if (!groupableOptions.enabled) {
            return enumerable.toImmutableSet();
        }
        if (groupableOptions.orderBy) {
            if (groupableOptions.orderByDirection === "desc") {
                enumerable = enumerable.orderByDescending(item => this.getOrderKey(item));
            } else {
                enumerable = enumerable.orderBy(item => this.getOrderKey(item));
            }
        }
        // Dates group by their time, so equal dates share a group and header order is chronological.
        let groupedEnumerable = enumerable.groupBy(item => toGroupKey(this.getGroupField(item)));
        if (groupableOptions.headerOrder) {
            if (groupableOptions.headerOrder === "desc") {
                groupedEnumerable = groupedEnumerable.orderByDescending(g => g.key);
            } else {
                groupedEnumerable = groupedEnumerable.orderBy(g => g.key);
            }
        }
        const localeId = this.#i18n.localeId();
        const formatters = {
            date: new Intl.DateTimeFormat(localeId, { dateStyle: "medium" }),
            number: new Intl.NumberFormat(localeId, { useGrouping: false })
        };
        const previousHeaders = this.#groupHeaders;
        const headers = new Map<unknown, ListItem<TData>>();
        const items = groupedEnumerable
            .selectMany(g => {
                // The header carries the first item's group value (a Date stays a Date for the header template).
                const value = this.getGroupField(g.source.first());
                const text = groupableOptions.headerText
                    ? groupableOptions.headerText(value)
                    : formatGroupHeader(value, formatters);
                const previous = previousHeaders.get(g.key);
                const header =
                    previous && previous.header === text && previous.data === value
                        ? previous
                        : new ListItem<TData>({ data: value, header: text, isHeader: true, uid: previous?.uid });
                headers.set(g.key, header);
                return g.source.prepend(header);
            })
            .toImmutableSet();
        this.#groupHeaders = headers;
        return items;
    });
    readonly #data = signal(ImmutableList.create<TData>());
    readonly #i18n = inject(MonaI18nService);
    /**
     * First list item for each selection key, so key lookups are O(1) instead of a scan per key.
     */
    readonly #itemsByKey = computed(() => {
        const itemsByKey = new Map<unknown, ListItem<TData>>();
        for (const item of this.#listItems()) {
            const key = this.getSelectionKey(item);
            if (!itemsByKey.has(key)) {
                itemsByKey.set(key, item);
            }
        }
        return itemsByKey;
    });
    readonly #itemsByUid = computed(() => {
        const itemsByUid = new Map<string, ListItem<TData>>();
        for (const item of this.#listItems()) {
            itemsByUid.set(item.uid, item);
        }
        return itemsByUid;
    });
    /**
     * Wraps the data in list items while keeping item identity across data changes:
     * an item whose selection key existed before keeps its `uid`, and keeps its instance when the data
     * object is also unchanged. Highlight, `aria-activedescendant` ids and rendered rows therefore survive
     * a refresh (for example server-side filtering) instead of pointing at items that no longer exist.
     */
    readonly #listItems = linkedSignal<
        { data: ImmutableList<TData>; valueField: string | Selector<TData, unknown> },
        ImmutableSet<ListItem<TData>>
    >({
        source: () => ({ data: this.#data(), valueField: this.valueField() }),
        computation: ({ data }, previous) => {
            const previousByKey = new Map<unknown, ListItem<TData>>();
            for (const item of previous?.value ?? []) {
                const key = this.getSelectionKey(item);
                if (!previousByKey.has(key)) {
                    previousByKey.set(key, item);
                }
            }
            const usedUids = new Set<string>();
            const items: Array<ListItem<TData>> = [];
            for (const dataItem of data) {
                const previousItem = previousByKey.get(this.getDataItemValue(dataItem));
                let item: ListItem<TData>;
                if (previousItem && !usedUids.has(previousItem.uid)) {
                    item =
                        previousItem.data === dataItem
                            ? previousItem
                            : new ListItem({ data: dataItem, uid: previousItem.uid });
                } else {
                    item = new ListItem({ data: dataItem });
                }
                usedUids.add(item.uid);
                items.push(item);
            }
            return toImmutableSet(items);
        }
    });

    /**
     * Group header items from the last grouping pass, reused so header rows keep their uid between recomputations.
     */
    #groupHeaders = new Map<unknown, ListItem<TData>>();

    public readonly disabledBy = signal<string | Predicate<TData>>("");
    public readonly filterChange$ = new Subject<FilterChangeEvent>();
    public readonly filterInputVisible = signal(true);
    public readonly filterPlaceholder = signal("");
    public readonly filterText = signal("");
    public readonly filterableOptions = signal<FilterableOptions>({
        enabled: false,
        caseSensitive: false,
        debounce: 0,
        operator: "contains"
    });
    public readonly focus$ = new Subject<void>();
    /**
     * The option that holds the list's Tab stop: the highlighted one, else the last selected one, else the first
     * enabled one. Only shown items count, so a selection on another page doesn't take the Tab stop away.
     */
    public readonly focusableItem = computed(() => {
        const viewItems = this.viewItems();
        const highlighted = this.highlightedItem();
        if (highlighted && viewItems.contains(highlighted)) {
            return highlighted;
        }
        const selected = this.selectedListItems().lastOrDefault(item => viewItems.contains(item));
        if (selected) {
            return selected;
        }
        return viewItems.firstOrDefault(i => !i.isHeader && !this.isDisabled(i));
    });
    public readonly groupBy = signal<ListKeySelector<TData>>(null);
    /**
     * Maps each option uid to the uid of the group header it is listed under.
     */
    public readonly groupHeaderUids = computed(() => {
        const headerUids = new Map<string, string>();
        let headerUid: string | null = null;
        for (const item of this.#arrangedItems()) {
            if (item.isHeader) {
                headerUid = item.uid;
            } else if (headerUid != null) {
                headerUids.set(item.uid, headerUid);
            }
        }
        return headerUids;
    });
    public readonly groupableOptions = signal<GroupableOptions<TData, any>>({
        enabled: false,
        headerOrder: "asc"
    });
    /**
     * The highlighted (active) item. When the data changes, it is re-resolved to the item with the same `uid`,
     * or cleared when that item is gone.
     */
    public readonly highlightedItem = linkedSignal<ImmutableSet<ListItem<TData>>, ListItem<TData> | null>({
        source: this.#listItems,
        computation: (_, previous) => {
            const highlighted = previous?.value;
            if (!highlighted || highlighted.isHeader) {
                return null;
            }
            return this.#itemsByUid().get(highlighted.uid) ?? null;
        }
    });
    public readonly itemFocusOut$ = new Subject<ListItem<TData>>();
    /**
     * Position of each option among all filtered options (not only the current page), for `aria-posinset`
     * and `aria-setsize`.
     */
    public readonly itemPositions = computed(() => {
        const options = this.#arrangedItems()
            .where(i => !i.isHeader)
            .toArray();
        const positions = new Map<string, { position: number; total: number }>();
        options.forEach((item, index) => {
            positions.set(item.uid, { position: index + 1, total: options.length });
        });
        return positions;
    });
    public readonly navigableOptions = signal<NavigableOptions>({
        enabled: false,
        mode: "select",
        wrap: false
    });
    public readonly navigatedItem$ = new Subject<ListItem<TData> | null>();
    public readonly pageState = signal<PageState>({ page: 1, skip: 0, take: 10 });
    public readonly pageableOptions = signal<PagerSettings>({
        enabled: false,
        firstLast: false,
        showInfo: true,
        pageSize: 10,
        pageSizeValues: true,
        previousNext: false,
        type: "numeric",
        visiblePages: 5
    });
    /**
     * `"listbox"` for options to choose from; `"list"` for items that are only shown, as `listitem`s without
     * selection state.
     */
    public readonly role = signal<"list" | "listbox">("listbox");
    public readonly scrollToItem$ = new ReplaySubject<{
        item: ListItem<TData>;
        focus: boolean;
    }>(1);
    public readonly selectableOptions = signal<SelectableOptions>({
        checkboxes: false,
        enabled: false,
        mode: "single",
        toggleable: false
    });
    public readonly selectedKeys = signal(ImmutableSet.create<any>());
    public readonly selectedKeysChange$ = new Subject<Array<any>>();
    public readonly selectedListItems = computed(() => {
        const selectedKeys = this.selectedKeys();
        const itemsByKey = this.#itemsByKey();
        return selectedKeys
            .select(key => itemsByKey.get(key))
            .where((i): i is ListItem<TData> => i != null)
            .toImmutableSet();
    });
    public readonly selectionChange$ = new Subject<ListItem<TData>>();
    public readonly textField = signal<string | Selector<TData, string>>("");
    public readonly valueField = signal<string | Selector<TData, unknown>>("");
    /**
     * Visible items in display order: filtered, ordered and grouped (with header rows), but not paged.
     */
    public readonly viewItems = computed(() => {
        const arrangedItems = this.#arrangedItems();
        const pageableOptions = this.pageableOptions();
        if (this.virtualScrollOptions().enabled || !pageableOptions.enabled) {
            return arrangedItems;
        }
        const pageState = this.pageState();
        return toImmutableSet(this.skipTakeWithGroups(arrangedItems.toArray(), pageState.skip, pageState.take));
    });
    public readonly virtualScrollOptions = signal<VirtualScrollOptions>({
        enabled: false,
        height: 28
    });

    public clearFilter(): void {
        this.filterText.set("");
    }

    public clearHighlightedItem(): void {
        this.highlightedItem.set(null);
    }

    public clearSelections(): void {
        this.selectedKeys.update(set => set.clear());
        this.highlightedItem.set(null);
    }

    /**
     * Finds the next item whose text starts with the typeahead buffer, starting after the active item.
     * Group headers and disabled items are never matched.
     */
    public cycleThroughMatchedItems(buffer: string): ListItem<TData> | null {
        const activeItem = this.highlightedItem() || this.selectedListItems().lastOrDefault();
        const prefix = buffer.toLowerCase();
        return cycleThroughMatchedItems(this.viewItems(), activeItem ?? null, item => {
            if (item.isHeader || this.isDisabled(item)) {
                return false;
            }
            return this.getItemText(item).toLowerCase().startsWith(prefix);
        });
    }

    public deselectItems(item: Iterable<ListItem<TData>>): void {
        const keys = from(item)
            .select(i => this.getSelectionKey(i))
            .toImmutableSet();
        this.selectedKeys.update(set => set.removeAll(keys));
    }

    /**
     * Resolves the selection value of a data item through `valueField`.
     *
     * When no `valueField` is configured, the data item itself is the value.
     * When `valueField` is a string, the item property is read with a nullish fallback to the item.
     * When `valueField` is a function, its result is used as-is.
     *
     * Falsy results such as `0`, `false`, and `""` are valid values and do not fall back to the item.
     */
    public getDataItemValue(dataItem: TData): unknown {
        const valueField = this.valueField();

        if (!valueField) {
            return dataItem;
        }

        if (typeof valueField === "string") {
            return (dataItem as Record<string, unknown> | null)?.[valueField] ?? dataItem;
        }

        return valueField(dataItem);
    }

    public getFilterDebounceDuration(): number {
        const filterableOptions = this.filterableOptions();
        return filterableOptions.enabled ? filterableOptions.debounce : 0;
    }

    public getGroupField(item: ListItem<TData>): any {
        const groupSelector = this.groupBy();
        if (groupSelector == null) {
            return "";
        }
        if (typeof groupSelector === "string") {
            return (item.data as any)?.[groupSelector] ?? "";
        }
        return groupSelector(item.data);
    }

    /**
     * Returns the uid of the group header an item is rendered under, or `null` when the list is not grouped.
     */
    public getGroupHeaderUid(item: ListItem<TData>): string | null {
        return this.groupHeaderUids().get(item.uid) ?? null;
    }

    public getItemPosition(item: ListItem<TData>): { position: number; total: number } | null {
        return this.itemPositions().get(item.uid) ?? null;
    }

    /**
     * Resolves the display text of an item through `textField`.
     * Non-string field values (numbers, dates, …) are converted with `String()`, and nullish values become `""`.
     */
    public getItemText(item: ListItem<TData>): string {
        const textField = this.textField();
        let text: unknown;
        if (!textField) {
            text = item.data;
        } else if (typeof textField === "string") {
            text = (item.data as Record<string, unknown> | null)?.[textField];
        } else {
            text = textField(item.data);
        }
        return text == null ? "" : String(text);
    }

    /**
     * Finds the item that typed text should resolve to: an exact text match first (respecting `caseSensitive`),
     * otherwise the first item accepted by the filter operator. Group headers and disabled items are skipped.
     */
    public getMatchingFilteredItem(text: string): ListItem<TData> | null {
        const filterableOptions = this.filterableOptions();
        const caseSensitive = filterableOptions.enabled ? filterableOptions.caseSensitive : false;
        const candidates = this.viewItems().where(i => !i.isHeader && !this.isDisabled(i));
        const fullMatchingItem = candidates.firstOrDefault(i => {
            const itemText = this.getItemText(i);
            return caseSensitive ? itemText === text : itemText.toLowerCase() === text.toLowerCase();
        });
        if (fullMatchingItem) {
            return fullMatchingItem;
        }
        return candidates.firstOrDefault(i => this.filterItem(i, text));
    }

    /**
     * Whether a data item is disabled by `disabledBy`, whether or not it is in the list.
     */
    public isDataItemDisabled(dataItem: TData): boolean {
        const disabledBy = this.disabledBy();
        if (typeof disabledBy === "string") {
            return disabledBy !== "" && Boolean((dataItem as Record<string, unknown> | null)?.[disabledBy]);
        }
        return disabledBy(dataItem);
    }

    public isDisabled(item: ListItem<TData>): boolean {
        return !item.isHeader && this.isDataItemDisabled(item.data);
    }

    public isFilteringEnabled(): boolean {
        const filterableOptions = this.filterableOptions();
        return filterableOptions.enabled;
    }

    public isHighlighted(item: ListItem<TData>): boolean {
        const highlightedItem = this.highlightedItem();
        return highlightedItem === item;
    }

    public isSelected(item: ListItem<TData>): boolean {
        const options = this.selectableOptions();
        if (!options.enabled) {
            return false;
        }
        const selectedKeys = this.selectedKeys();
        const key = this.getSelectionKey(item);
        return selectedKeys.contains(key);
    }

    public navigate(direction: NavigationDirection, mode: NavigationMode, focus: boolean): ListItem<TData> | null {
        const navigableOptions = this.navigableOptions();
        if (!navigableOptions.enabled) {
            return null;
        }
        const viewItems = this.viewItems()
            .where(i => !i.isHeader && !this.isDisabled(i))
            .toImmutableSet();
        if (viewItems.isEmpty()) {
            return null;
        }
        const selectableOptions = this.selectableOptions();
        if (mode === "select" && (!selectableOptions.enabled || selectableOptions.mode === "multiple")) {
            mode = "highlight";
        }
        let item: ListItem<TData> | null;
        if (selectableOptions.mode === "single") {
            item = this.navigateForSingleSelection(viewItems, direction, mode);
        } else {
            item = this.navigateForMultipleSelection(viewItems, direction);
        }
        if (item) {
            this.scrollToItem$.next({ item, focus });
            this.navigatedItem$.next(item);
        }
        return item;
    }

    public notifySelectionChange(item: ListItem<TData>): void {
        this.selectionChange$.next(item);
    }

    public scrollToItem(item: ListItem<TData>, focus: boolean): void {
        this.scrollToItem$.next({ item, focus });
    }

    /**
     * Selects every enabled item currently in view, keeping existing selections. Only applies in multiple mode.
     * @returns whether the selection changed.
     */
    public selectAllItems(): boolean {
        const options = this.selectableOptions();
        if (!options.enabled || options.mode !== "multiple") {
            return false;
        }
        const keys = this.viewItems()
            .where(i => !i.isHeader && !this.isDisabled(i))
            .select(i => this.getSelectionKey(i))
            .toArray();
        const selectedKeys = this.selectedKeys();
        if (keys.every(key => selectedKeys.contains(key))) {
            return false;
        }
        this.selectedKeys.update(set => set.addAll(keys));
        return true;
    }

    public selectItem(item: ListItem<TData>, scroll: boolean = false, focus: boolean = false): void {
        const key = this.getSelectionKey(item);
        const options = this.selectableOptions();
        if (options.mode === "single") {
            if (options.toggleable) {
                this.selectedKeys.update(set => {
                    if (set.contains(key)) {
                        if (set.size() > 1) {
                            return set.where(k => k === key).toImmutableSet();
                        }
                        return set.remove(key);
                    }
                    return set.clear().add(key);
                });
            } else {
                this.selectedKeys.update(set => set.clear().add(key));
            }
        } else {
            this.selectedKeys.update(set => {
                if (set.contains(key)) {
                    return set.remove(key);
                }
                return set.add(key);
            });
        }
        if (scroll) {
            this.scrollToItem(item, focus);
        }
        this.notifySelectionChange(item);
    }

    public setData(data: Iterable<TData>) {
        this.#data.update(list => list.clear().addAll(data));
    }

    public setDisabledBy(disabledBy: string | Predicate<TData>): void {
        this.disabledBy.set(disabledBy);
    }

    public setFilter(filter: string): void {
        this.filterText.set(filter);
    }

    public setFilterPlaceholder(placeholder: string): void {
        this.filterPlaceholder.set(placeholder);
    }

    public setFilterableOptions(options: Partial<FilterableOptions>): void {
        this.filterableOptions.update(o => ({ ...o, ...options }));
    }

    public setGroupBy(groupSelector: ListKeySelector<TData>): void {
        this.groupBy.set(groupSelector);
    }

    public setGroupableOptions(options: GroupableOptions<TData, any>): void {
        this.groupableOptions.update(o => ({ ...o, ...options }));
    }

    public setNavigableOptions(options: Partial<NavigableOptions>): void {
        this.navigableOptions.update(o => ({ ...o, ...options }));
    }

    public setPageableOptions(settings: PagerSettings): void {
        this.pageableOptions.set(settings);
    }

    public setSelectableOptions(options: Partial<SelectableOptions>): void {
        this.selectableOptions.update(o => ({ ...o, ...options }));
    }

    public setSelectedDataItems(dataItems: Iterable<TData>): void {
        const selectedKeys = from(dataItems)
            .select(item => this.getDataItemValue(item))
            .toImmutableSet();
        this.selectedKeys.update(set => set.clear().addAll(selectedKeys));
    }

    public setSelectedKeys(selectedKeys: Iterable<unknown>): void {
        this.selectedKeys.update(set => set.clear().addAll(selectedKeys));
    }

    public setTextField(textField: string | Selector<TData, string>): void {
        this.textField.set(textField);
    }

    public setValueField(valueField: string | Selector<TData, unknown>): void {
        this.valueField.set(valueField);
    }

    public setVirtualScrollOptions(options: VirtualScrollOptions): void {
        this.virtualScrollOptions.update(o => ({ ...o, ...options }));
    }

    private filterItem(item: ListItem<TData>, filterText: string): boolean {
        if (filterText === "") {
            return true;
        }

        const options = this.filterableOptions();
        const itemText = this.getItemText(item);
        const text = options.caseSensitive ? itemText : itemText.toLowerCase();
        const filter = options.caseSensitive ? filterText : filterText.toLowerCase();
        const operator = options.enabled ? options.operator : "startsWith";

        if (typeof operator === "function") {
            return operator(text, filter);
        }

        switch (operator) {
            case "contains":
                return text.includes(filter);
            case "startsWith":
                return text.startsWith(filter);
            case "endsWith":
                return text.endsWith(filter);
            default:
                return false;
        }
    }

    /**
     * Returns the item when it is one of the navigable items, otherwise `null`.
     * An anchor that was filtered out or removed must not be navigated from.
     */
    private getItemInView(
        viewItems: ImmutableSet<ListItem<TData>>,
        item: ListItem<TData> | null
    ): ListItem<TData> | null {
        return item != null && viewItems.contains(item) ? item : null;
    }

    private getOrderKey(item: ListItem<TData>): any {
        const orderBy = this.groupableOptions().orderBy;
        if (orderBy) {
            if (typeof orderBy === "string") {
                return (item.data as any)[orderBy];
            } else {
                return orderBy(item.data);
            }
        }
        return null;
    }

    private getPreviousItemForNavigation(
        viewItems: IEnumerable<ListItem<TData>>,
        navigationItem: ListItem<TData>
    ): ListItem<TData> | null {
        let prevItem = viewItems.takeWhile(i => i !== navigationItem).lastOrDefault(i => !this.isDisabled(i));
        if (prevItem == null) {
            const lastItem = viewItems.lastOrDefault(i => !this.isDisabled(i));
            if (this.navigableOptions().wrap) {
                prevItem = lastItem;
            } else if (!this.navigableOptions().wrap) {
                prevItem = navigationItem;
            }
        }
        return prevItem;
    }

    private getSelectionKey(item: ListItem<TData>): any {
        return this.getDataItemValue(item.data);
    }

    private navigateFirstForSingleSelection(
        viewItems: ImmutableSet<ListItem<TData>>,
        mode: NavigationMode
    ): ListItem<TData> | null {
        const firstItem = viewItems.first();
        if (mode === "select") {
            if (!this.isSelected(firstItem)) {
                this.selectItem(firstItem);
            }
            this.highlightedItem.set(null);
        } else {
            this.highlightedItem.set(firstItem);
        }
        return firstItem;
    }

    private navigateForMultipleSelection(
        viewItems: ImmutableSet<ListItem<TData>>,
        direction: NavigationDirection
    ): ListItem<TData> | null {
        const selectedKeys = this.selectedKeys();
        const firstItem = viewItems.first();
        if (direction === "first" || direction === "last") {
            const edgeItem = direction === "first" ? firstItem : viewItems.last();
            this.highlightedItem.set(edgeItem);
            return edgeItem;
        }
        const lastHighlightedItem = this.getItemInView(viewItems, this.highlightedItem());
        if (selectedKeys.isEmpty() && !lastHighlightedItem) {
            this.highlightedItem.set(firstItem);
            return firstItem;
        }
        const firstSelectedItem = viewItems.firstOrDefault(i => selectedKeys.contains(this.getSelectionKey(i)));
        const lastSelectedItem = viewItems.lastOrDefault(i => selectedKeys.contains(this.getSelectionKey(i)));

        if (direction === "next") {
            const navigationItem = lastHighlightedItem ?? lastSelectedItem ?? firstItem;
            let nextItem = viewItems
                .skipWhile(i => i !== navigationItem)
                .skip(1)
                .firstOrDefault(i => !this.isDisabled(i));
            if (nextItem == null) {
                const firstItem = viewItems.firstOrDefault(i => !this.isDisabled(i));
                if (this.navigableOptions().wrap) {
                    nextItem = firstItem;
                } else if (!this.navigableOptions().wrap) {
                    nextItem = navigationItem;
                }
            }
            if (nextItem) {
                this.highlightedItem.set(nextItem);
                return nextItem;
            }
        } else {
            const navigationItem = lastHighlightedItem ?? firstSelectedItem ?? firstItem;
            const prevItem = this.getPreviousItemForNavigation(viewItems, navigationItem);
            if (prevItem) {
                this.highlightedItem.set(prevItem);
                return prevItem;
            }
        }
        return null;
    }

    private navigateForSingleSelection(
        viewItems: ImmutableSet<ListItem<TData>>,
        direction: NavigationDirection,
        mode: NavigationMode
    ): ListItem<TData> | null {
        const selectedKeys = this.selectedKeys();
        const firstItem = viewItems.first();
        const lastHighlightedItem = this.getItemInView(viewItems, this.highlightedItem());
        if (selectedKeys.isEmpty() && !lastHighlightedItem) {
            if (direction === "last") {
                return this.navigateLastForSingleSelection(viewItems, mode);
            }
            if (mode === "select") {
                this.selectItem(firstItem);
            } else {
                this.highlightedItem.set(firstItem);
            }
            return firstItem;
        } else if (selectedKeys.isEmpty() && lastHighlightedItem) {
            if (mode === "select") {
                this.selectItem(lastHighlightedItem);
                return lastHighlightedItem;
            }
        }
        const selectedItem = viewItems.lastOrDefault(i => selectedKeys.contains(this.getSelectionKey(i)));
        const navigationItem = lastHighlightedItem ?? selectedItem ?? firstItem;
        if (direction === "next") {
            return this.navigateNextForSingleSelection(viewItems, navigationItem, mode, firstItem);
        } else if (direction === "previous") {
            return this.navigatePreviousForSingleSelection(viewItems, navigationItem, mode);
        } else if (direction === "first") {
            return this.navigateFirstForSingleSelection(viewItems, mode);
        } else if (direction === "last") {
            return this.navigateLastForSingleSelection(viewItems, mode);
        }
        return null;
    }

    private navigateLastForSingleSelection(
        viewItems: ImmutableSet<ListItem<TData>>,
        mode: NavigationMode
    ): ListItem<TData> | null {
        const lastItem = viewItems.last();
        if (mode === "select") {
            if (!this.isSelected(lastItem)) {
                this.selectItem(lastItem);
            }
            this.highlightedItem.set(null);
        } else {
            this.highlightedItem.set(lastItem);
        }
        return lastItem;
    }

    private navigateNextForSingleSelection(
        viewItems: IEnumerable<ListItem<TData>>,
        navigationItem: ListItem<TData>,
        mode: NavigationMode,
        firstItem: ListItem<TData>
    ): ListItem<TData> | null {
        let nextItem = viewItems
            .skipWhile(i => i !== navigationItem)
            .skip(1)
            .firstOrDefault(i => !this.isDisabled(i));
        if (nextItem == null) {
            if (this.navigableOptions().wrap) {
                nextItem = firstItem;
            } else if (!this.navigableOptions().wrap) {
                nextItem = navigationItem;
            }
        }
        if (nextItem) {
            if (mode === "select") {
                const previouslySelectedItem = this.selectedListItems().firstOrDefault();
                if (previouslySelectedItem === nextItem) {
                    return null;
                }
                this.selectItem(nextItem);
                this.highlightedItem.set(null);
            } else {
                this.highlightedItem.set(nextItem);
            }
            return nextItem;
        }
        return null;
    }

    private navigatePreviousForSingleSelection(
        viewItems: IEnumerable<ListItem<TData>>,
        navigationItem: ListItem<TData>,
        mode: NavigationMode
    ): ListItem<TData> | null {
        const prevItem = this.getPreviousItemForNavigation(viewItems, navigationItem);
        if (!prevItem) {
            return null;
        }
        if (mode === "select") {
            const previouslySelectedItem = this.selectedListItems().firstOrDefault();
            if (previouslySelectedItem === prevItem) {
                return null;
            }
            this.selectItem(prevItem);
            this.highlightedItem.set(null);
        } else {
            this.highlightedItem.set(prevItem);
        }
        return prevItem;
    }

    private skipTakeWithGroups(items: ListItem<TData>[], skip: number, take: number): ListItem<TData>[] {
        let skipped = 0;
        let taken = 0;
        let capturing = false;
        const result: ListItem<TData>[] = [];

        for (const item of items) {
            if (item.isHeader) {
                // Include group headers when we're capturing
                if (capturing) {
                    result.push(item);
                }
            } else {
                // Handle regular items
                if (!capturing && skipped < skip) {
                    skipped++;
                    continue;
                }
                if (taken < take) {
                    // Check if we need to include the group header for this item
                    if (!capturing && result.length === 0) {
                        // Find the group header for this item
                        const itemIndex = items.indexOf(item);
                        for (let i = itemIndex - 1; i >= 0; i--) {
                            if (items[i].isHeader) {
                                result.push(items[i]);
                                break;
                            }
                        }
                    }
                    capturing = true;
                    result.push(item);
                    taken++;
                } else {
                    break;
                }
            }
        }

        // Remove trailing group headers if they are at the end
        let lastIndex = result.length - 1;
        while (lastIndex >= 0 && result[lastIndex].isHeader) {
            result.pop();
            lastIndex--;
        }
        return result;
    }
}
