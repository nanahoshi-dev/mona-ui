import { isPlatformBrowser } from "@angular/common";
import { computed, DOCUMENT, inject, Injectable, PLATFORM_ID, signal, TemplateRef } from "@angular/core";
import { toObservable } from "@angular/core/rxjs-interop";
import {
    any,
    Dictionary,
    ImmutableDictionary,
    ImmutableList,
    ImmutableSet,
    KeyValuePair,
    select
} from "@mirei/ts-collections";
import { BehaviorSubject, Subject } from "rxjs";
import { VirtualScrollOptions } from "../../common/models/VirtualScrollOptions";
import { PopupMenuItem } from "../../common/popup-menu/models/PopupMenuItem";
import { Query } from "../../query/core/Query";
import { CompositeFilterDescriptor, FilterDescriptor } from "../../query/filter/FilterDescriptor";
import { SortDescriptor } from "../../query/sort/SortDescriptor";
import type { DeepPartial } from "../../utils/deepMerge";
import { createIterablePatchStore } from "../../utils/PatchStore";
import { CellEditEvent } from "../models/CellEditEvent";
import { RowEditEvent } from "../models/RowEditEvent";
import { Column } from "../models/Column";
import { ColumnFilterState } from "../models/ColumnFilterState";
import { ColumnSortState } from "../models/ColumnSortState";
import { EditableOptions } from "../models/EditableOptions";
import type { GridEditContext } from "../models/GridEditContext";
import { GridKeySelector } from "../models/GridKeySelector";
import { GridSelectableOptions } from "../models/GridSelectableOptions";
import { GroupableOptions } from "../models/GroupableOptions";
import { GroupDescriptor } from "../models/GroupDescriptor";
import { PaginationState } from "../models/PaginationState";
import { Row } from "../models/Row";
import { SortableOptions } from "../models/SortableOptions";

// Flat projection of a Row used as the IterablePatchStore item type.
// $rowId is injected to carry the row identity without modifying Row.data.
interface RowEditDataItem extends Record<string, unknown> {
    readonly $rowId: string;
}

@Injectable()
export class GridService {
    readonly #document = inject(DOCUMENT);
    readonly #editContext = signal<GridEditContext | null>(null);
    readonly #editSource = computed(() =>
        this.rows()
            .select<RowEditDataItem>(r => ({ $rowId: r.uid, ...r.data }))
            .toImmutableSet()
    );
    readonly #editStore = createIterablePatchStore<RowEditDataItem, string>({
        baseChangeStrategy: "wipe",
        idOf: item => item.$rowId,
        source: () => this.#editSource
    });
    readonly #platformId = inject(PLATFORM_ID);
    readonly #textMeasureCache = new Map<string, number>();
    public readonly appliedFilters = signal(ImmutableDictionary.create<string, ColumnFilterState>());
    public readonly appliedGroupSorts = signal(ImmutableDictionary.create<string, ColumnSortState>());
    public readonly appliedSorts = signal(ImmutableDictionary.create<string, ColumnSortState>());
    public readonly bodyTableElement = signal<HTMLTableElement | null>(null);
    public readonly cellEdit$ = new Subject<CellEditEvent>();
    /** Set of currently collapsed group keys (global, shared by both paginated and virtual list). */
    public readonly collapsedGroupKeys = signal(ImmutableSet.create<string>());
    public readonly columns = signal<ImmutableList<Column>>(ImmutableList.create());
    public readonly contextMenuItems = signal(ImmutableSet.create<PopupMenuItem>());
    public readonly detailColumnWidth = 34;
    public readonly editBaseDict = computed(() => {
        const pairs = this.#editSource().select(item => new KeyValuePair(item.$rowId, item));
        return ImmutableDictionary.create(pairs);
    });
    public readonly editContext = this.#editContext.asReadonly();
    public readonly editPristine = this.#editStore.pristine;
    public readonly editViewDict = computed(() => {
        const pairs = this.#editStore.view().map(item => new KeyValuePair(item.$rowId, item));
        return ImmutableDictionary.create(pairs);
    });
    public readonly editableOptions = signal<EditableOptions>({ enabled: false, mode: "cell" });
    public readonly editingCellUid = computed(() => {
        const context = this.#editContext();
        return context?.mode === "cell" ? context.cellUid : null;
    });
    public readonly editingRowUid = computed(() => this.#editContext()?.rowUid ?? null);
    public readonly expandedKeys = signal(ImmutableSet.create());
    public readonly gridHeaderElement = signal<HTMLDivElement | null>(null);
    public readonly groupColumnWidth = 34;
    public readonly groupColumns = signal<ImmutableSet<Column>>(ImmutableSet.create());
    public readonly groupableOptions = signal<GroupableOptions>({ enabled: false });
    public readonly headerTableElement = signal<HTMLTableElement | null>(null);
    public readonly isInEditMode = computed(() => this.#editContext() != null);
    public readonly masterDetailEmptyCellWidth = computed(() => {
        return this.detailColumnWidth * (this.groupColumns().size() + 1);
    });
    public readonly masterDetailRowWidth = computed(() => {
        const groupColumns = this.groupColumns();
        const columns = this.columns();
        const groupColumnWidth = this.groupColumnWidth;
        const groupColumnCount = groupColumns.size();
        const columnListWidth = columns.aggregate((acc, c) => acc + (c.calculatedWidth() ?? c.width() ?? 0), 0);
        return groupColumnWidth * (groupColumnCount + 1) + columnListWidth;
    });
    public readonly masterDetailTemplate = signal<TemplateRef<any> | null>(null);
    public readonly paginationState = signal<PaginationState>({ page: 1, skip: 0, take: 10 });
    public readonly rowEdit$ = new Subject<RowEditEvent>();
    public readonly scrollEnd$ = new Subject<void>();
    public readonly scrollEndThreshold = signal<number>(5);
    public readonly rows = signal<ImmutableSet<Row>>(ImmutableSet.create());
    public readonly selectBy = signal<GridKeySelector<unknown>>("");
    public readonly selectableOptions = signal<GridSelectableOptions>({ enabled: false, mode: "single" });
    public readonly selectedKeys = signal(ImmutableSet.create());
    public readonly selectedKeysChange$ = toObservable(this.selectedKeys);
    public readonly selectedKeysLoad$ = new BehaviorSubject<ImmutableSet<unknown>>(ImmutableSet.create());
    public readonly selectedRows = computed(() => {
        const selectedKeys = this.selectedKeys();
        return selectedKeys
            .select(key => this.rows().firstOrDefault(r => this.getRowSelectionKey(r) === key))
            .where(i => i != null)
            .toImmutableSet();
    });
    public readonly selectedRowsChange$ = toObservable(this.selectedRows);
    public readonly sortableOptions = signal<SortableOptions>({
        enabled: false,
        mode: "single",
        allowUnsort: true,
        showIndices: true
    });
    public readonly tableWidth = computed(() => {
        const columns = this.columns();
        if (!columns.any()) {
            return null;
        }
        if (columns.any(c => c.calculatedWidth() == null && c.width() == null)) {
            return null;
        }
        const dataWidth = columns.aggregate((acc, c) => acc + (c.calculatedWidth() ?? c.width() ?? 0), 0);
        const groupWidth = this.groupColumnWidth * this.groupColumns().size();
        const detailWidth = this.masterDetailTemplate() != null ? this.detailColumnWidth : 0;
        return dataWidth + groupWidth + detailWidth;
    });
    public readonly viewPageRows = computed(() => {
        const skip = this.paginationState().skip;
        const take = this.paginationState().take;
        const viewRows = this.viewRows();
        if (!viewRows.any()) {
            return ImmutableSet.create<Row>();
        }
        return viewRows.skip(skip).take(take).toImmutableSet();
    });
    public readonly viewRowCount = computed(() => this.viewRows().size());
    public readonly viewRows = computed(() => {
        const rows = this.rows();
        const appliedFilters = this.appliedFilters();
        const appliedSorts = this.appliedSorts();
        const groupColumns = this.groupColumns();

        let queryEnumerable = Query.from(rows);
        for (const filter of appliedFilters) {
            if (filter.value.filter) {
                queryEnumerable = queryEnumerable.filter(filter.value.filter, r => r.data);
            }
        }

        if (groupColumns.any()) {
            const groupDescriptors = this.getGroupDescriptors(groupColumns);
            const sortStates = groupDescriptors.map<SortDescriptor>(d => ({ field: d.field, dir: d.dir ?? "asc" }));
            queryEnumerable = queryEnumerable.sort(sortStates, r => r.data);
        }

        const appliedNonGroupSorts = appliedSorts
            .values()
            .where(state => !groupColumns.any(c => c.field() === state.sort.field));

        if (appliedNonGroupSorts.any()) {
            const sortState = appliedNonGroupSorts.select(d => d.sort).toArray();
            queryEnumerable = queryEnumerable.sort(sortState, r => r.data);
        }
        const result = queryEnumerable.run();
        return ImmutableSet.create(result);
    });
    public readonly virtualGridMaxBuffer = computed(() => this.virtualGridMinBuffer() * 1.42857);
    public readonly virtualGridMinBuffer = signal(0);
    public readonly virtualScrollOptions = signal<VirtualScrollOptions>({ enabled: false, height: 28 });

    public cancelEdit(): void {
        const rowUid = this.#editContext()?.rowUid;
        this.#editContext.set(null);
        if (rowUid) {
            this.#editStore.clear(rowUid);
        }
    }

    public clearCollapsedGroups(predicate?: (key: string) => boolean): void {
        if (predicate) {
            this.collapsedGroupKeys.update(keys => keys.where(k => !predicate(k)).toImmutableSet());
        } else {
            this.collapsedGroupKeys.update(keys => keys.clear());
        }
    }

    public commitRowEdit(): void {
        const context = this.#editContext();
        if (!context || context.mode !== "row") {
            return;
        }
        this.#editContext.set(null);
        this.#editStore.clear(context.rowUid);
        this.rowEdit$.next(new RowEditEvent({ rowData: context.row.data }));
    }

    public deselectAllRows(): void {
        this.selectedKeys.update(set => set.clear());
    }

    public findTextWidthOfColumn(column: Column, element: HTMLTableCellElement): number {
        if (!isPlatformBrowser(this.#platformId)) {
            return 0;
        }
        let longestValue = this.findLongestCellContentOfColumn(column);
        if (column.title().length > longestValue.length) {
            longestValue = column.title();
        }
        const documentBodyStyle = window.getComputedStyle(this.#document.body);
        const fontFamily = documentBodyStyle.getPropertyValue("font-family");
        const fontSize = documentBodyStyle.getPropertyValue("font-size");
        const titleElement = element.querySelector(".mona-grid-column-title");
        const actionsElement = element.querySelector("[data-column-actions]");
        const actionsWidth = actionsElement ? actionsElement.clientWidth : 0;
        const leftRightPadding = titleElement
            ? parseInt(window.getComputedStyle(titleElement).paddingLeft, 10) +
              parseInt(window.getComputedStyle(titleElement).paddingRight, 10)
            : 0;
        const totalAdditionalWidth = actionsWidth + leftRightPadding;
        const fontKey = `${fontSize} ${fontFamily}`;
        const cacheKey = `${fontKey}|${longestValue}`;
        const cached = this.#textMeasureCache.get(cacheKey);
        if (cached != null) {
            return cached + totalAdditionalWidth;
        }
        const canvas = this.#document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (context == null) {
            return 0;
        }
        context.font = fontKey;
        const measured = context.measureText(longestValue).width;
        this.#textMeasureCache.set(cacheKey, measured);
        return measured + totalAdditionalWidth;
    }

    public getGroupDescriptors(columns: Iterable<Column>): GroupDescriptor[] {
        return select(columns, c => ({
            field: c.field(),
            dir: c.groupSortDirection() ?? undefined
        })).toArray();
    }

    public handleMultipleSelection(event: MouseEvent, row: Row): void {
        if (!this.selectedRows().contains(row)) {
            this.selectRow(row);
        } else if (event.ctrlKey || event.metaKey) {
            this.selectedKeys.update(set => set.remove(this.getRowSelectionKey(row)));
        }
    }

    public handleRowClick(event: MouseEvent, row: Row): void {
        if (!this.isSelectableGrid()) {
            return;
        }
        if (this.selectableOptions().mode === "single") {
            this.handleSingleSelection(event, row);
        } else {
            this.handleMultipleSelection(event, row);
        }
    }

    public handleSingleSelection(event: MouseEvent, row: Row): void {
        if (this.isRowSelected(row) && (event.ctrlKey || event.metaKey)) {
            this.deselectAllRows();
        } else {
            this.deselectAllRows();
            this.selectRow(row);
        }
    }

    public isRowExpanded(row: Row): boolean {
        return this.expandedKeys().contains(this.getRowSelectionKey(row));
    }

    public isGroupCollapsed(groupKey: string): boolean {
        return this.collapsedGroupKeys().contains(groupKey);
    }

    public toggleGroupCollapse(groupKey: string): void {
        this.collapsedGroupKeys.update(keys => (keys.contains(groupKey) ? keys.remove(groupKey) : keys.add(groupKey)));
    }

    public isRowSelected(row: Row): boolean {
        return this.selectedRows().contains(row);
    }

    public isSelectableGrid(): boolean {
        return !!this.selectableOptions().enabled;
    }

    public loadFilters(filters: CompositeFilterDescriptor[]): void {
        const newAppliedFilters = new Dictionary<string, ColumnFilterState>();
        for (const filter of filters) {
            const filter1 = filter.filters[0] as FilterDescriptor;
            const filter2 = filter.filters[1] as FilterDescriptor;
            const column = this.columns().firstOrDefault(c => c.field() === filter1.field);
            if (column != null) {
                newAppliedFilters.add(column.field(), {
                    filter: filter,
                    filterMenuValue: {
                        value1: filter1 && "value" in filter1 ? filter1.value : undefined,
                        value2: filter2 && "value" in filter2 ? filter2.value : undefined,
                        operator1: filter1 ? filter1.operator : undefined,
                        operator2: filter2 ? filter2.operator : undefined,
                        logic: filter.logic || "and"
                    }
                });
            }
        }
        this.columns().forEach(c => c.setFiltered(newAppliedFilters.containsKey(c.field())));
        this.appliedFilters.set(
            newAppliedFilters.toImmutableDictionary(
                p => p.key,
                p => p.value
            )
        );
    }

    public loadGroupColumns(descriptors: Iterable<GroupDescriptor>): void {
        const columns = this.columns();
        const groupColumns = columns.where(c => any(descriptors, d => d.field === c.field()));
        const currentGroupColumns = this.groupColumns();
        if (groupColumns.orderBy(c => c.field()).sequenceEqual(currentGroupColumns.orderBy(c => c.field()))) {
            return;
        }
        for (const descriptor of descriptors) {
            const column = columns.firstOrDefault(c => c.field() === descriptor.field);
            if (column != null) {
                column.setGroupSortDirection(descriptor.dir ?? "asc");
                this.appliedGroupSorts.update(v =>
                    v.add(column.field(), { sort: { field: descriptor.field, dir: descriptor.dir ?? "asc" } })
                );
            }
        }
        this.groupColumns.set(ImmutableSet.create(groupColumns));
    }

    public loadSelectedKeys(selectedKeys: Iterable<unknown>): void {
        this.selectedKeys.update(set => set.clear().addAll(selectedKeys));
        this.selectedKeysLoad$.next(this.selectedKeys());
    }

    public loadSorts(sorts: SortDescriptor[]): void {
        const newAppliedSorts = new Dictionary<string, ColumnSortState>();
        for (const [index, sort] of sorts.entries()) {
            const column = this.columns().firstOrDefault(c => c.field() === sort.field);
            if (column != null) {
                newAppliedSorts.add(column.field(), {
                    sort: sort
                });
                column.setSortIndex(index + 1);
                column.setColumnSortDirection(sort.dir);
            }
        }
        this.appliedSorts.set(
            newAppliedSorts.toImmutableDictionary(
                p => p.key,
                p => p.value
            )
        );
    }

    public patchCellEdit(rowUid: string, field: string, value: unknown): void {
        this.#editStore.patch(rowUid, { [field]: value } as DeepPartial<RowEditDataItem>);
    }

    public selectRow(row: Row): void {
        const key = this.getRowSelectionKey(row);
        this.selectedKeys.update(set => set.add(key));
    }

    public setEditableOptions(options: EditableOptions): void {
        this.editableOptions.update(v => ({ ...v, ...options }));
    }

    public setGroupableOptions(options: Partial<GroupableOptions>): void {
        this.groupableOptions.update(v => ({ ...v, ...options }));
    }

    public setPageState(state: Partial<PaginationState>): void {
        this.paginationState.update(v => ({ ...v, ...state }));
    }

    public setRowExpanded(row: Row, expanded: boolean): void {
        const key = this.getRowSelectionKey(row);
        this.expandedKeys.update(set => (expanded ? set.add(key) : set.remove(key)));
    }

    public setRows(value: Iterable<any>): void {
        this.rows.set(ImmutableSet.create(select(value, r => new Row(r))));
    }

    public setSelectableOptions(options: GridSelectableOptions): void {
        this.selectableOptions.update(v => ({ ...v, ...options }));
    }

    public setSortableOptions(options: Partial<SortableOptions>): void {
        this.sortableOptions.update(v => ({ ...v, ...options }));
    }

    public setScrollEndThreshold(threshold: number): void {
        this.scrollEndThreshold.set(threshold);
    }

    public setVirtualScrollOptions(options: VirtualScrollOptions): void {
        this.virtualScrollOptions.update(v => ({ ...v, ...options }));
    }

    public startCellEdit(uid: string, row: Row, column: Column): void {
        this.#editContext.set({ cellUid: uid, column, mode: "cell", row, rowUid: row.uid });
    }

    public startRowEdit(row: Row): void {
        this.#editContext.set({ mode: "row", row, rowUid: row.uid });
    }

    public stopCellEdit(): void {
        const context = this.#editContext();
        if (!context || context.mode !== "cell") {
            return;
        }
        this.#editContext.set(null);
        const oldValue = context.row.data[context.column.field()];
        const editedRowData = this.editViewDict().get(context.rowUid);
        const resolvedValue = editedRowData?.[context.column.field()] ?? oldValue;
        const event = new CellEditEvent({
            field: context.column.field(),
            newValue: resolvedValue,
            oldValue,
            rowData: context.row.data
        });
        this.cellEdit$.next(event);
    }

    private findLongestCellContentOfColumn(column: Column): string {
        let maxLength = 0;
        let longestValue = "";
        for (const row of this.rows()) {
            const value = row.data[column.field()];
            if (value != null) {
                maxLength = Math.max(maxLength, value.toString().length);
                if (maxLength === value.toString().length) {
                    longestValue = value.toString();
                }
            }
        }
        return longestValue;
    }

    private getRowSelectionKey(row: Row): unknown {
        return this.getRowDataItemSelectionKey(row.data);
    }

    private getRowDataItemSelectionKey(data: Record<PropertyKey, unknown>): unknown {
        const selectBy = this.selectBy();
        if (!selectBy) {
            return data;
        }
        if (typeof selectBy === "string") {
            return data[selectBy];
        }
        return selectBy(data);
    }
}
