import { LiveAnnouncer } from "@angular/cdk/a11y";
import {
    CdkDrag,
    CdkDragDrop,
    CdkDragEnd,
    CdkDragEnter,
    CdkDragMove,
    CdkDragPlaceholder,
    CdkDragPreview,
    CdkDragStart,
    CdkDropList
} from "@angular/cdk/drag-drop";
import {
    LucideArrowDown,
    LucideArrowLeft,
    LucideArrowRight,
    LucideArrowUp,
    LucideEllipsisVertical
} from "@lucide/angular";
import { NgTemplateOutlet } from "@angular/common";
import {
    afterEveryRender,
    afterNextRender,
    booleanAttribute,
    Component,
    computed,
    contentChild,
    contentChildren,
    DestroyRef,
    DOCUMENT,
    effect,
    ElementRef,
    inject,
    Injector,
    input,
    isDevMode,
    model,
    output,
    signal,
    TemplateRef,
    untracked,
    viewChild,
    viewChildren
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { fromEvent, type Subscription } from "rxjs";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { ChipComponent } from "@nanahoshi/mona-ui/chip";
import { FilterService } from "@nanahoshi/mona-ui/filter";
import { type PageChangeEvent, PagerComponent } from "@nanahoshi/mona-ui/pager";
import { PlaceholderComponent } from "@nanahoshi/mona-ui/placeholder";
import { PopupComponent } from "@nanahoshi/mona-ui/popup";
import {
    PopupMenuComponent,
    PopupMenuItemComponent,
    PopupMenuTextTemplateDirective
} from "@nanahoshi/mona-ui/popup-menu";
import { SortDirection } from "@nanahoshi/mona-ui/query";
import { twMerge } from "tailwind-merge";
import { v4 } from "uuid";
import { GridColumnResizeHandlerDirective } from "../../directives/grid-column-resize-handler.directive";
import { GridDetailTemplateDirective } from "../../directives/grid-detail-template.directive";
import { GridLockedCellDirective } from "../../directives/grid-locked-cell.directive";
import { GridLogicalCellDirective } from "../../directives/grid-logical-cell.directive";
import { GridNoDataTemplateDirective } from "../../directives/grid-no-data-template.directive";
import { GridToolbarTemplateDirective } from "../../directives/grid-toolbar-template.directive";
import type { Column } from "../../models/Column";
import { ColumnFilterState } from "../../models/ColumnFilterState";
import type { ColumnResizeEvent } from "../../models/ColumnResizeEvent";
import { ColumnSortEvent } from "../../models/ColumnSortEvent";
import { GRID_COLUMN_DEFINITION, type GridColumnDefinition } from "../../models/GridColumnDefinition";
import type { GridKeySelector } from "../../models/GridKeySelector";
import type { GridRowClass } from "../../models/GridRowClass";
import type { GridToolbarContext, GridToolbarTemplateContext } from "../../models/GridToolbarTemplateContext";
import { ResizeMethod } from "../../models/ResizeMethod";
import { ColumnAriaSortPipe } from "../../pipes/column-aria-sort.pipe";
import { isKeyboardEntryElement, observeGridCellTabStops } from "../../services/grid-cell-tab-stops";
import { GridNavigationService } from "../../services/grid-navigation.service";
import { GridService } from "../../services/grid.service";
import {
    gridBaseThemeVariants,
    gridColumnActionsThemeVariants,
    gridColumnDragPreviewThemeVariants,
    gridColumnDropHintThemeVariants,
    gridColumnResizerThemeVariants,
    gridFilterRowHeaderCellThemeVariants,
    gridFooterTableThemeVariants,
    gridFooterThemeVariants,
    gridGroupPanelPlaceholderThemeVariants,
    gridGroupPanelThemeVariants,
    gridHeaderTableCellThemeVariants,
    gridHeaderTableColumnTitleThemeVariants,
    gridHeaderTableColumnWrapThemeVariants,
    gridHeaderTableRowThemeVariants,
    gridHeaderTableThemeVariants,
    gridHeaderThemeVariants,
    gridNoDataThemeVariants,
    GridVariantInput,
    GridVariantProps
} from "../../styles/grid.styles";
import { GridColgroupComponent } from "../grid-colgroup/grid-colgroup.component";
import { GridColumnChooserComponent } from "../grid-column-chooser/grid-column-chooser.component";
import { GridFilterMenuComponent } from "../grid-filter-menu/grid-filter-menu.component";
import { GridFilterRowCellComponent } from "../grid-filter-row-cell/grid-filter-row-cell.component";
import { GridFooterRowComponent } from "../grid-footer-row/grid-footer-row.component";
import { GridListComponent } from "../grid-list/grid-list.component";
import { GridSelectAllCheckboxComponent } from "../grid-select-all-checkbox/grid-select-all-checkbox.component";
import { GridVirtualListComponent } from "../grid-virtual-list/grid-virtual-list.component";
import { SpinnerComponent } from "@nanahoshi/mona-ui/spinner";

/**
 * Controls in the toolbar. Ones the consumer took out of the Tab order stay out; the ones the toolbar manages
 * carry `data-grid-toolbar-item`, so they're still found once the roving Tab stop has set them to -1.
 */
const TOOLBAR_ITEM_SELECTOR =
    ":is(button, input, select, textarea, a[href], [tabindex]):not([tabindex='-1']), [data-grid-toolbar-item]";

@Component({
    selector: "mona-grid",
    templateUrl: "./grid.component.html",
    providers: [GridService, GridNavigationService, FilterService],
    imports: [
        LucideArrowDown,
        LucideArrowLeft,
        LucideArrowRight,
        LucideArrowUp,
        LucideEllipsisVertical,
        CdkDropList,
        ChipComponent,
        CdkDrag,
        NgTemplateOutlet,
        GridColgroupComponent,
        GridFilterMenuComponent,
        GridFilterRowCellComponent,
        GridFooterRowComponent,
        GridColumnResizeHandlerDirective,
        CdkDragPreview,
        GridListComponent,
        PagerComponent,
        GridVirtualListComponent,
        CdkDragPlaceholder,
        PlaceholderComponent,
        PopupMenuComponent,
        PopupMenuItemComponent,
        PopupMenuTextTemplateDirective,
        ColumnAriaSortPipe,
        GridLogicalCellDirective,
        GridLockedCellDirective,
        ButtonDirective,
        PopupComponent,
        GridColumnChooserComponent,
        GridSelectAllCheckboxComponent,
        SpinnerComponent
    ],
    host: {
        "[class]": "baseClass()",
        "[attr.data-uid]": "uid"
    }
})
export class GridComponent<T> implements GridVariantInput {
    readonly #destroyRef = inject(DestroyRef);

    readonly #document = inject(DOCUMENT);

    readonly #fitViewInitialScrollbarGutterWidth = signal<number | null>(null);

    readonly #fitViewScrollbarSyncResolved = signal(false);

    readonly #gridNavigationService = inject(GridNavigationService);

    readonly #hostElementRef = inject(ElementRef<HTMLElement>);

    readonly #injector = inject(Injector);

    readonly #liveAnnouncer = inject(LiveAnnouncer);

    readonly #manuallyResized = signal(false);

    readonly #registeredFooterScrollElement = signal<HTMLDivElement | null>(null);

    /** Escape was pressed during the current column drag. */
    #dragCancelled = false;

    #dragKeySubscription: Subscription | null = null;

    #resizeObserver: ResizeObserver | null = null;

    /** The toolbar control that holds its Tab stop; kept by element, so controls added before it don't take it. */
    #toolbarActiveItem: HTMLElement | null = null;

    /** Where the active control was, for when it's removed. */
    #toolbarActiveItemIndex = 0;

    private readonly columnDefinitions = contentChildren<GridColumnDefinition>(GRID_COLUMN_DEFINITION);

    private readonly filterMenus = viewChildren(GridFilterMenuComponent);

    private readonly footerScrollElement = viewChild<ElementRef<HTMLDivElement>>("footerScrollElement");

    /**
     * Every row of the grid: header rows, add row, body rows (group, detail and group footer rows included) and
     * footer. Exact when every row is drawn or rows are plain; -1 (unknown) for paged groups or detail rows.
     */
    protected readonly ariaRowCount = computed(() => {
        const gridService = this.gridService;
        const before = gridService.headerRowCount() + (gridService.addRowVisible() ? 1 : 0);
        const footer = gridService.hasFooter() ? 1 : 0;
        const allDrawn =
            gridService.virtualScrollOptions().enabled ||
            gridService.pagerTotal() <= gridService.paginationState().take;
        if (allDrawn) {
            // With no rows the body shows one row with the empty message.
            const bodyRows = gridService.renderedBodyRowCount();
            const emptyRow = bodyRows === 0 && !gridService.addRowVisible() ? 1 : 0;
            return before + bodyRows + emptyRow + footer;
        }
        const plainRows =
            gridService.groupColumns().length === 0 &&
            (gridService.masterDetailTemplate() == null || gridService.expandedKeys().size() === 0);
        return plainRows ? before + gridService.pagerTotal() + footer : -1;
    });

    protected readonly baseClass = computed(() => {
        const rounded = this.rounded();
        const variantClass = gridBaseThemeVariants({ rounded });
        const userClass = this.userClass();
        return twMerge(variantClass, userClass);
    });

    protected readonly columnActionsClass = computed(() => {
        return gridColumnActionsThemeVariants();
    });

    protected readonly columnDragPreviewClass = computed(() => {
        return gridColumnDragPreviewThemeVariants();
    });

    protected readonly columnDragging = signal(false);

    protected readonly columnDropHintClass = computed(() => {
        return gridColumnDropHintThemeVariants() + (this.dropAfter() ? " end-0" : " start-0");
    });

    protected readonly columnResizerClass = computed(() => {
        return gridColumnResizerThemeVariants();
    });

    protected readonly dragColumn = signal<Column | null>(null);

    /** Whether a dragged column goes after the hovered column rather than before it. */
    protected readonly dropAfter = signal(false);

    protected readonly dropColumn = signal<Column | null>(null);

    protected readonly filterMenuEnabled = computed(() => {
        const opts = this.gridService.filterableOptions();
        return opts.enabled && (opts.type === "menu" || opts.type === "menu, row");
    });

    protected readonly filterRowCellClass = computed(() => gridFilterRowHeaderCellThemeVariants());

    protected readonly filterRowEnabled = computed(() => this.gridService.filterRowEnabled());

    protected readonly footerClass = computed(() => {
        return gridFooterThemeVariants();
    });

    protected readonly footerTableClass = computed(() => {
        return gridFooterTableThemeVariants();
    });

    protected readonly footerVisible = computed(
        () => !this.gridService.virtualScrollOptions().enabled && this.gridService.hasFooter()
    );

    protected readonly gridDetailTemplate = contentChild(GridDetailTemplateDirective, { read: TemplateRef });

    /** A treegrid while rows are grouped, a grid otherwise. */
    protected readonly gridHeaderElement = viewChild.required<ElementRef<HTMLDivElement>>("gridHeaderElement");

    protected readonly gridHeaderTableElement = viewChild.required<ElementRef<HTMLTableElement>>("headerTable");

    protected readonly gridRole = computed(() => (this.gridService.groupColumns().length > 0 ? "treegrid" : "grid"));

    protected readonly gridService = inject(GridService);

    protected readonly gridWidthSet = signal(false);

    protected readonly groupColumnList = viewChild<CdkDropList>("groupColumnList");

    protected readonly groupPanelClass = computed(() => {
        return gridGroupPanelThemeVariants();
    });

    protected readonly groupPanelPlaceholderClass = computed(() => {
        return gridGroupPanelPlaceholderThemeVariants();
    });

    protected readonly groupPanelPlaceholderVisible = signal(true);

    protected readonly groupable = computed(() => this.gridService.groupableOptions().enabled);

    protected readonly groupingInProgress = signal(false);

    protected readonly headerClass = computed(() => {
        return gridHeaderThemeVariants();
    });

    /** Each header's keyboard shortcuts, for `aria-keyshortcuts`. */
    protected readonly headerKeyShortcuts = computed(() => {
        const shortcuts = new Map<string, string>();
        const reorderable = this.gridService.reorderableOptions().enabled;
        const groupable = this.groupable();
        for (const column of this.gridService.visibleColumns()) {
            const keys: string[] = [];
            if (this.filterMenuEnabled() && column.kind === "data" && column.filterable) {
                keys.push("Alt+ArrowDown");
            }
            if (reorderable && !column.locked) {
                keys.push("Control+Shift+ArrowLeft", "Control+Shift+ArrowRight");
            }
            if (groupable && column.kind === "data" && column.field !== "") {
                keys.push("Control+Shift+G");
            }
            if (keys.length !== 0) {
                shortcuts.set(column.id, keys.join(" "));
            }
        }
        return shortcuts;
    });

    protected readonly headerMarginInlineEnd = computed(() => this.gridService.scrollbarGutterWidth());

    protected readonly headerTableCellClass = computed(() => {
        return gridHeaderTableCellThemeVariants();
    });

    protected readonly headerTableClass = computed(() => {
        return gridHeaderTableThemeVariants();
    });

    protected readonly headerTableColumnTitleClass = computed(() => {
        return gridHeaderTableColumnTitleThemeVariants();
    });

    protected readonly headerTableColumnWrapClass = computed(() => {
        return gridHeaderTableColumnWrapThemeVariants();
    });

    protected readonly headerTableRowClass = computed(() => {
        return gridHeaderTableRowThemeVariants();
    });

    protected readonly messages = this.gridService.messages;

    protected readonly multiselectable = computed(() => {
        const options = this.gridService.selectableOptions();
        return options.enabled && options.mode === "multiple";
    });

    protected readonly noDataClass = computed(() => {
        return gridNoDataThemeVariants();
    });

    protected readonly noDataTemplate = contentChild(GridNoDataTemplateDirective, { read: TemplateRef });

    protected readonly resizing = signal(false);

    protected readonly toolbarContext = computed<GridToolbarTemplateContext>(() => {
        const context: GridToolbarContext = {
            addRowData: this.gridService.addRowData(),
            addRowVisible: this.gridService.addRowVisible(),
            cancelAdd: (): boolean => this.gridService.cancelAddRow(),
            cancelEdit: (): boolean => this.gridService.cancelEdit(),
            dataState: this.gridService.getDataState(),
            editSession: this.gridService.editSession(),
            saveAdd: (): boolean => this.gridService.saveAddRow(),
            selectedKeys: this.gridService.selectedKeys().toArray(),
            startAdd: (): boolean => this.gridService.startAddRow()
        };
        return { $implicit: context, ...context };
    });

    protected readonly toolbarElement = viewChild<ElementRef<HTMLDivElement>>("toolbarElement");

    protected readonly toolbarTemplate = contentChild(GridToolbarTemplateDirective, { read: TemplateRef });

    protected readonly uid = v4();

    /**
     * @description The grid's accessible name, such as "Orders". Use it, or `ariaLabelledBy`, rather than
     * an `aria-label` attribute on the host, which names nothing.
     * @default null
     */
    public readonly ariaLabel = input<string | null>(null);

    /**
     * @description The id of the element that names the grid, such as a heading above it.
     * @default null
     */
    public readonly ariaLabelledBy = input<string | null>(null);

    /**
     * @description The row data to be displayed in the grid.
     */
    public readonly data = input<Iterable<T>>([]);

    /**
     * @description Keys of the rows whose detail row is open: `rowKey` values, or the data items when the grid
     * has no `rowKey`. Supports two-way binding; `expandedKeysChange` emits when the user opens or closes one.
     * @default []
     */
    public readonly expandedKeys = model<unknown[]>([]);

    /**
     * @description Emitted when the user changes the page or the page size, and when the grid moves back to the
     * last page because the data shrank. Not emitted for `skip` or `pageSize` values set from code.
     */
    public readonly pageChange = output<PageChangeEvent>();

    /**
     * @description The number of items to be displayed on a page. Values that aren't positive integers are
     * ignored. A new size keeps the first row of the current page in view. Supports two-way binding.
     */
    public readonly pageSize = model<number>();

    /**
     * @description The page sizes that the user can select from.
     * These values will be displayed in the page size dropdown.
     * @default []
     */
    public readonly pageSizeValues = input<number[]>([]);

    /**
     * @description The method to be used to set initial column widths.
     * It can be the following values:
     * - `fitView`: The columns will be resized to fit the available width.
     * - `auto`: The columns will be resized based on the content.
     * - A number representing the width of the columns. All columns except the columns with a specified width
     *   will have the same width.
     * @default "fitView"
     */
    public readonly resizeMethod = input<ResizeMethod>("fitView");

    /**
     * @description Whether the pager is responsive.
     * If set to `true`, the pager will be displayed as a dropdown when the grid width gets smaller.
     * @default true
     */
    public readonly responsivePager = input(true, { transform: booleanAttribute });

    /**
     * @description The border radius of the grid.
     * @default "medium"
     */
    public readonly rounded = input<GridVariantProps["rounded"]>("medium");

    /**
     * @description Returns extra CSS classes for the data row that shows an item, merged onto the row's own
     * classes via `tailwind-merge`. It runs again whenever the item's row is rebound.
     * Group, group footer and detail rows are not affected.
     *
     * To dim a row, prefer a text style such as `text-muted-foreground` over `opacity`: locked cells stay
     * opaque so scrolled cells pass beneath them, and opacity on the row or its cells would let those show through.
     * @default null
     */
    public readonly rowClass = input<GridRowClass<T> | null>(null);

    /**
     * @description Field name or selector used to derive a stable identity for each row.
     * The resolved value must be unique within the grid data.
     * @default null
     */
    public readonly rowKey = input<GridKeySelector<unknown> | null>(null);

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    /**
     * @description The number of rows before the current page, in client paging. Supports two-way binding. With
     * `monaGridServerBinding`, the directive's `skip` sets the page and this model reports user changes.
     * @default 0
     */
    public readonly skip = model(0);

    public readonly userClass = input<string>("", { alias: "class" });

    public constructor() {
        effect(() => {
            const columns = this.columnDefinitions().map(definition => definition.getColumn());
            untracked(() => this.gridService.setColumnDefinitions(columns));
        });
        effect(() => this.gridService.rowClass.set(this.rowClass() as GridRowClass<unknown> | null));
        this.setPageSizeEffect();
        this.setPagingEffects();
        this.setGridDetailEffect();
        this.setDataEffect();
        this.setEditSessionEffect();
        this.setFooterScrollElementEffect();
        this.setFitViewScrollbarSyncEffect();
        // Every render: controls the toolbar template adds later join the roving Tab stop.
        afterEveryRender({
            write: () => this.syncToolbarFocusTargets()
        });
        this.#gridNavigationService.setViewport({
            scrollElement: () => this.gridService.bodyScrollElement(),
            stickyInset: () => this.gridService.stickyInset()
        });
        // Measures the first layout and stores it in signals: a read that writes.
        afterNextRender({
            mixedReadWrite: () => {
                this.gridService.gridHeaderElement.set(this.gridHeaderElement().nativeElement);
                this.gridService.headerTableElement.set(this.gridHeaderTableElement().nativeElement);
                this.setInitialCalculatedWidthOfColumns();
                this.#fitViewInitialScrollbarGutterWidth.set(this.gridService.scrollbarGutterWidth());
                this.gridWidthSet.set(true);
                this.setResizeObserver();
                const stopObservingTabStops = observeGridCellTabStops(this.#hostElementRef.nativeElement);
                this.#destroyRef.onDestroy(stopObservingTabStops);
            }
        });
        this.#destroyRef.onDestroy(() => this.#resizeObserver?.disconnect());
    }

    protected isColumnDragDisabled(column: Column): boolean {
        return column.locked || (!this.gridService.reorderableOptions().enabled && !this.groupable());
    }

    /** A dragged header leaves the page during the drag; give focus back to it once it's dropped. */
    protected onColumnDragEnd(event: CdkDragEnd<Column>): void {
        const columnId = event.source.data.id;
        afterNextRender(
            {
                write: () => {
                    const document = this.#hostElementRef.nativeElement.ownerDocument;
                    const activeElement = document.activeElement;
                    if (activeElement == null || activeElement === document.body) {
                        this.#gridNavigationService.focusHeaderCell(columnId);
                    }
                }
            },
            { injector: this.#injector }
        );
    }

    protected onColumnDragEnter(event: CdkDragEnter<void, Column>): void {
        this.groupPanelPlaceholderVisible.set(event.container !== this.groupColumnList());
    }

    protected onColumnDragEnterForGrouping(): void {
        this.groupingInProgress.set(true);
    }

    protected onColumnDragExitForGrouping(): void {
        this.groupingInProgress.set(false);
    }

    /** Puts the drop hint before or after the header under the pointer, which works for touch too. */
    protected onColumnDragMove(event: CdkDragMove<Column>): void {
        if (!this.columnDragging() || this.resizing() || this.#dragCancelled) {
            return;
        }
        const x = event.pointerPosition.x;
        const rtl = this.#isRtl();
        for (const headerCell of this.getTableColumnHeaderCellList()) {
            const columnId = headerCell.getAttribute("data-column-id");
            const rect = headerCell.getBoundingClientRect();
            if (columnId == null || x < rect.left || x > rect.right) {
                continue;
            }
            const column = this.gridService.columns().firstOrDefault(candidate => candidate.id === columnId);
            if (column == null) {
                return;
            }
            const pastMiddle = x > rect.left + rect.width / 2;
            this.dropColumn.set(column);
            this.dropAfter.set(pastMiddle !== rtl);
            return;
        }
    }

    protected onColumnDragStart(event: CdkDragStart<Column>): void {
        if (this.resizing() || event.source.data.locked) {
            return;
        }
        this.columnDragging.set(true);
        this.dragColumn.set(event.source.data);
        // Escape cancels the drag: the column stays where it was when it's released.
        this.#dragCancelled = false;
        this.#dragKeySubscription?.unsubscribe();
        this.#dragKeySubscription = fromEvent<KeyboardEvent>(this.#document, "keydown")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(keyEvent => {
                if (keyEvent.key === "Escape") {
                    keyEvent.preventDefault();
                    this.#dragCancelled = true;
                    this.dropColumn.set(null);
                    this.groupingInProgress.set(false);
                }
            });
    }

    protected onColumnDrop(): void {
        const dragColumn = this.dragColumn();
        const dropColumn = this.dropColumn();
        if (!dropColumn || !dragColumn || !this.columnDragging() || this.resizing() || this.#dragCancelled) {
            this.clearDragState();
            return;
        }
        if (this.getColumnLockBucket(dropColumn) !== this.getColumnLockBucket(dragColumn)) {
            this.clearDragState();
            return;
        }
        const dropColumnIndex = this.gridService
            .columns()
            .toArray()
            .findIndex(column => column.id === dropColumn.id);
        if (dropColumnIndex >= 0) {
            this.gridService.reorderColumn(dragColumn, dropColumnIndex + (this.dropAfter() ? 1 : 0));
        }
        this.clearDragState();
    }

    protected onColumnDropForGrouping(event: CdkDragDrop<Column, void, Column>): void {
        if (!this.groupable() || this.#dragCancelled) {
            this.clearDragState();
            return;
        }
        const column = event.item.data;
        if (column.kind === "command") {
            this.clearDragState();
            return;
        }
        if (this.gridService.groupColumns().any(groupColumn => groupColumn.id === column.id)) {
            this.clearDragState();
            return;
        }

        this.gridService.addGroupColumn(column);
        this.clearDragState();
    }

    protected onColumnFilter(column: Column, state: ColumnFilterState): void {
        if (state.filter && state.filter.filters.length > 0) {
            this.gridService.appliedFilters.update(dict => dict.put(column.field, state));
            this.gridService.setColumnFiltered(column.id, true);
        } else {
            this.gridService.appliedFilters.update(dict => dict.remove(column.field));
            this.gridService.setColumnFiltered(column.id, false);
        }
        this.gridService.filterChange$.next(this.gridService.getFilterDescriptors());
        this.gridService.requestDataStateChange({ resetPage: true });
    }

    protected onColumnResizeEnd(event: ColumnResizeEvent): void {
        this.resizing.set(false);
        this.gridService.columnResize$.next(event);
    }

    protected onColumnResizeStart(): void {
        this.#manuallyResized.set(true);
        this.resizing.set(true);
    }

    protected onColumnSort(column: Column): void {
        if (column.kind === "command" || !column.sortable) {
            return;
        }
        if (!this.gridService.sortableOptions().enabled) {
            return;
        }
        if (!column.field) {
            return;
        }
        this.gridService.columnSort$.next(new ColumnSortEvent(column));
    }

    /** Delete or Backspace on a group chip, or on its remove button, removes the group. */
    protected onGroupColumnReorder(column: Column, moveAs: "prev" | "next"): void {
        this.gridService.moveGroupColumn(column, moveAs);
    }

    protected onGroupingColumnRemove(event: Event, column: Column): void {
        event.stopPropagation();
        this.gridService.clearColumnGrouping(column);
        this.groupPanelPlaceholderVisible.set(this.gridService.groupColumns().length === 0);
    }

    protected onGroupingColumnSort(column: Column): void {
        let nextGroupSortDirection: SortDirection = "asc";
        if (column.groupSortDirection === "asc") {
            nextGroupSortDirection = "desc";
        } else if (column.groupSortDirection === "desc") {
            nextGroupSortDirection = "asc";
        }
        this.gridService.setGroupSortDirection(column, nextGroupSortDirection);
    }

    /**
     * Ctrl+Shift+ArrowLeft/Right (Cmd on macOS) moves the focused header's column, and Ctrl+Shift+G groups the
     * grid by it: the keyboard way to drag a header.
     */
    protected onHeaderKeydown(event: KeyboardEvent, column: Column): void {
        if (event.defaultPrevented || !(event.ctrlKey || event.metaKey) || !event.shiftKey || event.altKey) {
            return;
        }
        // Only keys pressed on the header itself, not on a control inside it.
        if (event.target !== event.currentTarget) {
            return;
        }
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            const forward = (event.key === "ArrowRight") !== this.#isRtl();
            this.#moveColumnByKeyboard(column, forward ? 1 : -1);
        } else if (event.code === "KeyG") {
            event.preventDefault();
            this.#groupByKeyboard(column);
        }
    }

    protected onPageChange(event: PageChangeEvent): void {
        const previous = this.gridService.paginationState();
        this.gridService.setPageState({ page: event.page, skip: event.skip, take: event.take });
        if (previous.skip !== event.skip || previous.take !== event.take) {
            this.gridService.requestDataStateChange();
            this.reportPage();
        }

        // The pager changed the page: show the new page from its first row.
        const scrollElement = this.gridService.bodyScrollElement();
        if (scrollElement != null) {
            scrollElement.scrollTop = 0;
        }
    }

    /** The toolbar's roving Tab stop follows focus, also when a control is clicked. */
    protected onToolbarFocusIn(event: FocusEvent): void {
        const target = event.target as HTMLElement;
        const item = this.getToolbarFocusTargets().find(
            candidate => candidate === target || candidate.contains(target)
        );
        if (item != null && item !== this.#toolbarActiveItem) {
            this.#toolbarActiveItem = item;
            this.syncToolbarFocusTargets();
        }
    }

    /** ArrowLeft/Right move between the toolbar's controls (mirrored in RTL), Home and End to its ends. */
    protected onToolbarKeydown(event: KeyboardEvent): void {
        const key = event.key;
        if (key !== "ArrowLeft" && key !== "ArrowRight" && key !== "Home" && key !== "End") {
            return;
        }
        const target = event.target as HTMLElement;
        // A text field keeps its caret keys, a select or slider its arrows, and text being composed its keys.
        if (
            event.defaultPrevented ||
            event.isComposing ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            isKeyboardEntryElement(target)
        ) {
            return;
        }
        const targets = this.getToolbarFocusTargets();
        if (targets.length === 0) {
            return;
        }

        event.preventDefault();
        const currentIndex = targets.findIndex(item => item === target || item.contains(target));
        let nextIndex: number;
        if (key === "Home") {
            nextIndex = 0;
        } else if (key === "End") {
            nextIndex = targets.length - 1;
        } else {
            const toolbarElement = this.toolbarElement()?.nativeElement;
            const rtl = toolbarElement?.ownerDocument.defaultView?.getComputedStyle(toolbarElement).direction === "rtl";
            const direction = (key === "ArrowRight") !== rtl ? 1 : -1;
            nextIndex = (Math.max(currentIndex, 0) + direction + targets.length) % targets.length;
        }
        this.#toolbarActiveItem = targets[nextIndex];
        this.syncToolbarFocusTargets();
        targets[nextIndex].focus();
    }

    /** Alt+ArrowDown on a header: opens the column's filter menu. */
    protected openColumnFilterMenu(column: Column): void {
        this.filterMenus()
            .find(menu => menu.column().id === column.id)
            ?.open();
    }

    private clampCalculatedWidth(column: Column, width: number): number {
        const minWidth = column.minWidth;
        const maxWidth = column.maxWidth;
        let calculatedWidth = width;
        if (minWidth && calculatedWidth < minWidth) {
            calculatedWidth = minWidth;
        } else if (maxWidth != null && calculatedWidth > maxWidth) {
            calculatedWidth = maxWidth;
        }
        return this.gridService.normalizeRenderedWidth(calculatedWidth);
    }

    #groupByKeyboard(column: Column): void {
        if (!this.groupable() || column.kind !== "data" || column.field === "") {
            return;
        }
        if (this.gridService.groupColumns().any(groupColumn => groupColumn.id === column.id)) {
            return;
        }
        this.gridService.addGroupColumn(column);
        void this.#liveAnnouncer.announce(this.messages().columnGrouped(column.title));
        this.#refocusHeader(column.id);
    }

    #isRtl(): boolean {
        const host: HTMLElement = this.#hostElementRef.nativeElement;
        return host.ownerDocument.defaultView?.getComputedStyle(host).direction === "rtl";
    }

    /** Moves a column past its visible neighbor, within its pinned group. */
    #moveColumnByKeyboard(column: Column, step: 1 | -1): void {
        if (column.locked || !this.gridService.reorderableOptions().enabled) {
            return;
        }
        const columns = this.gridService.columns().toArray();
        const bucket = this.getColumnLockBucket(column);
        const index = columns.findIndex(candidate => candidate.id === column.id);
        let neighbor = index + step;
        while (neighbor >= 0 && neighbor < columns.length && columns[neighbor].hidden) {
            neighbor += step;
        }
        const target = columns[neighbor];
        if (index < 0 || target == null || this.getColumnLockBucket(target) !== bucket) {
            return;
        }
        if (!this.gridService.reorderColumn(column, step === 1 ? neighbor + 1 : neighbor)) {
            return;
        }
        const position =
            this.gridService
                .visibleColumns()
                .toArray()
                .findIndex(candidate => candidate.id === column.id) + 1;
        void this.#liveAnnouncer.announce(this.messages().columnMoved(column.title, position));
        this.#refocusHeader(column.id);
    }

    /** Moving or grouping re-renders the header; keep focus on it, or on the grid when it's gone. */
    #refocusHeader(columnId: string): void {
        afterNextRender(
            {
                write: () => {
                    if (!this.#gridNavigationService.focusHeaderCell(columnId)) {
                        this.#gridNavigationService.focusActiveCellOrFirstHeader();
                    }
                }
            },
            { injector: this.#injector }
        );
    }

    private clearDragState(): void {
        this.dragColumn.set(null);
        this.dropColumn.set(null);
        this.dropAfter.set(false);
        this.columnDragging.set(false);
        this.groupingInProgress.set(false);
        this.#dragKeySubscription?.unsubscribe();
        this.#dragKeySubscription = null;
    }

    private createFitViewWidthMap(headerWidth: number): ReadonlyMap<string, number> {
        const flexibleColumns = this.gridService
            .visibleColumns()
            .where(column => column.width == null)
            .toArray();
        if (flexibleColumns.length === 0) {
            return new Map<string, number>();
        }

        const devicePixelRatio =
            this.gridHeaderElement().nativeElement.ownerDocument.defaultView?.devicePixelRatio ?? 1;
        const totalWidthUnits = Math.max(0, Math.round(headerWidth * devicePixelRatio));
        const widthByColumnId = new Map<string, number>();
        const baseWidthUnits = Math.floor(totalWidthUnits / flexibleColumns.length);
        let remainingWidthUnits = totalWidthUnits - baseWidthUnits * flexibleColumns.length;

        for (const column of flexibleColumns) {
            const widthUnits = baseWidthUnits + (remainingWidthUnits > 0 ? 1 : 0);
            if (remainingWidthUnits > 0) {
                remainingWidthUnits -= 1;
            }
            const calculatedWidth = widthUnits / devicePixelRatio;
            widthByColumnId.set(column.id, this.clampCalculatedWidth(column, calculatedWidth));
        }

        return widthByColumnId;
    }

    private getColumnLockBucket(column: Column): "left" | "right" | "unlocked" {
        return column.locked ? column.lockedPosition : "unlocked";
    }

    private getTableColumnHeaderCellList(): HTMLTableCellElement[] {
        const headerElement = this.gridHeaderElement();
        if (!headerElement) {
            return [];
        }
        const thList = headerElement.nativeElement.querySelectorAll("thead > tr:first-child > th");
        const headerCells = Array.from(thList) as HTMLTableCellElement[];
        if (this.gridService.rowReorderColumnVisible()) {
            headerCells.shift();
        }
        if (this.gridService.masterDetailTemplate()) {
            headerCells.shift();
        }
        if (this.gridService.selectionColumnVisible()) {
            headerCells.shift();
        }
        for (const _ of this.gridService.groupColumns()) {
            headerCells.shift();
        }
        return headerCells;
    }

    private getToolbarFocusTargets(): HTMLElement[] {
        const toolbarElement = this.toolbarElement()?.nativeElement;
        if (toolbarElement == null) {
            return [];
        }
        const targets = Array.from(toolbarElement.querySelectorAll<HTMLElement>(TOOLBAR_ITEM_SELECTOR));
        return targets.filter(target => !this.isElementDisabled(target) && !this.isElementHidden(target));
    }

    private isElementDisabled(element: HTMLElement): boolean {
        if (
            (element instanceof HTMLButtonElement ||
                element instanceof HTMLInputElement ||
                element instanceof HTMLSelectElement ||
                element instanceof HTMLTextAreaElement) &&
            element.disabled
        ) {
            return true;
        }

        return element.getAttribute("aria-disabled") === "true" || element.hasAttribute("disabled");
    }

    private isElementHidden(element: HTMLElement): boolean {
        return element.closest("[hidden]") != null || element.getAttribute("aria-hidden") === "true";
    }

    private reportPage(): void {
        const { page, skip, take } = this.gridService.paginationState();
        this.skip.set(skip);
        if (this.pageSize() !== take) {
            this.pageSize.set(take);
        }
        this.pageChange.emit({ page, skip, take });
    }

    private setDataEffect(): void {
        effect(() => {
            const data = this.data();
            const rowKey = this.rowKey();
            const shouldRestoreGridFocus = this.#hostElementRef.nativeElement.contains(
                this.#hostElementRef.nativeElement.ownerDocument.activeElement
            );
            untracked(() => {
                this.gridService.setRows(data as Iterable<Record<PropertyKey, unknown>>, rowKey);
                this.gridService.setRowKey(rowKey);
            });
            if (shouldRestoreGridFocus) {
                afterNextRender(
                    {
                        // Moves focus, which writes to the DOM.
                        mixedReadWrite: () => {
                            // An open editor owns its own focus; restoring the logical cell would steal it.
                            if (this.gridService.editContext() != null) {
                                return;
                            }
                            // Focus that survived the render, or was already put back, stays where it is.
                            const host = this.#hostElementRef.nativeElement;
                            if (host.contains(host.ownerDocument.activeElement)) {
                                return;
                            }
                            this.#gridNavigationService.focusActiveCellOrFirstHeader();
                        }
                    },
                    { injector: this.#injector }
                );
            }
        });
    }

    /** An edit whose row was replaced follows the new data; one whose row left the data or the view ends. */
    private setEditSessionEffect(): void {
        effect(() => {
            if (this.gridService.editSession()?.operation !== "update") {
                return;
            }
            this.gridService.rows();
            this.gridService.viewPageRows();
            untracked(() => this.gridService.reconcileEditSession());
        });
    }

    private setFitViewScrollbarSyncEffect(): void {
        effect(() => {
            if (this.resizeMethod() !== "fitView" || !this.gridWidthSet()) {
                return;
            }
            if (this.#fitViewScrollbarSyncResolved() || this.#manuallyResized()) {
                return;
            }
            if (!this.gridService.hasLiveScrollbarGutterWidth()) {
                return;
            }

            const initialScrollbarGutterWidth = this.#fitViewInitialScrollbarGutterWidth();
            if (initialScrollbarGutterWidth == null) {
                return;
            }

            const liveScrollbarGutterWidth = this.gridService.scrollbarGutterWidth();
            this.#fitViewScrollbarSyncResolved.set(true);

            if (liveScrollbarGutterWidth !== initialScrollbarGutterWidth) {
                untracked(() => this.setInitialCalculatedWidthOfColumns());
            }
        });
    }

    private setFooterScrollElementEffect(): void {
        effect(() => {
            const virtual = this.gridService.virtualScrollOptions().enabled;
            const currentRegisteredElement = this.#registeredFooterScrollElement();
            if (virtual) {
                if (
                    currentRegisteredElement != null &&
                    this.gridService.footerScrollElement() === currentRegisteredElement
                ) {
                    untracked(() => {
                        this.gridService.footerScrollElement.set(null);
                        this.#registeredFooterScrollElement.set(null);
                    });
                }
                return;
            }
            const footerScrollElement = this.footerScrollElement()?.nativeElement ?? null;
            untracked(() => {
                this.#registeredFooterScrollElement.set(footerScrollElement);
                this.gridService.footerScrollElement.set(footerScrollElement);
            });
        });
    }

    private setGridDetailEffect(): void {
        effect(() => {
            let detailTemplate = this.gridDetailTemplate() ?? null;
            // Virtual scrolling needs rows of one height, which a detail row would break.
            if (detailTemplate != null && this.gridService.virtualScrollOptions().enabled) {
                if (isDevMode()) {
                    console.warn(
                        "mona-grid: detail rows (monaGridDetailTemplate) aren't supported with virtual scrolling and are not shown."
                    );
                }
                detailTemplate = null;
            }
            untracked(() => this.gridService.masterDetailTemplate.set(detailTemplate));
        });
    }

    private setInitialCalculatedWidthOfColumns(): void {
        if (this.gridService.gridHeaderElement()) {
            const headerElement = this.gridService.gridHeaderElement() as HTMLElement;
            const headerCells = this.getTableColumnHeaderCellList();
            let headerWidth = headerElement.clientWidth;
            const columnsWithWidth = this.gridService.visibleColumns().where(c => c.width != null);
            if (columnsWithWidth.any()) {
                headerWidth -= columnsWithWidth.sum(c => c.width ?? 0);
            }
            if (this.gridService.rowReorderColumnVisible()) {
                headerWidth -= this.gridService.rowReorderColumnWidth;
            }
            if (this.gridService.masterDetailTemplate()) {
                headerWidth -= this.gridService.detailColumnWidth;
            }
            if (this.gridService.selectionColumnVisible()) {
                headerWidth -= this.gridService.selectionColumnWidth;
            }
            headerWidth -= this.gridService.groupColumnWidth * this.gridService.groupColumns().length;
            const fitViewWidthByColumn =
                this.resizeMethod() === "fitView" ? this.createFitViewWidthMap(headerWidth) : new Map<string, number>();
            const visibleColumns = this.gridService.visibleColumns().toArray();
            const widthByColumnId = new Map<string, number | null>();

            for (const [cx, gridCol] of visibleColumns.entries()) {
                const columnTh = headerCells[cx];
                if (columnTh == null) {
                    continue;
                }
                const explicitWidth = gridCol.width;
                if (explicitWidth != null) {
                    widthByColumnId.set(gridCol.id, this.gridService.normalizeRenderedWidth(explicitWidth));
                    continue;
                }

                let calculatedWidth: number;
                if (typeof this.resizeMethod() === "number") {
                    calculatedWidth = this.resizeMethod() as number;
                } else if (this.resizeMethod() === "fitView") {
                    calculatedWidth = fitViewWidthByColumn.get(gridCol.id) ?? 0;
                } else {
                    calculatedWidth = this.gridService.findTextWidthOfColumn(gridCol, columnTh);
                }

                widthByColumnId.set(gridCol.id, this.clampCalculatedWidth(gridCol, calculatedWidth));
            }
            this.gridService.setCalculatedWidths(widthByColumnId);
        }
    }

    private setPageSizeEffect(): void {
        effect(() => {
            const pageSize = this.pageSize();
            if (pageSize == null || !Number.isSafeInteger(pageSize) || pageSize < 1) {
                return;
            }
            untracked(() => {
                const { skip, take } = this.gridService.paginationState();
                if (take !== pageSize) {
                    // Keep the first row of the current page in view instead of showing a page between boundaries.
                    this.gridService.setPageState({ take: pageSize, skip: Math.floor(skip / pageSize) * pageSize });
                }
            });
        });
    }

    private setPagingEffects(): void {
        effect(() => {
            const skip = this.skip();
            untracked(() => {
                if (!this.gridService.serverBindingEnabled()) {
                    this.gridService.setPageState({ skip });
                }
            });
        });
        effect(() => {
            const keys = this.expandedKeys();
            untracked(() => this.gridService.loadExpandedKeys(keys));
        });
        this.gridService.expandedKeysChange$
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(keys => this.expandedKeys.set(keys));
        // Client paging: when the rows shrink below the current page (new data, a removed row, a filter), move
        // back to the last page instead of showing an empty page without a pager.
        effect(() => {
            const count = this.gridService.viewRowCount();
            if (
                count === 0 ||
                this.gridService.serverBindingEnabled() ||
                this.gridService.virtualScrollOptions().enabled
            ) {
                return;
            }
            untracked(() => {
                const { skip, take } = this.gridService.paginationState();
                const lastPageSkip = Math.floor((count - 1) / take) * take;
                if (skip > lastPageSkip) {
                    this.gridService.setPageState({ skip: lastPageSkip });
                    this.reportPage();
                }
            });
        });
    }

    private setResizeObserver(): void {
        if (typeof ResizeObserver === "undefined") {
            return;
        }
        this.#resizeObserver = new ResizeObserver(() => {
            const rect = this.#hostElementRef.nativeElement.getBoundingClientRect();
            this.gridService.virtualGridMinBuffer.set(rect.height);
        });
        this.#resizeObserver.observe(this.#hostElementRef.nativeElement);
    }

    private syncToolbarFocusTargets(): void {
        const targets = this.getToolbarFocusTargets();
        if (targets.length === 0) {
            return;
        }
        const itemIndex = this.#toolbarActiveItem == null ? -1 : targets.indexOf(this.#toolbarActiveItem);
        const activeIndex = itemIndex !== -1 ? itemIndex : Math.min(this.#toolbarActiveItemIndex, targets.length - 1);
        this.#toolbarActiveItem = targets[activeIndex];
        this.#toolbarActiveItemIndex = activeIndex;
        for (const [index, target] of targets.entries()) {
            const tabIndex = index === activeIndex ? "0" : "-1";
            if (target.getAttribute("tabindex") !== tabIndex) {
                target.setAttribute("tabindex", tabIndex);
            }
            target.setAttribute("data-grid-toolbar-item", "");
        }
    }
}
