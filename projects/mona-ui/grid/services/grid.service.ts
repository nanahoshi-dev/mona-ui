import { isPlatformBrowser } from "@angular/common";
import {
    computed,
    DOCUMENT,
    effect,
    inject,
    Injectable,
    Injector,
    PLATFORM_ID,
    signal,
    TemplateRef
} from "@angular/core";
import { toObservable } from "@angular/core/rxjs-interop";
import { form, type SchemaOrSchemaFn } from "@angular/forms/signals";
import {
    Dictionary,
    ImmutableDictionary,
    ImmutableList,
    ImmutableSet,
    KeyValuePair,
    select
} from "@mirei/ts-collections";
import { BehaviorSubject, Subject } from "rxjs";
import { v4 } from "uuid";
import { VirtualScrollOptions } from "@mirei/mona-ui/common";
import { PopupMenuItem } from "@mirei/mona-ui/popup-menu";
import {
    Query,
    CompositeFilterDescriptor,
    FilterDescriptor,
    SortDescriptor,
    SortDirection
} from "@mirei/mona-ui/query";
import type { AggregateFunction } from "../models/AggregateFunction";
import { CellEditEvent } from "../models/CellEditEvent";
import type { Column, ColumnConfig } from "../models/Column";
import { ColumnFilterState } from "../models/ColumnFilterState";
import type { ColumnReorderEvent } from "../models/ColumnReorderEvent";
import type { ColumnResizeEvent } from "../models/ColumnResizeEvent";
import type { ColumnSortEvent } from "../models/ColumnSortEvent";
import { ColumnSortState } from "../models/ColumnSortState";
import { EditableOptions } from "../models/EditableOptions";
import type { FilterableOptions } from "../models/FilterableOptions";
import type { GridAggregateBucket, GridGroupAggregate } from "../models/GridAggregate";
import type { GridEditContext } from "../models/GridEditContext";
import type { GridEditFormContext } from "../models/GridEditFormContext";
import type { GridEditSession } from "../models/GridEditSession";
import { GridKeySelector } from "../models/GridKeySelector";
import type { GridLockedColumnState } from "../models/GridLockedColumnState";
import { SelectableOptions } from "../models/SelectableOptions";
import type {
    GridState,
    GridStateCompositeFilterDescriptor,
    GridStateFilterDescriptor,
    GridStateFilterValue,
    GridStateLoadResult,
    GridStatePersistenceOptions,
    GridStateSortDescriptor
} from "../models/GridState";
import { GroupableOptions } from "../models/GroupableOptions";
import { GroupDescriptor } from "../models/GroupDescriptor";
import { GridAddEvent } from "../models/GridAddEvent";
import { GridCancelEvent } from "../models/GridCancelEvent";
import { GridEditEvent } from "../models/GridEditEvent";
import { PaginationState } from "../models/PaginationState";
import type { ReorderableOptions } from "../models/ReorderableOptions";
import type { ResizableOptions } from "../models/ResizableOptions";
import { Row } from "../models/Row";
import { RowEditEvent } from "../models/RowEditEvent";
import { GridRemoveEvent } from "../models/GridRemoveEvent";
import { GridSaveEvent } from "../models/GridSaveEvent";
import { SortableOptions } from "../models/SortableOptions";

// Flat projection of a Row used as the IterablePatchStore item type.
// $rowId is injected to carry the row identity without modifying Row.data.
interface RowEditDataItem extends Record<string, unknown> {
    readonly $rowId: string;
}

interface GridEditSessionOptions extends GridEditFormContext {
    readonly row: Row | null;
    readonly rowUid: string | null;
}

const GRID_STATE_VERSION = 1;

@Injectable()
export class GridService {
    readonly #document = inject(DOCUMENT);
    readonly #editContext = signal<GridEditContext | null>(null);
    readonly #editSession = signal<GridEditSession | null>(null);
    readonly #editSource = computed(() =>
        this.rows()
            .select<RowEditDataItem>(r => ({ $rowId: r.uid, ...r.data }))
            .toImmutableSet()
    );
    readonly #filterableOptions = signal<FilterableOptions>({ enabled: false, type: "menu" });
    readonly #groupColumnIds = signal<ImmutableList<string>>(ImmutableList.create());
    readonly #horizontalScrollLeft = signal(0);
    readonly #injector = inject(Injector);
    readonly #platformId = inject(PLATFORM_ID);
    readonly #reorderableOptions = signal<ReorderableOptions>({ enabled: false });
    readonly #resizableOptions = signal<ResizableOptions>({ enabled: false });
    readonly #scrollbarGutterMeasurementSource = signal<"body" | "fallback">("fallback");
    readonly #scrollbarGutterWidth = signal(0);
    readonly #rowUidByData = new WeakMap<Record<PropertyKey, unknown>, string>();
    readonly #rowUidByKeyObject = new WeakMap<object, string>();
    readonly #textMeasureCache = new Map<string, number>();
    public readonly addRowData = computed(() => {
        const session = this.#editSession();
        return session?.operation === "create" ? session.model() : null;
    });
    public readonly addRowVisible = computed(() => this.addRowData() != null);
    public readonly add$ = new Subject<GridAddEvent>();
    public readonly aggregateColumns = computed(() => {
        return this.visibleColumns()
            .where(column => column.kind === "data" && column.aggregate != null)
            .toImmutableList();
    });
    public readonly aggregateMap = computed(() => {
        const aggregateColumns = this.aggregateColumns();
        if (!aggregateColumns.any()) {
            return ImmutableDictionary.create<string, GridAggregateBucket>();
        }
        return this.createAggregateMap(this.viewRows().toArray(), aggregateColumns.toArray());
    });
    public readonly aggregateRows = computed(() =>
        this.viewRows()
            .select(row => row.data)
            .toArray()
    );
    public readonly appliedFilters = signal(ImmutableDictionary.create<string, ColumnFilterState>());
    public readonly appliedGroupSorts = signal(ImmutableDictionary.create<string, ColumnSortState>());
    public readonly appliedSorts = signal(ImmutableDictionary.create<string, ColumnSortState>());
    public readonly bodyScrollElement = signal<HTMLElement | null>(null);
    public readonly bodyTableElement = signal<HTMLTableElement | null>(null);
    public readonly cellEdit$ = new Subject<CellEditEvent>();
    public readonly cancel$ = new Subject<GridCancelEvent>();
    /** Set of currently collapsed group keys (global, shared by both paginated and virtual list). */
    public readonly collapsedGroupKeys = signal(ImmutableSet.create<string>());
    public readonly columnReorder$ = new Subject<ColumnReorderEvent>();
    public readonly columnResize$ = new Subject<ColumnResizeEvent>();
    public readonly columnSort$ = new Subject<ColumnSortEvent>();
    public readonly columns = signal<ImmutableList<Column>>(ImmutableList.create());
    public readonly contextMenuItems = signal(ImmutableSet.create<PopupMenuItem>());
    public readonly detailColumnWidth = 36;
    public readonly editBaseDict = computed(() => {
        const pairs = this.#editSource().select(item => new KeyValuePair(item.$rowId, item));
        return ImmutableDictionary.create(pairs);
    });
    public readonly editContext = this.#editContext.asReadonly();
    public readonly edit$ = new Subject<GridEditEvent>();
    public readonly editViewDict = computed(() => {
        const session = this.#editSession();
        if (session == null || session.operation !== "update" || session.rowUid == null) {
            return ImmutableDictionary.create<string, RowEditDataItem>();
        }
        const item: RowEditDataItem = { $rowId: session.rowUid, ...session.model() };
        const pairs = [new KeyValuePair(item.$rowId, item)];
        return ImmutableDictionary.create(pairs);
    });
    public readonly editSession = this.#editSession.asReadonly();
    public readonly editableOptions = signal<EditableOptions>({ enabled: false, mode: "cell" });
    public readonly editableRowKey = signal<GridKeySelector<unknown> | null>(null);
    public readonly editingRowUid = computed(() => this.#editContext()?.rowUid ?? null);
    public readonly expandedKeys = signal(ImmutableSet.create());
    public readonly filterChange$ = new Subject<CompositeFilterDescriptor[]>();
    public readonly filterableOptions = this.#filterableOptions.asReadonly();
    public readonly footerScrollElement = signal<HTMLElement | null>(null);
    public readonly gridHeaderElement = signal<HTMLDivElement | null>(null);
    public readonly groupAggregateMap = computed(() => {
        const aggregateColumns = this.aggregateColumns();
        const groupColumns = this.groupColumns();
        if (!aggregateColumns.any() || !groupColumns.any()) {
            return ImmutableDictionary.create<string, GridGroupAggregate>();
        }
        const aggregates = new Dictionary<string, GridGroupAggregate>();
        this.buildGroupAggregates(
            this.viewRows().toArray(),
            groupColumns.toArray(),
            aggregateColumns.toArray(),
            0,
            null,
            aggregates
        );
        return aggregates.toImmutableDictionary(
            e => e.key,
            e => e.value
        );
    });
    public readonly groupColumnWidth = 36;
    public readonly groupColumns = computed(() => {
        const columnsById = new Map(this.columns().select(column => [column.id, column] as const));
        return this.#groupColumnIds()
            .select(id => columnsById.get(id))
            .where(column => column != null)
            .toImmutableList();
    });
    public readonly groupableOptions = signal<GroupableOptions>({ enabled: false, showFooter: false });
    public readonly hasLeftLockedColumns = computed(() =>
        this.visibleColumns().any(column => column.locked && column.lockedPosition === "left")
    );
    public readonly hasFooter = computed(() => this.aggregateColumns().any());
    public readonly hasLiveScrollbarGutterWidth = computed(() => this.#scrollbarGutterMeasurementSource() === "body");
    public readonly headerTableElement = signal<HTMLTableElement | null>(null);
    public readonly horizontalScrollLeft = this.#horizontalScrollLeft.asReadonly();
    public readonly isInEditMode = computed(() => this.#editSession() != null);
    public readonly leftLockedStructuralWidth = computed(() => {
        if (!this.hasLeftLockedColumns()) {
            return 0;
        }
        const groupWidth = this.groupColumnWidth * this.groupColumns().length;
        const detailWidth = this.masterDetailTemplate() != null ? this.detailColumnWidth : 0;
        return groupWidth + detailWidth;
    });
    public readonly lockedColumnStates = computed<ReadonlyMap<string, GridLockedColumnState>>(() => {
        const states = new Map<string, GridLockedColumnState>();
        const columns = this.visibleColumns().toArray();
        const leftColumns = columns.filter(column => column.locked && column.lockedPosition === "left");
        const rightColumns = columns.filter(column => column.locked && column.lockedPosition === "right");
        let leftOffset = this.leftLockedStructuralWidth();
        for (const [index, column] of leftColumns.entries()) {
            states.set(column.id, {
                edge: index === leftColumns.length - 1,
                offset: leftOffset,
                side: "left"
            });
            leftOffset += this.getColumnWidth(column);
        }

        let rightOffset = 0;
        for (const column of [...rightColumns].reverse()) {
            states.set(column.id, {
                edge: column === rightColumns[0],
                offset: rightOffset,
                side: "right"
            });
            rightOffset += this.getColumnWidth(column);
        }
        return states;
    });
    public readonly masterDetailEmptyCellWidth = computed(() => {
        return this.detailColumnWidth * (this.groupColumns().length + 1);
    });
    public readonly masterDetailRowWidth = computed(() => {
        const groupColumns = this.groupColumns();
        const columns = this.visibleColumns();
        const groupColumnWidth = this.groupColumnWidth;
        const groupColumnCount = groupColumns.length;
        const columnListWidth = columns.aggregate((acc, c) => acc + this.getColumnWidth(c), 0);
        return this.normalizeRenderedWidth(groupColumnWidth * (groupColumnCount + 1) + columnListWidth);
    });
    public readonly masterDetailTemplate = signal<TemplateRef<unknown> | null>(null);
    public readonly newRowFactory = signal<() => Record<PropertyKey, unknown>>(() => ({}));
    public readonly paginationState = signal<PaginationState>({ page: 1, skip: 0, take: 10 });
    public readonly remove$ = new Subject<GridRemoveEvent>();
    public readonly reorderableOptions = this.#reorderableOptions.asReadonly();
    public readonly resizableOptions = this.#resizableOptions.asReadonly();
    public readonly rowEdit$ = new Subject<RowEditEvent>();
    public readonly rows = signal<ImmutableSet<Row>>(ImmutableSet.create());
    public readonly save$ = new Subject<GridSaveEvent>();
    public readonly scrollEnd$ = new Subject<void>();
    public readonly scrollEndThreshold = signal<number>(5);
    public readonly scrollbarGutterWidth = this.#scrollbarGutterWidth.asReadonly();
    public readonly selectBy = signal<GridKeySelector<unknown>>("");
    public readonly selectableOptions = signal<SelectableOptions>({ enabled: false, mode: "single" });
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
    public readonly sortableOptions = signal<SortableOptions>({
        enabled: false,
        mode: "single",
        allowUnsort: true,
        showIndices: true
    });
    public readonly tableWidth = computed(() => {
        const columns = this.visibleColumns();
        if (!columns.any()) {
            return null;
        }
        if (columns.any(c => c.calculatedWidth == null && c.width == null)) {
            return null;
        }
        const dataWidth = columns.aggregate((acc, c) => acc + this.getColumnWidth(c), 0);
        const groupWidth = this.groupColumnWidth * this.groupColumns().length;
        const detailWidth = this.masterDetailTemplate() != null ? this.detailColumnWidth : 0;
        return this.normalizeRenderedWidth(dataWidth + groupWidth + detailWidth);
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
            .where(state => !groupColumns.any(c => c.field === state.sort.field));

        if (appliedNonGroupSorts.any()) {
            const sortState = appliedNonGroupSorts.select(d => d.sort).toArray();
            queryEnumerable = queryEnumerable.sort(sortState, r => r.data);
        }
        const result = queryEnumerable.run();
        return ImmutableSet.create(result);
    });
    public readonly virtualGridMaxBuffer = computed(() => this.virtualGridMinBuffer() * 1.42857);
    public readonly virtualGridMinBuffer = signal(0);
    public readonly virtualScrollOptions = signal<VirtualScrollOptions>({ enabled: false, height: 32 });
    public readonly visibleColumns = computed(() =>
        this.columns()
            .where(column => !column.hidden)
            .toImmutableList()
    );

    public constructor() {
        this.#scrollbarGutterWidth.set(this.measureFallbackScrollbarGutter());
        this.setHorizontalScrollSyncEffects();
        this.setScrollbarGutterEffects();
    }

    public addGroupColumn(column: Column): void {
        if (column.kind === "command" || this.#groupColumnIds().contains(column.id)) {
            return;
        }
        this.#groupColumnIds.update(ids => ids.add(column.id));
        this.setColumnGroupSortDirection(column.id, "asc");
        this.appliedGroupSorts.update(dict => dict.put(column.field, { sort: { field: column.field, dir: "asc" } }));
    }

    public applyState(state: GridState | null, options: GridStatePersistenceOptions = {}): GridStateLoadResult {
        if (state == null) {
            return { ignoredColumns: [], missingColumns: [], status: "empty" };
        }
        if (state.version !== GRID_STATE_VERSION) {
            return { ignoredColumns: [], missingColumns: [], status: "rejected-version" };
        }
        if (options.schemaVersion != null && state.schemaVersion !== options.schemaVersion) {
            return { ignoredColumns: [], missingColumns: [], status: "rejected-schema" };
        }

        let columns = this.columns().toArray();
        const columnById = new Map<string, Column>();
        for (const column of columns) {
            const id = this.getColumnStateId(column);
            if (id != null) {
                columnById.set(id, column);
            }
        }

        const stateColumnById = new Map(state.columns.map(column => [column.id, column]));
        const ignoredColumns = state.columns.filter(column => !columnById.has(column.id)).map(column => column.id);
        const missingColumns = columns
            .map(column => this.getColumnStateId(column))
            .filter((id): id is string => id != null && !stateColumnById.has(id));

        columns = columns.map(column => {
            const id = this.getColumnStateId(column);
            const columnState = id == null ? undefined : stateColumnById.get(id);
            return columnState == null
                ? column
                : {
                      ...column,
                      calculatedWidth: columnState.width,
                      hidden: columnState.hidden
                  };
        });
        const updatedColumnById = new Map<string, Column>();
        for (const column of columns) {
            const id = this.getColumnStateId(column);
            if (id != null) {
                updatedColumnById.set(id, column);
            }
        }

        const orderedColumns = state.columns
            .slice()
            .sort((left, right) => left.order - right.order)
            .map(columnState => updatedColumnById.get(columnState.id))
            .filter((column): column is Column => column != null);
        const orderedSet = new Set(orderedColumns);
        orderedColumns.push(...columns.filter(column => !orderedSet.has(column)));
        this.columns.set(ImmutableList.create(this.withColumnIndices(this.orderColumnsByLockBucket(orderedColumns))));

        this.loadSorts(state.sort.map(sort => ({ dir: sort.dir, field: sort.field })));
        this.loadGroupColumns(state.group);
        this.loadFilters(this.deserializeFilters(state.filter));
        this.filterChange$.next(
            this.appliedFilters()
                .values()
                .select(filter => filter.filter)
                .where(filter => filter != null)
                .toArray()
        );

        if (options.persistPageSize !== false && state.pageSize != null) {
            this.setPageState({ page: 1, skip: 0, take: state.pageSize });
        }

        return { ignoredColumns, missingColumns, status: "applied" };
    }

    public cancelAddRow(originalEvent?: Event): boolean {
        const session = this.#editSession();
        if (session == null || session.operation !== "create") {
            return true;
        }
        const rowData = this.resolveSessionRowData(session);
        const event = new GridCancelEvent({ operation: "create", originalEvent, rowData, session });
        this.cancel$.next(event);
        if (event.isDefaultPrevented()) {
            return false;
        }
        this.clearEditSession();
        return true;
    }

    public cancelEdit(originalEvent?: Event): boolean {
        const context = this.#editContext();
        const session = this.#editSession();
        if (context == null || session == null || session.operation !== "update") {
            return true;
        }
        const event = new GridCancelEvent({
            operation: "update",
            originalEvent,
            rowData: this.resolveEditedRowData(context.rowUid, context.row.data),
            session
        });
        this.cancel$.next(event);
        if (event.isDefaultPrevented()) {
            return false;
        }
        this.clearEditSession();
        return true;
    }

    public captureState(options: GridStatePersistenceOptions = {}): GridState {
        const state: GridState = {
            columns: this.columns()
                .toArray()
                .map((column, index) => {
                    const id = this.getColumnStateId(column);
                    return id == null
                        ? null
                        : {
                              hidden: column.hidden,
                              id,
                              order: index,
                              width: this.getColumnWidth(column)
                          };
                })
                .filter(column => column != null),
            filter: this.appliedFilters()
                .values()
                .select(state => this.serializeFilter(state.filter))
                .where(filter => filter != null)
                .toArray(),
            group: this.getGroupDescriptors(this.groupColumns()),
            sort: this.appliedSorts()
                .values()
                .select<GridStateSortDescriptor>(state => ({ dir: state.sort.dir, field: state.sort.field }))
                .toArray(),
            version: GRID_STATE_VERSION
        };
        if (options.schemaVersion != null) {
            state.schemaVersion = options.schemaVersion;
        }
        if (options.persistPageSize !== false) {
            state.pageSize = this.paginationState().take;
        }
        return state;
    }

    public clearCollapsedGroups(predicate?: (key: string) => boolean): void {
        if (predicate) {
            this.collapsedGroupKeys.update(keys => keys.where(k => !predicate(k)).toImmutableSet());
        } else {
            this.collapsedGroupKeys.update(keys => keys.clear());
        }
    }

    public clearColumnGrouping(column: Column): void {
        this.#groupColumnIds.update(ids => ids.remove(column.id));
        this.setColumnGroupSortDirection(column.id, null);
        this.appliedGroupSorts.update(dict => dict.remove(column.field));
        this.clearCollapsedGroups(key => key.includes(column.field));
    }

    public commitRowEdit(originalEvent?: Event): boolean {
        const context = this.#editContext();
        const session = this.#editSession();
        if (!context || context.mode !== "row" || session == null) {
            return false;
        }
        if (!this.validateSessionForSave(session)) {
            return false;
        }
        const rowData = this.resolveEditedRowData(context.rowUid, context.row.data);
        const saveEvent = new GridSaveEvent({
            operation: "update",
            originalEvent,
            originalRowData: context.row.data,
            rowData,
            session
        });
        this.save$.next(saveEvent);
        if (saveEvent.isDefaultPrevented()) {
            return false;
        }
        this.clearEditSession();
        this.rowEdit$.next(new RowEditEvent({ originalRowData: context.row.data, rowData, session }));
        return true;
    }

    public deselectAllRows(): void {
        this.selectedKeys.update(set => set.clear());
    }

    public findTextWidthOfColumn(column: Column, element: HTMLTableCellElement): number {
        if (!isPlatformBrowser(this.#platformId)) {
            return 0;
        }
        let longestValue = this.findLongestCellContentOfColumn(column);
        if (column.title.length > longestValue.length) {
            longestValue = column.title;
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
            return this.normalizeRenderedWidth(cached + totalAdditionalWidth);
        }
        const canvas = this.#document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (context == null) {
            return 0;
        }
        context.font = fontKey;
        const measured = context.measureText(longestValue).width;
        this.#textMeasureCache.set(cacheKey, measured);
        return this.normalizeRenderedWidth(measured + totalAdditionalWidth);
    }

    public getColumnStateId(column: Column): string | null {
        return column.stateKey || column.field || null;
    }

    public getColumnWidth(column: Column): number {
        return this.normalizeRenderedWidth(column.calculatedWidth ?? column.width ?? column.minWidth ?? 0);
    }

    public getGroupDescriptors(columns: Iterable<Column>): GroupDescriptor[] {
        return select(columns, c => ({
            field: c.field,
            dir: c.groupSortDirection ?? undefined
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

    public isGroupCollapsed(groupKey: string): boolean {
        return this.collapsedGroupKeys().contains(groupKey);
    }

    public isRowExpanded(row: Row): boolean {
        return this.expandedKeys().contains(this.getRowSelectionKey(row));
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
            if (filter1 == null || !("field" in filter1)) {
                continue;
            }
            const column = this.columns().firstOrDefault(c => c.field === filter1.field);
            if (column != null) {
                newAppliedFilters.add(column.field, {
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
        this.updateColumns(column => ({ ...column, filtered: newAppliedFilters.containsKey(column.field) }));
        this.appliedFilters.set(
            newAppliedFilters.toImmutableDictionary(
                p => p.key,
                p => p.value
            )
        );
    }

    public loadGroupColumns(descriptors: Iterable<GroupDescriptor>): void {
        const columns = this.columns();
        const descriptorList = [...descriptors];
        const groupColumns = descriptorList
            .map(descriptor => columns.firstOrDefault(c => c.field === descriptor.field))
            .filter((column): column is Column => column != null);
        const currentGroupColumns = this.groupColumns();
        const currentDescriptors = this.getGroupDescriptors(currentGroupColumns);
        const currentMatches =
            currentDescriptors.length === descriptorList.length &&
            currentDescriptors.every((descriptor, index) => {
                const nextDescriptor = descriptorList[index];
                return (
                    nextDescriptor != null &&
                    descriptor.field === nextDescriptor.field &&
                    (descriptor.dir ?? "asc") === (nextDescriptor.dir ?? "asc")
                );
            });
        if (currentMatches) {
            return;
        }
        const newAppliedGroupSorts = new Dictionary<string, ColumnSortState>();
        const groupSortDirections = new Map<string, SortDirection>();
        for (const descriptor of descriptorList) {
            const column = columns.firstOrDefault(c => c.field === descriptor.field);
            if (column != null) {
                const dir = descriptor.dir ?? "asc";
                groupSortDirections.set(column.id, dir);
                newAppliedGroupSorts.add(column.field, { sort: { field: descriptor.field, dir } });
            }
        }
        this.updateColumns(column => ({
            ...column,
            groupSortDirection: groupSortDirections.get(column.id) ?? null
        }));
        this.appliedGroupSorts.set(
            newAppliedGroupSorts.toImmutableDictionary(
                p => p.key,
                p => p.value
            )
        );
        this.#groupColumnIds.set(ImmutableList.create(groupColumns.map(column => column.id)));
    }

    public loadSelectedKeys(selectedKeys: Iterable<unknown>): void {
        this.selectedKeys.update(set => set.clear().addAll(selectedKeys));
        this.selectedKeysLoad$.next(this.selectedKeys());
    }

    public loadSorts(sorts: SortDescriptor[]): void {
        const newAppliedSorts = new Dictionary<string, ColumnSortState>();
        const sortStates = new Map<string, { readonly dir: SortDirection; readonly index: number }>();
        for (const [index, sort] of sorts.entries()) {
            const column = this.columns().firstOrDefault(c => c.field === sort.field);
            if (column != null) {
                newAppliedSorts.add(column.field, {
                    sort: sort
                });
                sortStates.set(column.id, { dir: sort.dir, index: index + 1 });
            }
        }
        this.updateColumns(column => {
            const state = sortStates.get(column.id);
            return {
                ...column,
                columnSortDirection: state?.dir ?? null,
                sortIndex: state?.index ?? null
            };
        });
        this.appliedSorts.set(
            newAppliedSorts.toImmutableDictionary(
                p => p.key,
                p => p.value
            )
        );
    }

    public moveGroupColumn(column: Column, moveAs: "prev" | "next"): void {
        this.#groupColumnIds.update(ids => {
            const list = ids.toArray();
            const index = list.indexOf(column.id);
            const newIndex = moveAs === "prev" ? index - 1 : index + 1;
            if (index < 0 || newIndex < 0 || newIndex >= list.length) {
                return ids;
            }
            const [movedId] = list.splice(index, 1);
            list.splice(newIndex, 0, movedId);
            return ImmutableList.create(list);
        });
    }

    public normalizeRenderedWidth(width: number): number {
        if (!Number.isFinite(width)) {
            return 0;
        }
        const devicePixelRatio = this.#document.defaultView?.devicePixelRatio ?? 1;
        return Math.max(0, Math.round(width * devicePixelRatio) / devicePixelRatio);
    }

    public patchAddCell(field: string, value: unknown): void {
        const session = this.#editSession();
        if (session?.operation !== "create") {
            return;
        }
        this.patchSessionField(session, field, value);
    }

    public patchCellEdit(rowUid: string, field: string, value: unknown): void {
        const session = this.#editSession();
        if (session?.operation !== "update" || session.rowUid !== rowUid) {
            return;
        }
        this.patchSessionField(session, field, value);
    }

    public removeRow(row: Row, originalEvent?: Event): boolean {
        const event = new GridRemoveEvent({ originalEvent, rowData: row.data });
        this.remove$.next(event);
        return !event.isDefaultPrevented();
    }

    public resolveAggregateValue(
        bucket: GridAggregateBucket | null,
        aggregateFunction: AggregateFunction | null
    ): unknown {
        if (bucket == null || aggregateFunction == null || aggregateFunction === "custom") {
            return null;
        }
        switch (aggregateFunction) {
            case "avg":
                return bucket.avg ?? null;
            case "count":
                return bucket.count ?? 0;
            case "max":
                return bucket.max ?? null;
            case "min":
                return bucket.min ?? null;
            case "sum":
                return bucket.sum ?? null;
        }
    }

    public saveAddRow(originalEvent?: Event): boolean {
        const session = this.#editSession();
        if (session == null || session.operation !== "create") {
            return false;
        }
        if (!this.validateSessionForSave(session)) {
            return false;
        }
        const rowData = this.resolveSessionRowData(session);
        const event = new GridSaveEvent({ operation: "create", originalEvent, rowData, session });
        this.save$.next(event);
        if (event.isDefaultPrevented()) {
            return false;
        }
        this.clearEditSession();
        return true;
    }

    public selectRow(row: Row): void {
        const key = this.getRowSelectionKey(row);
        this.selectedKeys.update(set => set.add(key));
    }

    public setCalculatedWidth(columnId: string, value: number | null): void {
        this.updateColumn(columnId, { calculatedWidth: value });
    }

    public setCalculatedWidths(widthByColumnId: ReadonlyMap<string, number | null>): void {
        this.updateColumns(column =>
            widthByColumnId.has(column.id)
                ? { ...column, calculatedWidth: widthByColumnId.get(column.id) ?? null }
                : column
        );
    }

    public setColumnDefinitions(configs: readonly ColumnConfig[]): void {
        const currentColumns = this.columns().toArray();
        const currentById = new Map(currentColumns.map(column => [column.id, column]));
        const configsById = new Map(configs.map(config => [config.id, config]));
        const currentConfigIds = new Set(currentColumns.map(column => column.id));
        const orderedConfigs = [
            ...currentColumns
                .map(column => configsById.get(column.id))
                .filter((config): config is ColumnConfig => config != null),
            ...configs.filter(config => !currentConfigIds.has(config.id))
        ];
        const nextColumns = this.withColumnIndices(
            this.orderColumnsByLockBucket(
                orderedConfigs.map(config => this.reconcileColumn(config, currentById.get(config.id)))
            )
        );
        const nextColumnIds = new Set(nextColumns.map(column => column.id));
        this.columns.set(ImmutableList.create(nextColumns));
        this.#groupColumnIds.update(ids => ids.where(id => nextColumnIds.has(id)).toImmutableList());
    }

    public setColumnFiltered(columnId: string, value: boolean): void {
        this.updateColumn(columnId, { filtered: value });
    }

    public setColumnGroupSortDirection(columnId: string, value: SortDirection | null): void {
        this.updateColumn(columnId, { groupSortDirection: value });
    }

    public setColumnHidden(columnId: string, value: boolean): void {
        this.updateColumn(columnId, { hidden: value });
    }

    public setColumnOrder(columnIds: readonly string[]): void {
        const columnsById = new Map(this.columns().select(column => [column.id, column] as const));
        const orderedColumns = columnIds
            .map(id => columnsById.get(id))
            .filter((column): column is Column => column != null);
        const orderedIds = new Set(orderedColumns.map(column => column.id));
        orderedColumns.push(
            ...this.columns()
                .where(column => !orderedIds.has(column.id))
                .toArray()
        );
        this.columns.set(ImmutableList.create(this.withColumnIndices(this.orderColumnsByLockBucket(orderedColumns))));
    }

    public setColumnSortDirection(columnId: string, value: SortDirection | null): void {
        this.updateColumn(columnId, { columnSortDirection: value });
    }

    public setColumnSortIndex(columnId: string, value: number | null): void {
        this.updateColumn(columnId, { sortIndex: value });
    }

    public setColumnVisibilityByFields(visibleFields: ImmutableSet<string>): void {
        this.updateColumns(column => ({ ...column, hidden: !visibleFields.contains(column.field) }));
    }

    public setEditableOptions(options: EditableOptions): void {
        this.editableOptions.update(v => ({ ...v, ...options }));
    }

    public setFilterableOptions(options: Partial<FilterableOptions>): void {
        this.#filterableOptions.update(v => ({ ...v, ...options }));
    }

    public setGroupableOptions(options: Partial<GroupableOptions>): void {
        this.groupableOptions.update(v => ({ ...v, ...options }));
    }

    public setNewRowFactory(factory: () => Record<PropertyKey, unknown>): void {
        this.newRowFactory.set(factory);
    }

    public setPageState(state: Partial<PaginationState>): void {
        this.paginationState.update(v => ({ ...v, ...state }));
    }

    public setReorderableOptions(options: Partial<ReorderableOptions>): void {
        this.#reorderableOptions.update(v => ({ ...v, ...options }));
    }

    public setResizableOptions(options: Partial<ResizableOptions>): void {
        this.#resizableOptions.update(v => ({ ...v, ...options }));
    }

    public setRowExpanded(row: Row, expanded: boolean): void {
        const key = this.getRowSelectionKey(row);
        this.expandedKeys.update(set => (expanded ? set.add(key) : set.remove(key)));
    }

    public setRows(
        value: Iterable<Record<PropertyKey, unknown>>,
        rowKey: GridKeySelector<unknown> | null = null
    ): void {
        this.rows.set(ImmutableSet.create(select(value, r => new Row(r, this.getRowUid(r, rowKey)))));
    }

    public setSelectableOptions(options: SelectableOptions): void {
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

    public startAddRow(originalEvent?: Event): boolean {
        const activeSession = this.#editSession();
        if (activeSession?.operation === "create") {
            return true;
        }
        if (activeSession?.operation === "update" && !this.cancelEdit(originalEvent)) {
            return false;
        }
        const rowData = this.newRowFactory()();
        const session = this.createEditSession({
            column: null,
            field: null,
            isNew: true,
            mode: this.editableOptions().mode,
            operation: "create",
            originalRowData: null,
            row: null,
            rowData,
            rowUid: null
        });
        const addEvent = new GridAddEvent({ originalEvent, rowData: this.resolveSessionRowData(session), session });
        this.add$.next(addEvent);
        if (addEvent.isDefaultPrevented()) {
            return false;
        }
        this.#editSession.set(session);
        return true;
    }

    public startCellEdit(uid: string, row: Row, column: Column, originalEvent?: Event): boolean {
        if (this.editableOptions().mode !== "cell") {
            return false;
        }
        const activeSession = this.#editSession();
        if (activeSession?.operation === "create" && !this.cancelAddRow(originalEvent)) {
            return false;
        }
        if (activeSession?.operation === "update" && !this.cancelEdit(originalEvent)) {
            return false;
        }
        const session = this.createEditSession({
            column,
            field: column.field,
            isNew: false,
            mode: "cell",
            operation: "update",
            originalRowData: row.data,
            row,
            rowData: row.data,
            rowUid: row.uid
        });
        const editEvent = new GridEditEvent({ originalEvent, rowData: row.data, session });
        this.edit$.next(editEvent);
        if (editEvent.isDefaultPrevented()) {
            return false;
        }
        this.#editSession.set(session);
        this.#editContext.set({ cellUid: uid, columnId: column.id, mode: "cell", row, rowUid: row.uid, session });
        return true;
    }

    public startRowEdit(row: Row, originalEvent?: Event): boolean {
        if (this.editableOptions().mode !== "row") {
            return false;
        }
        const activeSession = this.#editSession();
        if (activeSession?.operation === "create" && !this.cancelAddRow(originalEvent)) {
            return false;
        }
        if (activeSession?.operation === "update" && !this.cancelEdit(originalEvent)) {
            return false;
        }
        const session = this.createEditSession({
            column: null,
            field: null,
            isNew: false,
            mode: "row",
            operation: "update",
            originalRowData: row.data,
            row,
            rowData: row.data,
            rowUid: row.uid
        });
        const editEvent = new GridEditEvent({ originalEvent, rowData: row.data, session });
        this.edit$.next(editEvent);
        if (editEvent.isDefaultPrevented()) {
            return false;
        }
        this.#editSession.set(session);
        this.#editContext.set({ mode: "row", row, rowUid: row.uid, session });
        return true;
    }

    public stopCellEdit(originalEvent?: Event): boolean {
        const context = this.#editContext();
        const session = this.#editSession();
        if (!context || context.mode !== "cell" || session == null) {
            return false;
        }
        const column = this.getColumnById(context.columnId);
        if (column == null) {
            return false;
        }
        if (!this.validateSessionForSave(session)) {
            return false;
        }
        const rowData = this.resolveEditedRowData(context.rowUid, context.row.data);
        const oldValue = context.row.data[column.field];
        const resolvedValue = rowData[column.field];
        const event = new CellEditEvent({
            field: column.field,
            newValue: resolvedValue,
            oldValue,
            rowData: context.row.data,
            session
        });
        this.cellEdit$.next(event);
        if (event.isDefaultPrevented()) {
            return false;
        }
        const saveEvent = new GridSaveEvent({
            operation: "update",
            originalEvent,
            originalRowData: context.row.data,
            rowData,
            session
        });
        this.save$.next(saveEvent);
        if (saveEvent.isDefaultPrevented()) {
            return false;
        }
        this.clearEditSession();
        return true;
    }

    public toggleGroupCollapse(groupKey: string): void {
        this.collapsedGroupKeys.update(keys => (keys.contains(groupKey) ? keys.remove(groupKey) : keys.add(groupKey)));
    }

    public updateColumn(columnId: string, patch: Partial<Omit<Column, "id">>): void {
        this.updateColumns(column => (column.id === columnId ? { ...column, ...patch } : column));
    }

    private applyColumnIndexes(columns: readonly Column[]): Column[] {
        return columns.map((column, index) => ({ ...column, index }));
    }

    private buildGroupAggregates(
        rows: readonly Row[],
        groupColumns: readonly Column[],
        aggregateColumns: readonly Column[],
        depth: number,
        parentKey: string | null,
        aggregates: Dictionary<string, GridGroupAggregate>
    ): void {
        const column = groupColumns[depth];
        if (column == null) {
            return;
        }
        const groupedRows = this.groupRowsByColumn(rows, column);
        for (const [groupValue, groupRows] of groupedRows) {
            const groupKey = this.buildGroupKey(parentKey, column.field, groupValue);
            if (depth < groupColumns.length - 1) {
                this.buildGroupAggregates(groupRows, groupColumns, aggregateColumns, depth + 1, groupKey, aggregates);
            }
            aggregates.put(groupKey, {
                aggregates: this.createAggregateMap(groupRows, aggregateColumns),
                count: groupRows.length,
                depth,
                groupKey,
                groupValue,
                rows: groupRows.map(row => row.data)
            });
        }
    }

    private buildGroupKey(parentKey: string | null, field: string, value: unknown): string {
        const segment = `${field}:${String(value ?? "")}`;
        return parentKey != null ? `${parentKey}/${segment}` : segment;
    }

    private compareComparableValues(
        left: boolean | number | bigint | string,
        right: boolean | number | bigint | string | null
    ): number {
        if (right == null) {
            return 1;
        }
        if (left < right) {
            return -1;
        }
        if (left > right) {
            return 1;
        }
        return 0;
    }

    private createAggregateBucket(rows: readonly Row[], column: Column): GridAggregateBucket {
        const field = column.field;
        if (column.aggregate === "custom" || column.aggregate == null) {
            return { field };
        }

        let count = 0;
        let max: unknown;
        let min: unknown;
        let numericCount = 0;
        let sumValue = 0;

        for (const row of rows) {
            count += 1;
            const value = row.data[field];
            if (typeof value === "number" && Number.isFinite(value)) {
                sumValue += value;
                numericCount += 1;
            }

            if (value == null) {
                continue;
            }

            const comparableValue = this.toComparableValue(value);
            if (comparableValue == null) {
                continue;
            }

            if (min == null || this.compareComparableValues(comparableValue, this.toComparableValue(min)) < 0) {
                min = value;
            }
            if (max == null || this.compareComparableValues(comparableValue, this.toComparableValue(max)) > 0) {
                max = value;
            }
        }

        const avg = numericCount > 0 ? sumValue / numericCount : undefined;
        const sum = numericCount > 0 ? sumValue : undefined;

        return { avg, count, field, max, min, sum };
    }

    private createAggregateMap(
        rows: readonly Row[],
        columns: readonly Column[]
    ): ImmutableDictionary<string, GridAggregateBucket> {
        const aggregates = new Dictionary<string, GridAggregateBucket>();
        for (const column of columns) {
            aggregates.put(column.field, this.createAggregateBucket(rows, column));
        }
        return aggregates.toImmutableDictionary(
            e => e.key,
            e => e.value
        );
    }

    private deserializeCompositeFilter(filter: GridStateCompositeFilterDescriptor): CompositeFilterDescriptor | null {
        const filters = filter.filters
            .map(child =>
                "filters" in child ? this.deserializeCompositeFilter(child) : this.deserializeFilterDescriptor(child)
            )
            .filter((child): child is CompositeFilterDescriptor | FilterDescriptor => child != null);
        return filters.length === 0 ? null : { filters, logic: filter.logic };
    }

    private deserializeFilterDescriptor(filter: GridStateFilterDescriptor): FilterDescriptor | null {
        const column = this.columns().firstOrDefault(column => column.field === filter.field);
        if (column == null) {
            return null;
        }
        if ("value" in filter) {
            return {
                field: filter.field,
                operator: filter.operator,
                value: this.deserializeFilterValue(filter.value, column)
            } as FilterDescriptor;
        }
        return { field: filter.field, operator: filter.operator } as FilterDescriptor;
    }

    private deserializeFilterValue(value: GridStateFilterValue | undefined, column: Column): unknown {
        if (Array.isArray(value)) {
            return value.map(item => this.deserializeFilterValue(item, column));
        }
        if (typeof value === "string" && column.dataType === "date") {
            return new Date(value);
        }
        return value;
    }

    private deserializeFilters(filters: readonly GridStateCompositeFilterDescriptor[]): CompositeFilterDescriptor[] {
        return filters
            .map(filter => this.deserializeCompositeFilter(filter))
            .filter((filter): filter is CompositeFilterDescriptor => filter != null);
    }

    private findLongestCellContentOfColumn(column: Column): string {
        let maxLength = 0;
        let longestValue = "";
        for (const row of this.rows()) {
            const value = row.data[column.field];
            if (value != null) {
                maxLength = Math.max(maxLength, value.toString().length);
                if (maxLength === value.toString().length) {
                    longestValue = value.toString();
                }
            }
        }
        return longestValue;
    }

    private getColumnById(columnId: string): Column | null {
        return this.columns().firstOrDefault(column => column.id === columnId);
    }

    private getColumnLockBucket(column: Column): "left" | "right" | "unlocked" {
        return column.locked ? column.lockedPosition : "unlocked";
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

    private getRowSelectionKey(row: Row): unknown {
        return this.getRowDataItemSelectionKey(row.data);
    }

    private getRowUid(data: Record<PropertyKey, unknown>, rowKey: GridKeySelector<unknown> | null): string {
        const key = this.getRowUidKey(data, rowKey);
        if (key != null) {
            if (typeof key === "object" || typeof key === "function") {
                const cachedKeyUid = this.#rowUidByKeyObject.get(key);
                if (cachedKeyUid != null) {
                    return cachedKeyUid;
                }
                const keyUid = v4();
                this.#rowUidByKeyObject.set(key, keyUid);
                return keyUid;
            }
            return `key:${typeof key}:${String(key)}`;
        }

        const cachedUid = this.#rowUidByData.get(data);
        if (cachedUid != null) {
            return cachedUid;
        }

        const uid = v4();
        this.#rowUidByData.set(data, uid);
        return uid;
    }

    private getRowUidKey(data: Record<PropertyKey, unknown>, rowKey: GridKeySelector<unknown> | null): unknown {
        if (!rowKey) {
            return null;
        }
        if (typeof rowKey === "string") {
            return data[rowKey];
        }
        return rowKey(data);
    }

    private groupRowsByColumn(rows: readonly Row[], column: Column): Array<[unknown, Row[]]> {
        const field = column.field;
        const isDate = column.dataType === "date";
        const groupMap = new Map<unknown, Row[]>();
        const keyOrder: unknown[] = [];

        for (const row of rows) {
            const rawValue = row.data[field];
            const mapKey = isDate && rawValue instanceof Date ? rawValue.toISOString() : rawValue;
            if (!groupMap.has(mapKey)) {
                groupMap.set(mapKey, []);
                keyOrder.push(mapKey);
            }
            groupMap.get(mapKey)?.push(row);
        }

        return keyOrder.map(mapKey => {
            const groupRows = groupMap.get(mapKey) ?? [];
            const groupValue = groupRows[0]?.data[field];
            return [groupValue, groupRows];
        });
    }

    private measureElementScrollbarGutter(element: HTMLElement): number {
        // 1 pixel is subtracted to offset the border
        return Math.max(0, element.offsetWidth - element.clientWidth) - 1;
    }

    private measureFallbackScrollbarGutter(): number {
        if (!isPlatformBrowser(this.#platformId)) {
            return 0;
        }
        const measurementElement = this.#document.createElement("div");
        measurementElement.style.position = "absolute";
        measurementElement.style.top = "-9999px";
        measurementElement.style.width = "100px";
        measurementElement.style.height = "100px";
        measurementElement.style.overflow = "scroll";
        measurementElement.style.border = "0";
        measurementElement.style.padding = "0";
        this.#document.body.appendChild(measurementElement);
        const gutterWidth = this.measureElementScrollbarGutter(measurementElement);
        measurementElement.remove();
        return gutterWidth;
    }

    private orderColumnsByLockBucket(columns: readonly Column[]): Column[] {
        const leftLockedColumns = columns.filter(column => this.getColumnLockBucket(column) === "left");
        const unlockedColumns = columns.filter(column => this.getColumnLockBucket(column) === "unlocked");
        const rightLockedColumns = columns.filter(column => this.getColumnLockBucket(column) === "right");
        return [...leftLockedColumns, ...unlockedColumns, ...rightLockedColumns];
    }

    private reconcileColumn(config: ColumnConfig, previous: Column | undefined): Column {
        const hidden =
            previous != null && previous.configuredHidden === config.hidden ? previous.hidden : config.hidden;
        return {
            ...config,
            calculatedWidth: previous?.calculatedWidth ?? null,
            columnSortDirection: previous?.columnSortDirection ?? null,
            configuredHidden: config.hidden,
            filtered: previous?.filtered ?? false,
            groupSortDirection: previous?.groupSortDirection ?? null,
            hidden,
            index: previous?.index ?? 0,
            minWidth: config.minWidth,
            sortIndex: previous?.sortIndex ?? null
        };
    }

    private clearEditSession(): void {
        this.#editContext.set(null);
        this.#editSession.set(null);
    }

    private createEditSession(options: GridEditSessionOptions): GridEditSession {
        const model = signal<Record<PropertyKey, unknown>>({ ...options.rowData });
        const context: GridEditFormContext = {
            column: options.column,
            field: options.field,
            isNew: options.isNew,
            mode: options.mode,
            operation: options.operation,
            originalRowData: options.originalRowData,
            rowData: options.rowData
        };
        const schema = this.editableOptions().schema?.(context) ?? null;
        const editForm =
            schema == null
                ? form(model, { injector: this.#injector })
                : form(model, schema as SchemaOrSchemaFn<Record<PropertyKey, unknown>>, { injector: this.#injector });

        return {
            column: options.column,
            field: options.field,
            form: editForm,
            isNew: options.isNew,
            mode: options.mode,
            model,
            operation: options.operation,
            originalRowData: options.originalRowData,
            row: options.row,
            rowUid: options.rowUid
        };
    }

    private patchSessionField(session: GridEditSession, field: string, value: unknown): void {
        session.model.update(rowData => ({ ...rowData, [field]: value }));
    }

    private resolveEditedRowData(
        rowUid: string,
        fallbackRowData: Record<PropertyKey, unknown>
    ): Record<PropertyKey, unknown> {
        const editedRowData = this.editViewDict().get(rowUid);
        if (editedRowData == null) {
            return fallbackRowData;
        }
        const { $rowId, ...rowData } = editedRowData;
        return rowData;
    }

    private resolveSessionRowData(session: GridEditSession): Record<PropertyKey, unknown> {
        return { ...session.form().value() };
    }

    private validateSessionForSave(session: GridEditSession): boolean {
        const rootField = session.form();
        rootField.markAsTouched();
        return !rootField.invalid() && !rootField.pending();
    }

    private serializeFilter(
        filter: CompositeFilterDescriptor | null | undefined
    ): GridStateCompositeFilterDescriptor | null {
        if (filter == null) {
            return null;
        }
        const filters = filter.filters
            .map(child => ("filters" in child ? this.serializeFilter(child) : this.serializeFilterDescriptor(child)))
            .filter((child): child is GridStateCompositeFilterDescriptor | GridStateFilterDescriptor => child != null);
        return filters.length === 0 ? null : { filters, logic: filter.logic };
    }

    private serializeFilterDescriptor(filter: FilterDescriptor): GridStateFilterDescriptor | null {
        if (filter.operator === "function") {
            return null;
        }
        const descriptor: GridStateFilterDescriptor = {
            field: filter.field,
            operator: filter.operator
        };
        if ("value" in filter) {
            const value = this.serializeFilterValue(filter.value);
            if (value === undefined) {
                return null;
            }
            descriptor.value = value;
        }
        return descriptor;
    }

    private serializeFilterValue(value: unknown): GridStateFilterValue | undefined {
        if (value instanceof Date) {
            return value.toISOString();
        }
        if (Array.isArray(value)) {
            const values = value.map(item => this.serializeFilterValue(item));
            return values.every((item): item is boolean | number | string | null => item !== undefined)
                ? values
                : undefined;
        }
        if (value == null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
            return value;
        }
        return undefined;
    }

    private setElementScrollLeft(element: HTMLElement | null, scrollLeft: number): void {
        if (element != null && element.scrollLeft !== scrollLeft) {
            element.scrollLeft = scrollLeft;
        }
    }

    private setHorizontalScrollLeft(scrollLeft: number): void {
        if (this.#horizontalScrollLeft() !== scrollLeft) {
            this.#horizontalScrollLeft.set(scrollLeft);
        }
    }

    private setHorizontalScrollSyncEffects(): void {
        effect(onCleanup => {
            const headerElement = this.gridHeaderElement();
            const bodyElement = this.bodyScrollElement();
            const footerElement = this.footerScrollElement();
            const cleanups: Array<() => void> = [];

            if (headerElement != null) {
                const onHeaderScroll = (): void => this.setHorizontalScrollLeft(headerElement.scrollLeft);
                headerElement.addEventListener("scroll", onHeaderScroll);
                cleanups.push(() => headerElement.removeEventListener("scroll", onHeaderScroll));
            }

            if (bodyElement != null) {
                const onBodyScroll = (): void => this.setHorizontalScrollLeft(bodyElement.scrollLeft);
                bodyElement.addEventListener("scroll", onBodyScroll);
                cleanups.push(() => bodyElement.removeEventListener("scroll", onBodyScroll));
            }

            if (footerElement != null) {
                const onFooterScroll = (): void => this.setHorizontalScrollLeft(footerElement.scrollLeft);
                footerElement.addEventListener("scroll", onFooterScroll);
                cleanups.push(() => footerElement.removeEventListener("scroll", onFooterScroll));
            }

            onCleanup(() => cleanups.forEach(cleanup => cleanup()));
        });

        effect(() => {
            const scrollLeft = this.#horizontalScrollLeft();
            this.setElementScrollLeft(this.gridHeaderElement(), scrollLeft);
            this.setElementScrollLeft(this.bodyScrollElement(), scrollLeft);
            this.setElementScrollLeft(this.footerScrollElement(), scrollLeft);
        });
    }

    private setScrollbarGutterEffects(): void {
        effect(onCleanup => {
            const bodyElement = this.bodyScrollElement();
            if (bodyElement == null) {
                this.#scrollbarGutterMeasurementSource.set("fallback");
                this.#scrollbarGutterWidth.set(this.measureFallbackScrollbarGutter());
                return;
            }

            const updateScrollbarGutter = (): void => {
                this.#scrollbarGutterMeasurementSource.set("body");
                this.#scrollbarGutterWidth.set(this.measureElementScrollbarGutter(bodyElement));
            };

            updateScrollbarGutter();

            if (typeof ResizeObserver === "undefined") {
                return;
            }

            const resizeObserver = new ResizeObserver(() => updateScrollbarGutter());
            resizeObserver.observe(bodyElement);
            onCleanup(() => resizeObserver.disconnect());
        });
    }

    private toComparableValue(value: unknown): boolean | number | bigint | string | null {
        if (value instanceof Date) {
            return value.getTime();
        }
        switch (typeof value) {
            case "bigint":
            case "boolean":
            case "number":
            case "string":
                return value;
            default:
                return null;
        }
    }

    private updateColumns(updater: (column: Column) => Column): void {
        this.columns.update(columns =>
            ImmutableList.create(this.applyColumnIndexes(columns.select(updater).toArray()))
        );
    }

    private withColumnIndices(columns: readonly Column[]): Column[] {
        return columns.map((column, index) => ({ ...column, index }));
    }
}
