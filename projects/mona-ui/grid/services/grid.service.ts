import { GRID_DEFAULT_VIRTUAL_ROW_HEIGHT } from "../constants/grid-virtual-scroll.constants";
import { isPlatformBrowser } from "@angular/common";
import {
    computed,
    DOCUMENT,
    effect,
    inject,
    Injectable,
    Injector,
    isDevMode,
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
import { deepEquals, VirtualScrollOptions } from "@nanahoshi/mona-ui/common";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { PopupMenuItem } from "@nanahoshi/mona-ui/popup-menu";
import {
    compareValues,
    type CompositeFilterDescriptor,
    type FilterDescriptor,
    Query,
    type SortDescriptor,
    type SortDirection
} from "@nanahoshi/mona-ui/query";
import { BehaviorSubject, Subject } from "rxjs";
import { v4 } from "uuid";
import type { AggregateFunction } from "../models/AggregateFunction";
import { CellEditEvent } from "../models/CellEditEvent";
import type { Column, ColumnConfig } from "../models/Column";
import { ColumnFilterState } from "../models/ColumnFilterState";
import type { ColumnReorderEvent } from "../models/ColumnReorderEvent";
import type { ColumnResizeEvent } from "../models/ColumnResizeEvent";
import type { ColumnSortEvent } from "../models/ColumnSortEvent";
import { EditableOptions } from "../models/EditableOptions";
import type { FilterableOptions } from "../models/FilterableOptions";
import { GridAddEvent } from "../models/GridAddEvent";
import type { GridAggregateBucket, GridGroupAggregate } from "../models/GridAggregate";
import { GridCancelEvent } from "../models/GridCancelEvent";
import type { GridDataState } from "../models/GridDataState";
import type { GridEditContext } from "../models/GridEditContext";
import { GridEditEvent } from "../models/GridEditEvent";
import type { GridEditFormContext } from "../models/GridEditFormContext";
import type { GridEditSession } from "../models/GridEditSession";
import type { GridViewRow } from "../models/GridGroup";
import { GridKeySelector } from "../models/GridKeySelector";
import type { GridRowClass } from "../models/GridRowClass";
import type { GridLayoutColumn } from "../models/GridLayoutColumn";
import { GridRemoveEvent } from "../models/GridRemoveEvent";
import { GridSaveEvent } from "../models/GridSaveEvent";
import type {
    GridState,
    GridStateCompositeFilterDescriptor,
    GridStateFilterDescriptor,
    GridStateFilterValue,
    GridStateLoadResult,
    GridStatePersistenceOptions,
    GridStateSortDescriptor
} from "../models/GridState";
import type { GridStickyState } from "../models/GridStickyState";
import { GroupableOptions } from "../models/GroupableOptions";
import { GroupDescriptor } from "../models/GroupDescriptor";
import { PaginationState } from "../models/PaginationState";
import type { ReorderableOptions } from "../models/ReorderableOptions";
import type { ResizableOptions } from "../models/ResizableOptions";
import { Row } from "../models/Row";
import { RowEditEvent } from "../models/RowEditEvent";
import type { RowReorderableOptions } from "../models/RowReorderableOptions";
import { RowReorderEvent } from "../models/RowReorderEvent";
import { SelectableOptions } from "../models/SelectableOptions";
import { SortableOptions } from "../models/SortableOptions";
import type { StructuralColumnDescriptor } from "../models/StructuralColumn";
import { GRID_DEFAULT_MESSAGES } from "../i18n/grid.default-messages";
import { partitionFilters, toFilterMenuValue } from "./grid-filter-state";
import { buildGroupKey, groupKeyHasField, groupRowsByField } from "./grid-group-key";
import { GridRowFlattenerService } from "./grid-row-flattener.service";
import { isWellFormedGridState } from "./grid-state-validation";

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
const TEXT_MEASURE_CACHE_LIMIT = 1000;
/** What the aggregates read from a column. */
const AGGREGATE_COLUMN_KEYS = ["aggregate", "field", "id"] as const;
/** What grouping and the group rows read from a column. */
const GROUP_COLUMN_KEYS = ["dataType", "field", "groupFooterTemplate", "groupSortDirection", "id", "title"] as const;

/** Whether two column lists match on the given keys, so a computed can keep its previous value. */
function sameColumns(
    left: ImmutableList<Column>,
    right: ImmutableList<Column>,
    keys: readonly (keyof Column)[]
): boolean {
    if (left.length !== right.length) {
        return false;
    }
    const leftColumns = left.toArray();
    const rightColumns = right.toArray();
    return leftColumns.every(
        (column, index) => column === rightColumns[index] || keys.every(key => column[key] === rightColumns[index][key])
    );
}

/** Min and max consider numbers, bigints, strings, booleans and valid dates; other values are skipped. */
function isAggregateComparable(value: unknown): boolean {
    switch (typeof value) {
        case "bigint":
        case "boolean":
        case "string":
            return true;
        case "number":
            return !Number.isNaN(value);
        default:
            return value instanceof Date && !Number.isNaN(value.getTime());
    }
}

/** A finite number, or a numeric string such as `"12.5"`, as a number; anything else is `null`. */
function toAggregateNumber(value: unknown): number | null {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : null;
    }
    if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

@Injectable()
export class GridService {
    readonly #anchorRowKey = signal<unknown>(null);
    // Counts how many *selected* keys fall inside the current selection scope, iterating the
    // (usually much smaller) selection rather than rescanning the whole scope on every toggle.
    readonly #bulkSelectionRowKeys = computed(() => {
        const keys = new Set<unknown>();
        for (const row of this.bulkSelectionRows()) {
            keys.add(this.getRowSelectionKey(row));
        }
        return keys;
    });
    readonly #bulkSelectionSelectedCount = computed(() => {
        const scopeKeys = this.#bulkSelectionRowKeys();
        if (scopeKeys.size === 0) {
            return 0;
        }
        let count = 0;
        for (const key of this.selectedKeys()) {
            if (scopeKeys.has(key)) {
                count++;
            }
        }
        return count;
    });
    readonly #document = inject(DOCUMENT);
    readonly #editContext = signal<GridEditContext | null>(null);
    readonly #editSession = signal<GridEditSession | null>(null);
    readonly #externalFilters = signal<readonly CompositeFilterDescriptor[]>([]);
    readonly #filterableOptions = signal<FilterableOptions>({ enabled: false, type: "menu" });
    readonly #groupColumnIds = signal<ImmutableList<string>>(ImmutableList.create());
    readonly #horizontalScrollLeft = signal(0);
    readonly #i18n = inject(MonaI18nService);
    readonly #injector = inject(Injector);
    readonly #platformId = inject(PLATFORM_ID);
    readonly #reorderableOptions = signal<ReorderableOptions>({ enabled: false });
    readonly #resizableOptions = signal<ResizableOptions>({ enabled: false });
    readonly #rowFlattener = inject(GridRowFlattenerService);
    readonly #rowReorderableOptions = signal<RowReorderableOptions>({ enabled: false });
    readonly #rowUidByData = new WeakMap<Record<PropertyKey, unknown>, string>();
    readonly #rowUidByKeyObject = new WeakMap<object, string>();
    readonly #scrollbarGutterMeasurementSource = signal<"body" | "fallback">("fallback");
    readonly #scrollbarGutterWidth = signal(0);
    readonly #serverBindingEnabled = signal(false);
    readonly #serverLoading = signal(false);
    readonly #serverTotal = signal(0);
    readonly #sortDescriptors = signal<readonly SortDescriptor[]>([]);
    readonly #textMeasureCache = new Map<string, number>();
    #dataStateEmissionPending = false;
    /** The group descriptors last requested, including fields that have no column yet. */
    #groupRequest: readonly GroupDescriptor[] = [];
    /** The selection last loaded from the `selectedKeys` input, so its echo isn't reported as a user change. */
    #loadedSelectedKeys: ImmutableSet<unknown> | null = null;
    public readonly add$ = new Subject<GridAddEvent>();
    public readonly addRowData = computed(() => {
        const session = this.#editSession();
        return session?.operation === "create" ? session.model() : null;
    });
    public readonly addRowVisible = computed(() => this.addRowData() != null);
    public readonly aggregateColumns = computed(
        () =>
            this.visibleColumns()
                .where(column => column.kind === "data" && column.aggregate != null)
                .toImmutableList(),
        { equal: (left, right) => sameColumns(left, right, AGGREGATE_COLUMN_KEYS) }
    );
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
    public readonly allBulkSelectionRowsSelected = computed(() => {
        const scopeSize = this.#bulkSelectionRowKeys().size;
        return scopeSize > 0 && this.#bulkSelectionSelectedCount() === scopeSize;
    });
    public readonly appliedFilters = signal(ImmutableDictionary.create<string, ColumnFilterState>());
    public readonly bodyScrollElement = signal<HTMLElement | null>(null);
    public readonly bodyTableElement = signal<HTMLTableElement | null>(null);
    public readonly bulkSelectionRows = computed(() => {
        const options = this.selectableOptions();
        if (options.selectAllScope === "page" && !this.virtualScrollOptions().enabled) {
            return this.viewPageRows();
        }
        return this.viewRows();
    });
    public readonly cancel$ = new Subject<GridCancelEvent>();
    public readonly cellEdit$ = new Subject<CellEditEvent>();
    /** Set of currently collapsed group keys (global, shared by both paginated and virtual list). */
    public readonly collapsedGroupKeys = signal(ImmutableSet.create<string>());
    public readonly columnReorder$ = new Subject<ColumnReorderEvent>();
    public readonly columnResize$ = new Subject<ColumnResizeEvent>();
    /** True while the user drags a column edge; state persistence waits for the drag to end. */
    public readonly columnResizeActive = signal(false);
    public readonly columnSort$ = new Subject<ColumnSortEvent>();
    public readonly columns = signal<ImmutableList<Column>>(ImmutableList.create());
    public readonly contextMenuItems = signal(ImmutableSet.create<PopupMenuItem>());
    public readonly dataStateChange$ = new Subject<GridDataState>();
    public readonly detailColumnWidth = 36;
    public readonly draggingRowUid = signal<string | null>(null);
    public readonly edit$ = new Subject<GridEditEvent>();
    public readonly editContext = this.#editContext.asReadonly();
    public readonly editSession = this.#editSession.asReadonly();
    public readonly editViewDict = computed(() => {
        const session = this.#editSession();
        if (session == null || session.operation !== "update" || session.rowUid == null) {
            return ImmutableDictionary.create<string, RowEditDataItem>();
        }
        const item: RowEditDataItem = { $rowId: session.rowUid, ...session.model() };
        const pairs = [new KeyValuePair(item.$rowId, item)];
        return ImmutableDictionary.create(pairs);
    });
    public readonly editableOptions = signal<EditableOptions>({ enabled: false, mode: "cell" });
    public readonly editingRowUid = computed(() => this.#editContext()?.rowUid ?? null);
    /** Keys of the rows whose detail row is open: the `rowKey` value, or the data item without one. */
    public readonly expandedKeys = signal(ImmutableSet.create<unknown>());
    /** Emits the expanded keys after the user opens or closes a detail row. */
    public readonly expandedKeysChange$ = new Subject<unknown[]>();
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
    /** Emits the group descriptors after the user changes grouping, and after a state is applied. */
    public readonly groupChange$ = new Subject<GroupDescriptor[]>();
    public readonly groupColumnWidth = 36;
    /** The grouped columns; a width or visibility change elsewhere doesn't produce a new list. */
    public readonly groupColumns = computed(
        () => {
            const columnsById = new Map(this.columns().select(column => [column.id, column] as const));
            return this.#groupColumnIds()
                .select(id => columnsById.get(id))
                .where(column => column != null)
                .toImmutableList();
        },
        { equal: (left, right) => sameColumns(left, right, GROUP_COLUMN_KEYS) }
    );
    public readonly groupStructuralWidth = computed(() => this.groupColumns().length * this.groupColumnWidth);
    public readonly groupableOptions = signal<GroupableOptions>({ enabled: false, showFooter: false });
    public readonly hasFooter = computed(() => this.aggregateColumns().any());
    public readonly hasLeftLockedColumns = computed(
        () =>
            this.rowReorderColumnVisible() ||
            this.selectionColumnVisible() ||
            this.visibleColumns().any(column => column.locked && column.lockedPosition === "left")
    );
    public readonly hasLiveScrollbarGutterWidth = computed(() => this.#scrollbarGutterMeasurementSource() === "body");
    public readonly headerTableElement = signal<HTMLTableElement | null>(null);
    public readonly horizontalScrollLeft = this.#horizontalScrollLeft.asReadonly();
    public readonly isInEditMode = computed(() => this.#editSession() != null);
    // The physical column sequence shared by every table section: group indents, then the visible
    // structural columns, then the visible user columns. Each entry also carries its sticky state.
    public readonly layout = computed<readonly GridLayoutColumn[]>(() => {
        const columns = this.visibleColumns().toArray();
        const startLockedColumns = columns.filter(column => column.locked && column.lockedPosition === "left");
        const endLockedColumns = columns.filter(column => column.locked && column.lockedPosition === "right");
        const groupCount = this.groupColumns().length;
        const structuralColumns = this.visibleStructuralColumns();
        const leadingColumnCount = groupCount + structuralColumns.length;
        // Group indents and structural columns stay pinned alongside any start-pinned column. The innermost
        // pinned column draws the separator, so the leading columns only own it without start-locked columns.
        const leadingSticky = this.hasLeftLockedColumns();
        const leadingEdgeIndex = startLockedColumns.length === 0 ? leadingColumnCount - 1 : -1;
        let startOffset = 0;
        const nextLeadingSticky = (index: number, width: number): GridStickyState | null => {
            const offset = startOffset;
            startOffset += width;
            return leadingSticky ? { edge: index === leadingEdgeIndex, offset, side: "start" } : null;
        };

        const layout: GridLayoutColumn[] = [];
        for (let depth = 0; depth < groupCount; depth++) {
            layout.push({
                depth,
                key: `group:${depth}`,
                kind: "group",
                logicalIndex: null,
                sticky: nextLeadingSticky(depth, this.groupColumnWidth),
                width: this.groupColumnWidth
            });
        }
        // Arrow keys move across structural and user columns as one row.
        for (const [index, structuralColumn] of structuralColumns.entries()) {
            layout.push({
                firstInRow: index === 0,
                key: `structural:${structuralColumn.kind}`,
                kind: structuralColumn.kind,
                lastInRow: columns.length === 0 && index === structuralColumns.length - 1,
                logicalIndex: index,
                sticky: nextLeadingSticky(groupCount + index, structuralColumn.width),
                width: structuralColumn.width
            });
        }
        let logicalIndex = structuralColumns.length;

        const stickyByColumn = new Map<Column, GridStickyState>();
        for (const [index, column] of startLockedColumns.entries()) {
            stickyByColumn.set(column, {
                edge: index === startLockedColumns.length - 1,
                offset: startOffset,
                side: "start"
            });
            startOffset += this.getColumnWidth(column);
        }
        let endOffset = 0;
        for (const column of [...endLockedColumns].reverse()) {
            stickyByColumn.set(column, { edge: column === endLockedColumns[0], offset: endOffset, side: "end" });
            endOffset += this.getColumnWidth(column);
        }
        for (const [columnIndex, column] of columns.entries()) {
            layout.push({
                column,
                columnIndex,
                firstInRow: structuralColumns.length === 0 && columnIndex === 0,
                key: `column:${column.id}`,
                kind: "column",
                lastInRow: columnIndex === columns.length - 1,
                logicalIndex: logicalIndex++,
                sticky: stickyByColumn.get(column) ?? null,
                width: column.calculatedWidth
            });
        }
        return layout;
    });
    public readonly layoutColumnByKey = computed<ReadonlyMap<string, GridLayoutColumn>>(
        () => new Map(this.layout().map(layoutColumn => [layoutColumn.key, layoutColumn]))
    );
    public readonly leadingStructuralWidth = computed(
        () =>
            this.groupStructuralWidth() +
            this.visibleStructuralColumns().reduce((total, column) => total + column.width, 0)
    );
    public readonly masterDetailRowWidth = computed(() => {
        const columns = this.visibleColumns();
        const columnListWidth = columns.aggregate((acc, c) => acc + this.getColumnWidth(c), 0);
        return this.normalizeRenderedWidth(this.leadingStructuralWidth() + columnListWidth);
    });
    public readonly masterDetailTemplate = signal<TemplateRef<unknown> | null>(null);
    public readonly messages = this.#i18n.componentMessages("grid", GRID_DEFAULT_MESSAGES);
    public readonly newRowFactory = signal<() => Record<PropertyKey, unknown>>(() => ({}));
    public readonly pagerTotal = computed(() =>
        this.serverBindingEnabled() ? this.serverTotal() : this.viewRowCount()
    );
    public readonly paginationState = signal<PaginationState>({ page: 1, skip: 0, take: 10 });
    public readonly remove$ = new Subject<GridRemoveEvent>();
    public readonly reorderableOptions = this.#reorderableOptions.asReadonly();
    public readonly resizableOptions = this.#resizableOptions.asReadonly();
    public readonly rowClass = signal<GridRowClass<unknown> | null>(null);
    public readonly rowDragInProgress = computed(() => this.draggingRowUid() != null);
    public readonly rowEdit$ = new Subject<RowEditEvent>();
    public readonly rowKey = signal<GridKeySelector<unknown> | null>(null);
    public readonly rowReorder$ = new Subject<RowReorderEvent>();
    public readonly rowReorderColumnVisible = computed(() => this.rowReorderableOptions().enabled === true);
    public readonly rowReorderColumnWidth = 36;
    public readonly rowReorderDisabledReason = computed<RowReorderDisabledReason>(() => {
        if (!this.rowReorderableOptions().enabled) {
            return "disabled";
        }
        if (this.serverBindingEnabled()) {
            return "server-binding";
        }
        if (this.virtualScrollOptions().enabled) {
            return "virtual-scroll";
        }
        if (this.groupColumns().any()) {
            return "grouped";
        }
        if (this.#sortDescriptors().length > 0) {
            return "sorted";
        }
        if (!this.appliedFilters().isEmpty()) {
            return "filtered";
        }
        if (this.isInEditMode()) {
            return "editing";
        }
        if (this.viewPageRows().length < 2) {
            return "single-row";
        }
        return null;
    });
    public readonly rowReorderInteractionEnabled = computed(() => this.rowReorderDisabledReason() == null);
    public readonly rowReorderableOptions = this.#rowReorderableOptions.asReadonly();
    public readonly rows = signal<ImmutableList<Row>>(ImmutableList.create());
    public readonly save$ = new Subject<GridSaveEvent>();
    public readonly scrollEnd$ = new Subject<void>();
    public readonly scrollEndThreshold = signal<number>(5);
    public readonly scrollbarGutterWidth = this.#scrollbarGutterWidth.asReadonly();
    public readonly selectBy = signal<GridKeySelector<unknown>>("");
    public readonly selectableOptions = signal<SelectableOptions>({
        enabled: false,
        mode: "single",
        selectAllScope: "page",
        selectOnRowClick: false,
        showCheckboxes: false,
        showSelectAll: true
    });

    public readonly selectedKeys = signal(ImmutableSet.create());
    public readonly selectedKeysChange$ = toObservable(this.selectedKeys);
    public readonly selectedKeysLoad$ = new BehaviorSubject<ImmutableSet<unknown>>(ImmutableSet.create());
    public readonly selectedRows = computed(() => {
        const selectedKeys = this.selectedKeys();
        return this.rows()
            .where(row => selectedKeys.contains(this.getRowSelectionKey(row)))
            .toImmutableSet();
    });
    public readonly selectionColumnVisible = computed(() => {
        const options = this.selectableOptions();
        return options.enabled === true && options.showCheckboxes === true;
    });
    public readonly selectionColumnWidth = 40;
    public readonly serverBindingEnabled = this.#serverBindingEnabled.asReadonly();
    public readonly serverLoading = this.#serverLoading.asReadonly();
    public readonly serverTotal = this.#serverTotal.asReadonly();

    public readonly someBulkSelectionRowsSelected = computed(() => {
        const scopeSize = this.#bulkSelectionRowKeys().size;
        const count = this.#bulkSelectionSelectedCount();
        return count > 0 && count < scopeSize;
    });
    /** Emits the sort descriptors after a state is applied, for the `sort` model. */
    public readonly sortChange$ = new Subject<SortDescriptor[]>();
    public readonly sortableOptions = signal<SortableOptions>({
        enabled: false,
        mode: "single",
        allowUnsort: true,
        showIndices: true
    });
    // The fixed order of the structural columns; GridService.layout places them after the group indents.
    public readonly structuralColumns = computed<readonly StructuralColumnDescriptor[]>(() => [
        { kind: "reorder", visible: this.rowReorderColumnVisible(), width: this.rowReorderColumnWidth },
        { kind: "detail", visible: this.masterDetailTemplate() != null, width: this.detailColumnWidth },
        { kind: "selection", visible: this.selectionColumnVisible(), width: this.selectionColumnWidth }
    ]);
    public readonly tableWidth = computed(() => {
        const columns = this.visibleColumns();
        if (!columns.any()) {
            return null;
        }
        if (columns.any(c => c.calculatedWidth == null && c.width == null)) {
            return null;
        }
        const dataWidth = columns.aggregate((acc, c) => acc + this.getColumnWidth(c), 0);
        return this.normalizeRenderedWidth(dataWidth + this.leadingStructuralWidth());
    });
    public readonly viewPageRows = computed(() => {
        if (this.serverBindingEnabled()) {
            return this.viewRows();
        }
        const skip = this.paginationState().skip;
        const take = this.paginationState().take;
        const viewRows = this.viewRows();
        if (!viewRows.any()) {
            return ImmutableList.create<Row>();
        }
        return viewRows.skip(skip).take(take).toImmutableList();
    });
    public readonly viewRowCount = computed(() => this.viewRows().size());
    public readonly viewRows = computed(() => {
        const rows = this.rows();
        if (this.serverBindingEnabled()) {
            return rows;
        }
        let queryEnumerable = Query.from(rows, { locale: this.#i18n.localeId() });
        for (const filter of this.getFilterDescriptors()) {
            queryEnumerable = queryEnumerable.filter(filter, r => r.data);
        }

        // One sort: the group fields first, then the column sorts, so the groups keep their order.
        const groupSorts = this.getGroupDescriptors(this.groupColumns()).map<SortDescriptor>(d => ({
            field: d.field,
            dir: d.dir ?? "asc"
        }));
        const groupFields = new Set(groupSorts.map(sort => sort.field));
        const columnSorts = this.#sortDescriptors().filter(sort => !groupFields.has(sort.field));
        queryEnumerable = queryEnumerable.sort([...groupSorts, ...columnSorts], r => r.data);
        return ImmutableList.create(queryEnumerable.run());
    });
    public readonly virtualGridMaxBuffer = computed(() => this.virtualGridMinBuffer() * 1.42857);
    public readonly virtualGridMinBuffer = signal(0);
    public readonly virtualScrollOptions = signal<VirtualScrollOptions>({
        enabled: false,
        height: GRID_DEFAULT_VIRTUAL_ROW_HEIGHT
    });
    public readonly visibleColumns = computed(() =>
        this.columns()
            .where(column => !column.hidden)
            .toImmutableList()
    );
    public readonly visibleStructuralColumns = computed(() => this.structuralColumns().filter(c => c.visible));

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
        this.emitGroupChange();
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
        if (!isWellFormedGridState(state)) {
            return { ignoredColumns: [], missingColumns: [], status: "rejected-invalid" };
        }

        const previousDataState = this.getDataState();
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
        this.sortChange$.next(this.getSortDescriptors());
        this.groupChange$.next(this.getGroupDescriptors(this.groupColumns()));
        this.filterChange$.next(this.getFilterDescriptors());

        if (options.persistPageSize !== false && state.pageSize != null) {
            this.setPageState({ page: 1, skip: 0, take: state.pageSize });
        }
        if (this.serverBindingEnabled()) {
            this.setPageState({ skip: 0 });
        }

        if (!deepEquals(previousDataState, this.getDataState())) {
            this.requestDataStateChange({ resetPage: true });
        }

        return { ignoredColumns, missingColumns, status: "applied" };
    }

    public canReorderRow(row: Row): boolean {
        if (!this.rowReorderInteractionEnabled()) {
            return false;
        }
        const predicate = this.rowReorderableOptions().canReorder;
        return predicate?.(row.data) !== false;
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
            filter: this.getFilterDescriptors()
                .map(filter => this.serializeFilter(filter))
                .filter(filter => filter != null),
            group: this.getGroupDescriptors(this.groupColumns()),
            sort: this.getSortDescriptors().map<GridStateSortDescriptor>(sort => ({
                dir: sort.dir,
                field: sort.field
            })),
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
        this.clearCollapsedGroups(key => groupKeyHasField(key, column.field));
        this.emitGroupChange();
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

    /**
     * Builds the body rows for the given data rows: plain data rows when ungrouped, otherwise the flattened
     * group headers, data rows and group footers. Reads grouping state, so call it inside a computed.
     */
    public createBodyRows(rows: Iterable<Row>): GridViewRow[] {
        const groupColumns = this.groupColumns();
        if (groupColumns.length === 0) {
            return this.#rowFlattener.toDataRows(rows);
        }
        return this.#rowFlattener.flatten(
            rows,
            groupColumns,
            new Set(this.collapsedGroupKeys()),
            this.groupableOptions().showFooter,
            this.groupAggregateMap(),
            this.serverBindingEnabled(),
            { locale: this.#i18n.localeId() }
        );
    }

    public deselectAllRows(): void {
        this.selectedKeys.update(set => set.clear());
    }

    public deselectRow(row: Row): void {
        this.setRowSelected(row, false);
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
        if (this.#textMeasureCache.size >= TEXT_MEASURE_CACHE_LIMIT) {
            this.#textMeasureCache.clear();
        }
        this.#textMeasureCache.set(cacheKey, measured);
        return this.normalizeRenderedWidth(measured + totalAdditionalWidth);
    }

    public getColumnStateId(column: Column): string | null {
        return column.stateKey || column.field || null;
    }

    public getColumnWidth(column: Column): number {
        return this.normalizeRenderedWidth(column.calculatedWidth ?? column.width ?? column.minWidth ?? 0);
    }

    public getDataState(): GridDataState {
        const { skip, take } = this.paginationState();
        return {
            skip,
            take,
            sort: this.getSortDescriptors(),
            filter: this.getFilterDescriptors().map(filter => this.cloneFilter(filter))
        };
    }

    /** Every applied filter: the column filters, then the filters across columns. */
    public getFilterDescriptors(): CompositeFilterDescriptor[] {
        const columnFilters = this.appliedFilters()
            .values()
            .select(state => state.filter)
            .where((filter): filter is CompositeFilterDescriptor => filter != null)
            .toArray();
        return [...columnFilters, ...this.#externalFilters()];
    }

    public getGroupDescriptors(columns: Iterable<Column>): GroupDescriptor[] {
        return select(columns, c => ({
            field: c.field,
            dir: c.groupSortDirection ?? undefined
        })).toArray();
    }

    public getRowReorderAriaLabel(row: Row, absoluteIndex: number): string {
        const options = this.rowReorderableOptions();
        const label = options.rowAriaLabel?.(row.data, absoluteIndex);
        return label ?? this.messages().reorderRow(absoluteIndex + 1);
    }

    /** Sort order shared by models, persistence, and server requests. */
    public getSortDescriptors(): SortDescriptor[] {
        return this.#sortDescriptors().map(sort => ({ ...sort }));
    }

    public handleMultipleSelection(event: MouseEvent, row: Row): void {
        if (event.shiftKey) {
            this.selectRowRange(row);
            return;
        }
        if (event.ctrlKey || event.metaKey) {
            if (this.isRowSelected(row)) {
                this.deselectRow(row);
            } else {
                this.selectRow(row);
            }
            this.#anchorRowKey.set(this.getRowSelectionKey(row));
            return;
        }
        this.deselectAllRows();
        this.selectRow(row);
        this.#anchorRowKey.set(this.getRowSelectionKey(row));
    }

    public handleRowClick(event: MouseEvent, row: Row): void {
        const options = this.selectableOptions();
        if (!options.enabled || options.selectOnRowClick === false) {
            return;
        }
        if (options.mode === "single") {
            this.handleSingleSelection(event, row);
        } else {
            this.handleMultipleSelection(event, row);
        }
    }

    public handleSingleSelection(event: MouseEvent, row: Row): void {
        if (this.isRowSelected(row) && (event.ctrlKey || event.metaKey)) {
            this.deselectAllRows();
            return;
        }
        this.deselectAllRows();
        this.selectRow(row);
    }

    public isGroupCollapsed(groupKey: string): boolean {
        return this.collapsedGroupKeys().contains(groupKey);
    }

    /** Whether a selection value came from the `selectedKeys` input rather than from the user. */
    public isLoadedSelection(keys: ImmutableSet<unknown>): boolean {
        return keys === this.#loadedSelectedKeys;
    }

    public isRowExpanded(row: Row): boolean {
        return this.expandedKeys().contains(this.getRowIdentityKey(row));
    }

    public isRowSelected(row: Row): boolean {
        return this.selectedKeys().contains(this.getRowSelectionKey(row));
    }

    /** Sets the expanded detail rows from the `expandedKeys` input. */
    public loadExpandedKeys(keys: Iterable<unknown> | null | undefined): void {
        const next = ImmutableSet.create(keys ?? []);
        const current = this.expandedKeys();
        if (next.size() !== current.size() || !next.all(key => current.contains(key))) {
            this.expandedKeys.set(next);
        }
    }

    /**
     * Applies filters from code. Conditions on one field become that column's filter (repeated fields are
     * combined with `and`); filters across fields stay whole and are still applied and reported. Filters on
     * a field with no column are kept for when the column appears. Conditions with an unknown operator are
     * dropped.
     */
    public loadFilters(filters: Iterable<CompositeFilterDescriptor> | null | undefined): void {
        const requested = [...(filters ?? [])];
        if (deepEquals(requested, this.getFilterDescriptors())) {
            return;
        }
        const { byField, external } = partitionFilters(requested);
        const newAppliedFilters = new Dictionary<string, ColumnFilterState>();
        for (const [field, filter] of byField) {
            newAppliedFilters.put(field, { filter, filterMenuValue: toFilterMenuValue(filter) });
        }
        this.appliedFilters.set(
            newAppliedFilters.toImmutableDictionary(
                p => p.key,
                p => p.value
            )
        );
        this.#externalFilters.set(external);
        this.syncColumnFilterState();
    }

    /**
     * Applies group descriptors from code. A repeated field keeps its last descriptor; fields without a
     * column are remembered and grouped once their column appears.
     */
    public loadGroupColumns(descriptors: Iterable<GroupDescriptor> | null | undefined): void {
        const columns = this.columns();
        const byField = new Map<string, GroupDescriptor>();
        for (const descriptor of descriptors ?? []) {
            if (descriptor == null || typeof descriptor.field !== "string" || descriptor.field === "") {
                continue;
            }
            byField.delete(descriptor.field);
            byField.set(descriptor.field, { field: descriptor.field, dir: descriptor.dir === "desc" ? "desc" : "asc" });
        }
        this.#groupRequest = [...byField.values()];
        const descriptorList = this.#groupRequest.filter(descriptor =>
            columns.any(column => column.field === descriptor.field && column.kind !== "command")
        );
        const groupColumns = descriptorList
            .map(descriptor => columns.firstOrDefault(c => c.field === descriptor.field && c.kind !== "command"))
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
        const groupSortDirections = new Map<string, SortDirection>();
        for (const [index, column] of groupColumns.entries()) {
            groupSortDirections.set(column.id, descriptorList[index].dir ?? "asc");
        }
        this.updateColumns(column => ({
            ...column,
            groupSortDirection: groupSortDirections.get(column.id) ?? null
        }));
        this.#groupColumnIds.set(ImmutableList.create(groupColumns.map(column => column.id)));
    }

    public loadSelectedKeys(selectedKeys: Iterable<unknown>): void {
        this.selectedKeys.update(set => set.clear().addAll(selectedKeys));
        this.#loadedSelectedKeys = this.selectedKeys();
        this.selectedKeysLoad$.next(this.selectedKeys());
    }

    /**
     * Applies sort descriptors. They are kept whether or not a column shows the field, so a column added
     * later shows its sort; a repeated field keeps its last descriptor.
     */
    public loadSorts(sorts: Iterable<SortDescriptor> | null | undefined): void {
        const requested = [...(sorts ?? [])];
        if (deepEquals(requested, this.#sortDescriptors())) {
            return;
        }
        const byField = new Map<string, SortDescriptor>();
        for (const sort of requested) {
            if (sort == null || typeof sort.field !== "string" || sort.field === "") {
                continue;
            }
            if (sort.dir !== "asc" && sort.dir !== "desc") {
                continue;
            }
            byField.delete(sort.field);
            byField.set(sort.field, { ...sort });
        }
        this.#sortDescriptors.set([...byField.values()]);
        this.syncColumnSortState();
    }

    public moveGroupColumn(column: Column, moveAs: "prev" | "next"): void {
        const previous = this.#groupColumnIds();
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
        if (this.#groupColumnIds() !== previous) {
            this.emitGroupChange();
        }
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

    public requestDataStateChange(options: { readonly resetPage?: boolean } = {}): void {
        if (!this.serverBindingEnabled()) {
            return;
        }
        if (options.resetPage) {
            this.setPageState({ skip: 0 });
        }
        if (this.#dataStateEmissionPending) {
            return;
        }
        this.#dataStateEmissionPending = true;
        queueMicrotask(() => {
            this.#dataStateEmissionPending = false;
            if (this.serverBindingEnabled()) {
                this.dataStateChange$.next(this.getDataState());
            }
        });
    }

    public requestRowReorder(row: Row, previousPageIndex: number, currentPageIndex: number): boolean {
        if (!this.rowReorderInteractionEnabled()) {
            return false;
        }
        if (previousPageIndex === currentPageIndex) {
            return false;
        }
        if (!this.canReorderRow(row)) {
            return false;
        }
        const pageRows = this.viewPageRows();
        if (
            previousPageIndex < 0 ||
            previousPageIndex >= pageRows.length ||
            currentPageIndex < 0 ||
            currentPageIndex >= pageRows.length
        ) {
            return false;
        }
        const pageRow = pageRows.get(previousPageIndex);
        if (pageRow == null || pageRow.uid !== row.uid) {
            return false;
        }
        const skip = this.paginationState().skip;
        const previousIndex = skip + previousPageIndex;
        const currentIndex = skip + currentPageIndex;
        const reorderedData = this.rows()
            .select(sourceRow => sourceRow.data)
            .toArray();
        const [moved] = reorderedData.splice(previousIndex, 1);
        if (moved == null) {
            return false;
        }
        reorderedData.splice(currentIndex, 0, moved);
        const event = new RowReorderEvent({
            currentIndex,
            currentPageIndex,
            previousIndex,
            previousPageIndex,
            reorderedData,
            rowData: row.data
        });
        this.rowReorder$.next(event);
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
        this.setRowSelected(row, true);
    }

    public setBulkSelection(selected: boolean): void {
        if (this.selectableOptions().mode !== "multiple") {
            return;
        }
        const keys = this.bulkSelectionRows()
            .select(row => this.getRowSelectionKey(row))
            .toArray();
        if (selected) {
            this.selectedKeys.update(currentKeys => currentKeys.addAll(keys));
            return;
        }
        // ImmutableSet#exceptWith scans the removal list per retained element (O(n*m)); for large
        // virtualized grids that pairing is expensive, so filter through a native Set (O(n)) instead.
        const keysToRemove = new Set(keys);
        this.selectedKeys.update(currentKeys =>
            ImmutableSet.create([...currentKeys].filter(key => !keysToRemove.has(key)))
        );
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
        this.syncColumnSortState();
        this.syncColumnFilterState();
        const groupedFields = new Set(this.groupColumns().select(column => column.field));
        const groupable = this.#groupRequest.some(
            descriptor =>
                !groupedFields.has(descriptor.field) &&
                nextColumns.some(column => column.field === descriptor.field && column.kind !== "command")
        );
        if (groupable) {
            this.loadGroupColumns(this.#groupRequest);
        }
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

    /** Replaces the editing options; the feature is on unless `enabled` is `false`. */
    public setEditableOptions(options: Partial<EditableOptions>): void {
        this.editableOptions.set({ mode: "cell", ...options, enabled: options.enabled !== false });
    }

    /** Replaces the filtering options; the feature is on unless `enabled` is `false`. */
    public setFilterableOptions(options: Partial<FilterableOptions>): void {
        this.#filterableOptions.set({ type: "menu", ...options, enabled: options.enabled !== false });
    }

    /** Changes a group's direction from the group panel and reports it. */
    public setGroupSortDirection(column: Column, dir: SortDirection): void {
        this.setColumnGroupSortDirection(column.id, dir);
        this.emitGroupChange();
    }

    /** Replaces the grouping options; the feature is on unless `enabled` is `false`. */
    public setGroupableOptions(options: Partial<GroupableOptions>): void {
        this.groupableOptions.set({ showFooter: false, ...options, enabled: options.enabled !== false });
    }

    public setNewRowFactory(factory: () => Record<PropertyKey, unknown>): void {
        this.newRowFactory.set(factory);
    }

    public setPageState(state: Partial<PaginationState>): void {
        const current = this.paginationState();
        let take = state.take ?? current.take;
        let skip = state.skip ?? (state.page != null ? (state.page - 1) * take : current.skip);
        if (this.serverBindingEnabled()) {
            this.validateServerInteger(skip, "skip");
            if (!Number.isSafeInteger(take) || take <= 0) {
                throw new Error("monaGridServerBinding: pageSize must be a finite positive integer.");
            }
        } else {
            // Client paging ignores sizes and offsets it can't page with instead of showing page NaN.
            take = Number.isSafeInteger(take) && take > 0 ? take : current.take;
            skip = Number.isFinite(skip) && skip > 0 ? Math.floor(skip) : 0;
        }
        const page = Math.floor(skip / take) + 1;
        if (current.skip !== skip || current.take !== take || current.page !== page) {
            this.paginationState.set({ skip, take, page });
        }
    }

    /** Replaces the column reorder options; the feature is on unless `enabled` is `false`. */
    public setReorderableOptions(options: Partial<ReorderableOptions>): void {
        this.#reorderableOptions.set({ ...options, enabled: options.enabled !== false });
    }

    /** Replaces the column resize options; the feature is on unless `enabled` is `false`. */
    public setResizableOptions(options: Partial<ResizableOptions>): void {
        this.#resizableOptions.set({ ...options, enabled: options.enabled !== false });
    }

    public setRowExpanded(row: Row, expanded: boolean): void {
        const key = this.getRowIdentityKey(row);
        const keys = this.expandedKeys();
        if (keys.contains(key) === expanded) {
            return;
        }
        this.expandedKeys.set(expanded ? keys.add(key) : keys.remove(key));
        this.expandedKeysChange$.next(this.expandedKeys().toArray());
    }

    public setRowReorderableOptions(options: RowReorderableOptions): void {
        this.#rowReorderableOptions.set(options);
    }

    public setRowSelected(row: Row, selected: boolean): void {
        const key = this.getRowSelectionKey(row);
        const mode = this.selectableOptions().mode;

        if (selected) {
            if (mode === "single") {
                this.selectedKeys.set(ImmutableSet.create([key]));
            } else {
                this.selectedKeys.update(keys => keys.add(key));
            }
            return;
        }

        this.selectedKeys.update(keys => keys.remove(key));
    }

    public setRows(
        value: Iterable<Record<PropertyKey, unknown>>,
        rowKey: GridKeySelector<unknown> | null = null
    ): void {
        const occurrences = new Map<string, number>();
        let duplicateKey = false;
        const rows: Row[] = [];
        for (const data of value) {
            const uid = this.getRowUid(data, rowKey);
            const occurrence = (occurrences.get(uid) ?? 0) + 1;
            occurrences.set(uid, occurrence);
            if (occurrence > 1 && rowKey) {
                duplicateKey = true;
            }
            // A repeated item or key still gets its own row identity, so rendering and editing never collide.
            rows.push(new Row(data, occurrence === 1 ? uid : `${uid}#${occurrence}`));
        }
        if (duplicateKey && isDevMode()) {
            console.warn(
                "mona-grid: several rows have the same rowKey value. Selection, editing and detail rows " +
                    "follow the key, so give every row a unique key."
            );
        }
        this.rows.set(ImmutableList.create(rows));
    }

    public setScrollEndThreshold(threshold: number): void {
        this.scrollEndThreshold.set(threshold);
    }

    /** Replaces the selection options; the feature is on unless `enabled` is `false`. */
    public setSelectableOptions(options: Partial<SelectableOptions>): void {
        this.selectableOptions.set({
            mode: "single",
            selectAllScope: "page",
            selectOnRowClick: false,
            showCheckboxes: false,
            showSelectAll: true,
            ...options,
            enabled: options.enabled !== false
        });
    }

    public setServerBindingEnabled(enabled: boolean): void {
        if (enabled && this.virtualScrollOptions().enabled) {
            throw new Error("monaGridServerBinding and monaGridVirtualScroll cannot be enabled together.");
        }
        this.#serverBindingEnabled.set(enabled);
    }

    public setServerLoading(loading: boolean): void {
        this.#serverLoading.set(loading);
    }

    public setServerSkip(skip: number): void {
        this.validateServerInteger(skip, "skip");
        this.setPageState({ skip, page: Math.floor(skip / this.paginationState().take) + 1 });
    }

    public setServerTotal(total: number): void {
        this.validateServerInteger(total, "total");
        this.#serverTotal.set(total);
    }

    /** Replaces the sorting options; the feature is on unless `enabled` is `false`. */
    public setSortableOptions(options: Partial<SortableOptions>): void {
        this.sortableOptions.set({
            mode: "single",
            allowUnsort: true,
            showIndices: true,
            ...options,
            enabled: options.enabled !== false
        });
    }

    public setVirtualScrollOptions(options: VirtualScrollOptions): void {
        const height = options.height ?? this.virtualScrollOptions().height ?? GRID_DEFAULT_VIRTUAL_ROW_HEIGHT;
        if (!Number.isFinite(height) || height <= 0) {
            throw new Error("monaGridVirtualScroll: height must be finite and greater than zero.");
        }
        if (options.enabled && this.serverBindingEnabled()) {
            throw new Error("monaGridServerBinding and monaGridVirtualScroll cannot be enabled together.");
        }
        this.virtualScrollOptions.update(v => ({ ...v, ...options, height }));
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
        this.updateColumns(column => {
            if (column.id !== columnId) {
                return column;
            }
            const changed = (Object.keys(patch) as Array<keyof typeof patch>).some(key => column[key] !== patch[key]);
            return changed ? { ...column, ...patch } : column;
        });
    }

    private applyColumnIndexes(columns: readonly Column[]): Column[] {
        return this.withColumnIndices(columns);
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
        for (const { rows: groupRows, value: groupValue } of groupRowsByField(rows, column.field)) {
            const groupKey = buildGroupKey(parentKey, column.field, groupValue);
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

    private clearEditSession(): void {
        this.#editContext.set(null);
        this.#editSession.set(null);
    }

    private cloneFilter(filter: CompositeFilterDescriptor): CompositeFilterDescriptor {
        return {
            ...filter,
            filters: filter.filters.map(descriptor =>
                "filters" in descriptor
                    ? this.cloneFilter(descriptor)
                    : "value" in descriptor
                      ? ({ ...descriptor, value: this.cloneFilterValue(descriptor.value) } as FilterDescriptor)
                      : { ...descriptor }
            )
        };
    }

    private cloneFilterValue(value: unknown): unknown {
        if (value instanceof Date) {
            return new Date(value.getTime());
        }
        if (Array.isArray(value)) {
            return value.map(item => this.cloneFilterValue(item));
        }
        if (value != null && typeof value === "object") {
            return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, this.cloneFilterValue(item)]));
        }
        return value;
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
            const value = row.data[field];
            if (value == null) {
                continue;
            }
            count += 1;
            const numeric = toAggregateNumber(value);
            if (numeric != null) {
                sumValue += numeric;
                numericCount += 1;
            }

            if (!isAggregateComparable(value)) {
                continue;
            }

            const options = { locale: this.#i18n.localeId() };
            if (min == null || compareValues(value, min, options) < 0) {
                min = value;
            }
            if (max == null || compareValues(value, max, options) > 0) {
                max = value;
            }
        }

        const avg = numericCount > 0 ? sumValue / numericCount : undefined;
        const sum = sumValue;

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

    private emitGroupChange(): void {
        const groups = this.getGroupDescriptors(this.groupColumns());
        this.#groupRequest = groups;
        this.groupChange$.next(groups);
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
            return this.getRowUidKey(data, this.rowKey()) ?? data;
        }
        if (typeof selectBy === "string") {
            return data[selectBy];
        }
        return selectBy(data);
    }

    /** The key a row is tracked by across data refreshes: its `rowKey` value, or the data item. */
    private getRowIdentityKey(row: Row): unknown {
        return this.getRowUidKey(row.data, this.rowKey()) ?? row.data;
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

    private patchSessionField(session: GridEditSession, field: string, value: unknown): void {
        session.model.update(rowData => ({ ...rowData, [field]: value }));
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

    private resolveEditedRowData(
        rowUid: string,
        fallbackRowData: Record<PropertyKey, unknown>
    ): Record<PropertyKey, unknown> {
        const editedRowData = this.editViewDict().get(rowUid);
        if (editedRowData == null) {
            return fallbackRowData;
        }
        const { $rowId: _rowId, ...rowData } = editedRowData;
        return rowData;
    }

    private resolveSessionRowData(session: GridEditSession): Record<PropertyKey, unknown> {
        return { ...session.form().value() };
    }

    // Range selection is scoped to bulkSelectionRows() (current page, or full view when virtualized/
    // view-scoped) since that's the same click-reachable ordering used for the select-all checkbox.
    private selectRowRange(row: Row): void {
        const anchorKey = this.#anchorRowKey();
        const targetKey = this.getRowSelectionKey(row);
        if (anchorKey == null) {
            this.deselectAllRows();
            this.selectRow(row);
            this.#anchorRowKey.set(targetKey);
            return;
        }

        const rows = this.bulkSelectionRows().toArray();
        const anchorIndex = rows.findIndex(r => this.getRowSelectionKey(r) === anchorKey);
        const targetIndex = rows.findIndex(r => this.getRowSelectionKey(r) === targetKey);
        if (anchorIndex === -1 || targetIndex === -1) {
            this.deselectAllRows();
            this.selectRow(row);
            this.#anchorRowKey.set(targetKey);
            return;
        }

        const [start, end] = anchorIndex <= targetIndex ? [anchorIndex, targetIndex] : [targetIndex, anchorIndex];
        const rangeKeys = rows.slice(start, end + 1).map(r => this.getRowSelectionKey(r));
        this.selectedKeys.set(ImmutableSet.create(rangeKeys));
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

    private syncColumnFilterState(): void {
        const filters = this.appliedFilters();
        this.updateColumns(column => {
            const filtered = filters.containsKey(column.field);
            return column.filtered === filtered ? column : { ...column, filtered };
        });
    }

    private syncColumnSortState(): void {
        const sorts = this.#sortDescriptors();
        this.updateColumns(column => {
            const index = sorts.findIndex(sort => sort.field === column.field);
            const columnSortDirection = index < 0 ? null : sorts[index].dir;
            const sortIndex = index < 0 ? null : index + 1;
            return column.columnSortDirection === columnSortDirection && column.sortIndex === sortIndex
                ? column
                : { ...column, columnSortDirection, sortIndex };
        });
    }

    private updateColumns(updater: (column: Column) => Column): void {
        this.columns.update(columns => {
            const current = columns.toArray();
            const next = current.map(updater);
            // Unchanged columns keep their identity, and an update that changes nothing keeps the list.
            if (next.every((column, index) => column === current[index])) {
                return columns;
            }
            return ImmutableList.create(this.applyColumnIndexes(next));
        });
    }

    private validateServerInteger(value: number, name: string): void {
        if (!Number.isSafeInteger(value) || value < 0) {
            throw new Error(`monaGridServerBinding: ${name} must be a finite non-negative integer.`);
        }
    }

    private validateSessionForSave(session: GridEditSession): boolean {
        const rootField = session.form();
        const editedField = session.mode === "cell" && session.field != null ? session.form[session.field] : null;
        if (editedField == null) {
            rootField.markAsTouched();
            return !rootField.invalid() && !rootField.pending();
        }
        // A cell edit can only fix its own field. Row-level errors still block the save, but an invalid
        // sibling field must not trap the user in a cell whose own value is valid.
        const field = editedField();
        field.markAsTouched();
        return !field.invalid() && !field.pending() && rootField.errors().length === 0;
    }

    private withColumnIndices(columns: readonly Column[]): Column[] {
        return columns.map((column, index) => (column.index === index ? column : { ...column, index }));
    }
}

export type RowReorderDisabledReason =
    | "disabled"
    | "editing"
    | "filtered"
    | "grouped"
    | "server-binding"
    | "single-row"
    | "sorted"
    | "virtual-scroll"
    | null;
