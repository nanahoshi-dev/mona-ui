import { computed, Injectable, OutputEmitterRef, signal } from "@angular/core";
import {
    from,
    IEnumerable,
    ImmutableList,
    ImmutableSet,
    Predicate,
    Selector,
    toImmutableSet
} from "@mirei/ts-collections";
import type { PagerSettings } from "mona-ui/list-view/models/PagerSettings";
import type { PageState } from "mona-ui/list-view/models/PageState";
import { ReplaySubject, Subject } from "rxjs";
import { FilterChangeEvent } from "../../filter-input/models/FilterChangeEvent";
import { FilterableOptions } from "../../models/FilterableOptions";
import { VirtualScrollOptions } from "../../models/VirtualScrollOptions";
import { GroupableOptions } from "../models/GroupableOptions";
import { ListItem } from "../models/ListItem";
import { ListKeySelector } from "../models/ListSelectors";
import { NavigableOptions } from "../models/NavigableOptions";
import { NavigationDirection } from "../models/NavigationDirection";
import { NavigationMode } from "../models/NavigationMode";
import { SelectableOptions } from "../models/SelectableOptions";

@Injectable()
export class ListService<TData> {
    readonly #data = signal(ImmutableList.create<TData>());
    readonly #listItems = computed(() => {
        const data = this.#data();
        return from(data)
            .select(item => new ListItem({ data: item, header: "" }))
            .toImmutableSet();
    });
    public readonly disabledBy = signal<string | Predicate<TData>>("");
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
    public readonly groupBy = signal<ListKeySelector<TData>>(null);
    public readonly groupableOptions = signal<GroupableOptions<TData, any>>({
        enabled: false,
        headerOrder: "asc"
    });
    public readonly highlightedItem = signal<ListItem<TData> | null>(null);
    public readonly itemFocusOut$ = new Subject<ListItem<TData>>();
    public readonly navigableOptions = signal<NavigableOptions>({
        enabled: false,
        mode: "select",
        wrap: false
    });
    public readonly pageState = signal<PageState>({ page: 1, skip: 0, take: 10 });
    public readonly pageableOptions = signal<PagerSettings>({
        enabled: false,
        firstLast: false,
        showInfo: true,
        pageSizeValues: true,
        previousNext: false,
        type: "numeric",
        visiblePages: 5
    });
    public readonly scrollToItem$ = new ReplaySubject<ListItem<TData>>(1);
    public readonly selectableOptions = signal<SelectableOptions>({
        mode: "single",
        enabled: false,
        toggleable: false
    });
    public readonly selectedKeys = signal(ImmutableSet.create<any>());
    public readonly selectedListItems = computed(() => {
        const selectedKeys = this.selectedKeys();
        return selectedKeys
            .select(key => this.#listItems().firstOrDefault(i => this.getSelectionKey(i) === key))
            .where(i => i != null)
            .toImmutableSet();
    });
    public readonly selectionChange$ = new Subject<ListItem<TData>>();
    public readonly textField = signal<string | Selector<TData, string>>("");
    public readonly valueField = signal<string | Selector<TData, any>>("");
    public readonly viewItems = computed(() => {
        const listItems = this.#listItems();
        const filterText = this.filterText();
        const groupableOptions = this.groupableOptions();
        const virtualScrollOptions = this.virtualScrollOptions();
        let enumerable: IEnumerable<ListItem<TData>> = listItems;
        if (filterText) {
            enumerable = enumerable.where(item => this.filterItem(item, filterText));
        }
        let resultEnumerable: IEnumerable<ListItem<TData>>;
        if (groupableOptions.enabled) {
            if (groupableOptions.orderBy) {
                if (groupableOptions.orderByDirection === "desc") {
                    enumerable = enumerable.orderByDescending(item => this.getOrderKey(item));
                } else {
                    enumerable = enumerable.orderBy(item => this.getOrderKey(item));
                }
            }
            let groupedEnumerable = enumerable.groupBy(item => this.getGroupField(item));
            if (groupableOptions.headerOrder) {
                if (groupableOptions.headerOrder === "desc") {
                    groupedEnumerable = groupedEnumerable.orderByDescending(g => g.key);
                } else {
                    groupedEnumerable = groupedEnumerable.orderBy(g => g.key);
                }
            }
            resultEnumerable = groupedEnumerable.selectMany(g => {
                const groupHeaderItem = new ListItem({ data: g.key, header: String(g.key) });
                return g.source.prepend(groupHeaderItem);
            });
        } else {
            resultEnumerable = enumerable;
        }
        const pageableOptions = this.pageableOptions();
        if (virtualScrollOptions.enabled) {
            return resultEnumerable.toImmutableSet();
        }
        if (pageableOptions.enabled) {
            const pageState = this.pageState();
            const skip = pageState.skip;
            const take = pageState.take;
            return toImmutableSet(this.skipTakeWithGroups(resultEnumerable.toArray(), skip, take));
        }
        return resultEnumerable.toImmutableSet();
    });
    public readonly virtualScrollOptions = signal<VirtualScrollOptions>({
        enabled: false,
        height: 28
    });
    public filterChange!: OutputEmitterRef<FilterChangeEvent>;
    public selectedKeysChange!: OutputEmitterRef<Array<any>>;

    public addNewDataItems(dataItems: Iterable<TData>): void {
        this.#data.update(list => list.addAll(dataItems));
    }

    public clearFilter(): void {
        this.filterText.set("");
    }

    public clearSelections(): void {
        this.selectedKeys.update(set => set.clear());
        this.highlightedItem.set(null);
    }

    public deselectItems(item: Iterable<ListItem<TData>>): void {
        const keys = from(item)
            .select(i => this.getSelectionKey(i))
            .toImmutableSet();
        this.selectedKeys.update(set => set.removeAll(keys));
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

    public getItemText(item: ListItem<TData>): string {
        const textField = this.textField();
        if (!textField) {
            return item.data?.toString() ?? "";
        }
        if (typeof textField === "string") {
            return (item.data as any)?.[textField] ?? "";
        }
        return textField(item.data);
    }

    public isDisabled(item: ListItem<TData>): boolean {
        const disabledBy = this.disabledBy();
        if (typeof disabledBy === "string") {
            return (item.data as any)?.[disabledBy] ?? false;
        }
        return disabledBy(item.data);
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

    public navigate(direction: NavigationDirection, mode: NavigationMode): ListItem<TData> | null {
        const navigableOptions = this.navigableOptions();
        if (!navigableOptions.enabled) {
            return null;
        }
        const viewItems = this.viewItems()
            .where(i => !i.header && !this.isDisabled(i))
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
            this.scrollToItem$.next(item);
        }
        return item;
    }

    public notifySelectionChange(item: ListItem<TData>): void {
        this.selectionChange$.next(item);
    }

    public selectItem(item: ListItem<TData>): void {
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
        const valueField = this.valueField();
        if (!valueField) {
            this.selectedKeys.update(set => set.clear().addAll(dataItems));
        } else {
            const selectedKeys = from(dataItems)
                .select(item => this.getDataItemSelectionKey(item))
                .toImmutableSet();
            this.selectedKeys.update(set => set.clear().addAll(selectedKeys));
        }
    }

    public setSelectedKeys(selectedKeys: Iterable<any>): void {
        this.selectedKeys.update(set => set.clear().addAll(selectedKeys));
    }

    public setTextField(textField: string | Selector<TData, string>): void {
        this.textField.set(textField);
    }

    public setValueField(valueField: string | Selector<TData, any>): void {
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

        if (typeof options.operator === "function") {
            return options.operator(text, filter);
        }

        switch (options.operator) {
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

    private getDataItemSelectionKey(dataItem: TData): any {
        const valueField = this.valueField();
        if (!valueField) {
            return dataItem;
        }
        if (typeof valueField === "string") {
            return (dataItem as any)?.[valueField] ?? dataItem;
        }
        return valueField(dataItem);
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
        return this.getDataItemSelectionKey(item.data);
    }

    private navigateForMultipleSelection(
        viewItems: IEnumerable<ListItem<TData>>,
        direction: NavigationDirection
    ): ListItem<TData> | null {
        const selectedKeys = this.selectedKeys();
        const firstItem = viewItems.first();
        if (selectedKeys.isEmpty() && !this.highlightedItem()) {
            this.highlightedItem.set(firstItem);
            return firstItem;
        }
        const firstSelectedItem = viewItems.firstOrDefault(i => selectedKeys.contains(this.getSelectionKey(i)));
        const lastSelectedItem = viewItems.lastOrDefault(i => selectedKeys.contains(this.getSelectionKey(i)));
        const lastHighlightedItem = this.highlightedItem();

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

    private navigateFirstForSingleSelection(
        viewItems: ImmutableSet<ListItem<TData>>,
        mode: NavigationMode
    ): ListItem<TData> | null {
        const firstItem = viewItems.first();
        if (mode === "select") {
            this.selectItem(firstItem);
            this.highlightedItem.set(null);
        } else {
            this.highlightedItem.set(firstItem);
        }
        return firstItem;
    }

    private navigateForSingleSelection(
        viewItems: ImmutableSet<ListItem<TData>>,
        direction: NavigationDirection,
        mode: NavigationMode
    ): ListItem<TData> | null {
        const selectedKeys = this.selectedKeys();
        const firstItem = viewItems.first();
        if (selectedKeys.isEmpty() && !this.highlightedItem()) {
            if (mode === "select") {
                this.selectItem(firstItem);
            } else {
                this.highlightedItem.set(firstItem);
            }
            return firstItem;
        } else if (selectedKeys.isEmpty() && this.highlightedItem()) {
            const highlightedItem = this.highlightedItem() as ListItem<TData>;
            if (mode === "select") {
                this.selectItem(highlightedItem);
                return highlightedItem;
            }
        }
        const selectedItem = viewItems.lastOrDefault(i => selectedKeys.contains(this.getSelectionKey(i)));
        const lastHighlightedItem = this.highlightedItem();
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
            this.selectItem(lastItem);
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
            if (item.header) {
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
                            if (items[i].header) {
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
        return result;
    }
}
