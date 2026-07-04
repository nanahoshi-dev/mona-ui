import {
    CdkDrag,
    CdkDragDrop,
    CdkDragEnter,
    CdkDragPlaceholder,
    CdkDragPreview,
    CdkDragStart,
    CdkDropList
} from "@angular/cdk/drag-drop";
import { isPlatformBrowser, NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    afterRenderEffect,
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChild,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    Injector,
    input,
    output,
    PLATFORM_ID,
    signal,
    TemplateRef,
    untracked,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { twMerge } from "tailwind-merge";
import { v4 } from "uuid";
import { ButtonDirective } from "../../../buttons/button/directives/button.directive";
import { ChipComponent } from "../../../buttons/chip/component/chip.component";
import { PopupMenuItemComponent } from "../../../common/popup-menu/components/popup-menu-item/popup-menu-item.component";
import { PopupMenuComponent } from "../../../common/popup-menu/components/popup-menu/popup-menu.component";
import { PopupMenuTextTemplateDirective } from "../../../common/popup-menu/directives/popup-menu-text-template.directive";
import { FilterService } from "../../../filter/services/filter.service";
import { PlaceholderComponent } from "../../../layout/placeholder/components/placeholder/placeholder.component";
import { PagerComponent } from "../../../pager/components/pager/pager.component";
import { PageChangeEvent } from "../../../pager/models/PageChangeEvent";
import { PageSizeChangeEvent } from "../../../pager/models/PageSizeChangeEvent";
import { PopupComponent } from "../../../popup/components/popup/popup.component";
import { SortDirection } from "../../../query/sort/SortDescriptor";
import { ThemeService } from "../../../theme/services/theme.service";
import { GridColumnResizeHandlerDirective } from "../../directives/grid-column-resize-handler.directive";
import { GridDetailTemplateDirective } from "../../directives/grid-detail-template.directive";
import { GridFooterTableCellDirective } from "../../directives/grid-footer-table-cell.directive";
import { GridLockedCellDirective } from "../../directives/grid-locked-cell.directive";
import { GridLogicalCellDirective } from "../../directives/grid-logical-cell.directive";
import { GridNoDataTemplateDirective } from "../../directives/grid-no-data-template.directive";
import { GridToolbarTemplateDirective } from "../../directives/grid-toolbar-template.directive";
import { CellEditEvent } from "../../models/CellEditEvent";
import type { Column } from "../../models/Column";
import { ColumnFilterState } from "../../models/ColumnFilterState";
import { ColumnReorderEvent } from "../../models/ColumnReorderEvent";
import type { ColumnResizeEvent } from "../../models/ColumnResizeEvent";
import { ColumnSortEvent } from "../../models/ColumnSortEvent";
import { GridAddEvent } from "../../models/GridAddEvent";
import { GridCancelEvent } from "../../models/GridCancelEvent";
import { GridEditEvent } from "../../models/GridEditEvent";
import { GridRemoveEvent } from "../../models/GridRemoveEvent";
import { GridSaveEvent } from "../../models/GridSaveEvent";
import { ResizeMethod } from "../../models/ResizeMethod";
import { RowEditEvent } from "../../models/RowEditEvent";
import { ColumnAriaSortPipe } from "../../pipes/column-aria-sort.pipe";
import { GridNavigationService } from "../../services/grid-navigation.service";
import { GridRowFlattenerService } from "../../services/grid-row-flattener.service";
import { GridService } from "../../services/grid.service";
import {
    gridBaseThemeVariants,
    gridColumnActionsThemeVariants,
    gridColumnDragPreviewThemeVariants,
    gridColumnDropHintThemeVariants,
    gridColumnResizerThemeVariants,
    gridFooterTableRowThemeVariants,
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
import { GridColumnChooserComponent } from "../grid-column-chooser/grid-column-chooser.component";
import { GridFilterMenuComponent } from "../grid-filter-menu/grid-filter-menu.component";
import { GridFilterRowCellComponent } from "../grid-filter-row-cell/grid-filter-row-cell.component";
import { GridFooterCellComponent } from "../grid-footer-cell/grid-footer-cell.component";
import { GridListComponent } from "../grid-list/grid-list.component";
import { GridVirtualListComponent } from "../grid-virtual-list/grid-virtual-list.component";

const FOCUSABLE_TARGET_SELECTOR = "button, input, select, textarea, a[href], [tabindex]";

@Component({
    selector: "mona-grid",
    templateUrl: "./grid.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [GridService, GridNavigationService, GridRowFlattenerService, FilterService],
    imports: [
        CdkDropList,
        ChipComponent,
        CdkDrag,
        NgTemplateOutlet,
        GridFilterMenuComponent,
        GridFilterRowCellComponent,
        GridFooterCellComponent,
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
        GridFooterTableCellDirective,
        GridLogicalCellDirective,
        GridLockedCellDirective,
        ButtonDirective,
        PopupComponent,
        GridColumnChooserComponent
    ],
    host: {
        "[class]": "baseClass()",
        "[attr.data-uid]": "uid",
        role: "grid"
    }
})
export class GridComponent<T> implements GridVariantInput {
    readonly #destroyRef = inject(DestroyRef);
    readonly #fitViewInitialScrollbarGutterWidth = signal<number | null>(null);
    readonly #fitViewScrollbarSyncResolved = signal(false);
    readonly #gridNavigationService = inject(GridNavigationService);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    readonly #injector = inject(Injector);
    readonly #manuallyResized = signal(false);
    readonly #platformId = inject(PLATFORM_ID);
    readonly #registeredFooterScrollElement = signal<HTMLDivElement | null>(null);
    readonly #toolbarActiveIndex = signal(0);
    readonly #themeService = inject(ThemeService);
    #resizeObserver: ResizeObserver | null = null;
    private readonly footerScrollElement = viewChild<ElementRef<HTMLDivElement>>("footerScrollElement");
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const variantClass = gridBaseThemeVariants(theme)({ rounded });
        const userClass = this.userClass();
        return twMerge(variantClass, userClass);
    });
    protected readonly columnActionsClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridColumnActionsThemeVariants(theme)();
    });
    protected readonly columnDragPreviewClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridColumnDragPreviewThemeVariants(theme)();
    });
    protected readonly columnDragging = signal(false);
    protected readonly columnDropHintClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridColumnDropHintThemeVariants(theme)();
    });
    protected readonly columnResizerClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridColumnResizerThemeVariants(theme)();
    });
    protected readonly dragColumn = signal<Column | null>(null);
    protected readonly dropColumn = signal<Column | null>(null);
    protected readonly filterMenuEnabled = computed(() => {
        const opts = this.gridService.filterableOptions();
        return opts.enabled && (opts.type === "menu" || opts.type === "menu, row");
    });
    protected readonly filterRowEnabled = computed(() => {
        const opts = this.gridService.filterableOptions();
        return opts.enabled && (opts.type === "row" || opts.type === "menu, row");
    });
    protected readonly footerClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridFooterThemeVariants(theme)();
    });
    protected readonly footerTableClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridFooterTableThemeVariants(theme)();
    });
    protected readonly footerTableRowClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridFooterTableRowThemeVariants(theme)();
    });
    protected readonly footerVisible = computed(
        () => !this.gridService.virtualScrollOptions().enabled && this.gridService.hasFooter()
    );
    protected readonly gridDetailTemplate = contentChild(GridDetailTemplateDirective, { read: TemplateRef });
    protected readonly gridHeaderElement = viewChild.required<ElementRef<HTMLDivElement>>("gridHeaderElement");
    protected readonly gridHeaderTableElement = viewChild.required<ElementRef<HTMLTableElement>>("headerTable");
    protected readonly gridService = inject(GridService);
    protected readonly gridWidthSet = signal(false);
    protected readonly groupColumnList = viewChild<CdkDropList>("groupColumnList");
    protected readonly groupPanelPlaceholderClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridGroupPanelPlaceholderThemeVariants(theme)();
    });
    protected readonly groupPanelClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridGroupPanelThemeVariants(theme)();
    });
    protected readonly groupPanelPlaceholderVisible = signal(true);
    protected readonly groupable = computed(() => this.gridService.groupableOptions().enabled);
    protected readonly groupingInProgress = signal(false);
    protected readonly headerClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridHeaderThemeVariants(theme)();
    });
    protected readonly headerMarginRight = computed(() => this.gridService.scrollbarGutterWidth());
    protected readonly headerTableClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridHeaderTableThemeVariants(theme)();
    });
    protected readonly headerTableCellClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridHeaderTableCellThemeVariants(theme)();
    });
    protected readonly headerTableColumnTitleClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridHeaderTableColumnTitleThemeVariants(theme)();
    });
    protected readonly headerTableColumnWrapClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridHeaderTableColumnWrapThemeVariants(theme)();
    });
    protected readonly headerTableRowClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridHeaderTableRowThemeVariants(theme)();
    });
    protected readonly noDataClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridNoDataThemeVariants(theme)();
    });
    protected readonly noDataTemplate = contentChild(GridNoDataTemplateDirective, { read: TemplateRef });
    protected readonly resizing = signal(false);
    protected readonly toolbarContext = computed(() => ({
        $implicit: this.gridService,
        addRowData: this.gridService.addRowData(),
        addRowVisible: this.gridService.addRowVisible(),
        cancelAdd: (): boolean => this.gridService.cancelAddRow(),
        saveAdd: (): boolean => this.gridService.saveAddRow(),
        startAdd: (): boolean => this.gridService.startAddRow()
    }));
    protected readonly toolbarElement = viewChild<ElementRef<HTMLDivElement>>("toolbarElement");
    protected readonly toolbarTemplate = contentChild(GridToolbarTemplateDirective, { read: TemplateRef });
    protected readonly uid = v4();

    /**
     * @description Emitted before the grid displays the new-row editor.
     */
    public readonly add = output<GridAddEvent>();

    /**
     * @description Emitted before an edit operation is cancelled.
     */
    public readonly cancel = output<GridCancelEvent>();

    /**
     * @description Emitted when a cell is edited.
     */
    public readonly cellEdit = output<CellEditEvent>();

    /**
     * @description Emitted before a row enters edit mode.
     */
    public readonly edit = output<GridEditEvent>();

    /**
     * @description Creates the initial data object used by the add-row editor.
     */
    public readonly newRowFactory = input<() => Record<PropertyKey, unknown>>(() => ({}));

    /**
     * @description Emitted when a row remove command is triggered.
     */
    public readonly remove = output<GridRemoveEvent>();

    /**
     * @description Emitted when a row edit is committed (row mode only).
     */
    public readonly rowEdit = output<RowEditEvent>();

    /**
     * @description Emitted before an edited or new row is saved.
     */
    public readonly save = output<GridSaveEvent>();

    /**
     * @description The row data to be displayed in the grid.
     */
    public readonly data = input<Iterable<T>>([]);

    /**
     * @description The number of items to be displayed on a page.
     */
    public readonly pageSize = input<number>();

    /**
     * @description The page sizes that the user can select from.
     * These values will be displayed in the page size dropdown.
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
     */
    public readonly responsivePager = input(true);

    /**
     * @description The border radius of the grid.
     */
    public readonly rounded = input<GridVariantProps["rounded"]>("medium");

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });

    public constructor() {
        this.setPageSizeEffect();
        this.setGridDetailEffect();
        this.setDataEffect();
        this.setNewRowFactoryEffect();
        this.setFooterScrollElementEffect();
        this.setFitViewScrollbarSyncEffect();
        afterRenderEffect({
            read: () => this.syncToolbarFocusTargets()
        });
        afterNextRender({
            read: () => {
                this.gridService.gridHeaderElement.set(this.gridHeaderElement().nativeElement);
                this.gridService.headerTableElement.set(this.gridHeaderTableElement().nativeElement);
                this.setInitialCalculatedWidthOfColumns();
                this.#fitViewInitialScrollbarGutterWidth.set(this.gridService.scrollbarGutterWidth());
                this.gridWidthSet.set(true);
                this.setSubscriptions();
                this.setResizeObserver();
            }
        });
        this.#destroyRef.onDestroy(() => this.#resizeObserver?.disconnect());
    }

    protected isColumnDragDisabled(column: Column): boolean {
        return column.locked || (!this.gridService.reorderableOptions().enabled && !this.groupable());
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

    protected onColumnDragStart(event: CdkDragStart<Column>): void {
        if (this.resizing() || event.source.data.locked) {
            return;
        }
        this.columnDragging.set(true);
        this.dragColumn.set(event.source.data);
    }

    protected onColumnDrop(): void {
        const dragColumn = this.dragColumn();
        const dropColumn = this.dropColumn();
        if (
            !dropColumn ||
            !dragColumn ||
            !this.columnDragging() ||
            this.resizing() ||
            !this.gridService.reorderableOptions().enabled
        ) {
            this.clearDragState();
            return;
        }
        if (this.getColumnLockBucket(dropColumn) !== this.getColumnLockBucket(dragColumn)) {
            this.clearDragState();
            return;
        }
        const columnIds = this.gridService
            .columns()
            .select(column => column.id)
            .toArray();
        const dropColumnIndex = columnIds.indexOf(dropColumn.id);
        const dragColumnIndex = columnIds.indexOf(dragColumn.id);
        if (dropColumnIndex < 0 || dragColumnIndex < 0) {
            this.clearDragState();
            return;
        }
        if (dropColumnIndex === dragColumnIndex + 1) {
            this.clearDragState();
            return;
        }

        const event = new ColumnReorderEvent(dragColumn, dragColumnIndex, dropColumnIndex);
        this.gridService.columnReorder$.next(event);
        if (event.isDefaultPrevented()) {
            this.clearDragState();
            return;
        }

        const [dragColumnId] = columnIds.splice(dragColumnIndex, 1);
        const index = dropColumnIndex > dragColumnIndex ? dropColumnIndex - 1 : dropColumnIndex;
        columnIds.splice(index, 0, dragColumnId);
        this.gridService.setColumnOrder(columnIds);
        this.clearDragState();
    }

    protected onColumnDropForGrouping(event: CdkDragDrop<Column, void, Column>): void {
        if (!this.groupable()) {
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
        this.adjustPageAfterFilter();
        const allFilters = this.gridService
            .appliedFilters()
            .values()
            .select(p => p.filter)
            .where(f => f != null)
            .toArray();
        this.gridService.filterChange$.next(allFilters);
    }

    protected onColumnMouseEnter(column: Column): void {
        if (!this.columnDragging() || this.resizing()) {
            return;
        }
        this.dropColumn.set(column);
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
        if (column.kind === "command") {
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

    protected onGroupingColumnRemove(event: Event, column: Column): void {
        event.stopPropagation();
        this.gridService.clearColumnGrouping(column);
        this.groupPanelPlaceholderVisible.set(this.gridService.groupColumns().length === 0);
    }

    protected onGroupColumnReorder(column: Column, moveAs: "prev" | "next"): void {
        this.gridService.moveGroupColumn(column, moveAs);
    }

    protected onGroupingColumnSort(column: Column): void {
        let nextGroupSortDirection: SortDirection = "asc";
        if (column.groupSortDirection === "asc") {
            nextGroupSortDirection = "desc";
        } else if (column.groupSortDirection === "desc") {
            nextGroupSortDirection = "asc";
        }
        this.gridService.setColumnGroupSortDirection(column.id, nextGroupSortDirection);
        this.gridService.appliedGroupSorts.update(dict =>
            dict.remove(column.field).put(column.field, { sort: { field: column.field, dir: nextGroupSortDirection } })
        );
    }

    protected onPageChange(event: PageChangeEvent): void {
        this.gridService.setPageState({ page: event.page, skip: event.skip, take: event.take });

        if (isPlatformBrowser(this.#platformId)) {
            const scrollableElement = this.#hostElementRef.nativeElement.querySelector(
                "div.mona-grid-list"
            ) as HTMLElement;
            if (scrollableElement) {
                scrollableElement.scrollTop = 0;
            }
        }
    }

    protected onPageSizeChange(data: PageSizeChangeEvent): void {
        this.gridService.setPageState({ take: data.newPageSize });
    }

    protected onToolbarKeydown(event: KeyboardEvent): void {
        const targets = this.getToolbarFocusTargets();
        if (targets.length === 0 || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) {
            return;
        }

        event.preventDefault();
        const activeElement = event.target as HTMLElement;
        const currentIndex = targets.findIndex(target => target === activeElement || target.contains(activeElement));
        const direction = event.key === "ArrowLeft" ? -1 : 1;
        const nextIndex = (Math.max(currentIndex, 0) + direction + targets.length) % targets.length;
        this.#toolbarActiveIndex.set(nextIndex);
        targets[nextIndex].focus();
        this.syncToolbarFocusTargets();
    }

    private adjustPageAfterFilter(): void {
        const rowCount = this.gridService.viewRowCount();
        if (rowCount === 0) {
            return;
        }
        const { skip, take } = this.gridService.paginationState();
        if (skip >= rowCount) {
            const lastPage = Math.ceil(rowCount / take);
            this.gridService.setPageState({ skip: (lastPage - 1) * take, page: lastPage });
        }
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

    private clearDragState(): void {
        this.dragColumn.set(null);
        this.dropColumn.set(null);
        this.columnDragging.set(false);
        this.groupingInProgress.set(false);
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

    private getTableColumnHeaderCellList(): HTMLTableCellElement[] {
        const headerElement = this.gridHeaderElement();
        if (!headerElement) {
            return [];
        }
        const thList = headerElement.nativeElement.querySelectorAll("thead > tr:first-child > th");
        const headerCells = Array.from(thList) as HTMLTableCellElement[];
        if (this.gridService.masterDetailTemplate()) {
            headerCells.shift();
        }
        for (const _ of this.gridService.groupColumns()) {
            headerCells.shift();
        }
        return headerCells;
    }

    private getColumnLockBucket(column: Column): "left" | "right" | "unlocked" {
        return column.locked ? column.lockedPosition : "unlocked";
    }

    private getToolbarFocusTargets(): HTMLElement[] {
        const toolbarElement = this.toolbarElement()?.nativeElement;
        if (toolbarElement == null) {
            return [];
        }
        const targets = Array.from(toolbarElement.querySelectorAll<HTMLElement>(FOCUSABLE_TARGET_SELECTOR));
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

    private setDataEffect(): void {
        effect(() => {
            const data = this.data();
            const rowKey = this.gridService.editableRowKey();
            const shouldRestoreGridFocus = this.#hostElementRef.nativeElement.contains(
                this.#hostElementRef.nativeElement.ownerDocument.activeElement
            );
            untracked(() => this.gridService.setRows(data as Iterable<Record<PropertyKey, unknown>>, rowKey));
            if (shouldRestoreGridFocus) {
                afterNextRender(
                    {
                        read: () => this.#gridNavigationService.focusActiveCellOrFirstHeader()
                    },
                    { injector: this.#injector }
                );
            }
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
            const detailTemplate = this.gridDetailTemplate() ?? null;
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
            if (this.gridService.masterDetailTemplate()) {
                headerWidth -= this.gridService.detailColumnWidth;
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

    private setNewRowFactoryEffect(): void {
        effect(() => {
            const factory = this.newRowFactory();
            untracked(() => this.gridService.setNewRowFactory(factory));
        });
    }

    private setPageSizeEffect(): void {
        effect(() => {
            const pageSize = this.pageSize();
            if (pageSize != null) {
                untracked(() => this.gridService.setPageState({ take: pageSize }));
            }
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

    private setSubscriptions(): void {
        this.gridService.add$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => this.add.emit(event));
        this.gridService.cancel$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => this.cancel.emit(event));
        this.gridService.cellEdit$
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe((event: CellEditEvent) => this.cellEdit.emit(event));
        this.gridService.edit$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => this.edit.emit(event));
        this.gridService.remove$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => this.remove.emit(event));
        this.gridService.rowEdit$
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe((event: RowEditEvent) => this.rowEdit.emit(event));
        this.gridService.save$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => this.save.emit(event));
    }

    private syncToolbarFocusTargets(): void {
        const targets = this.getToolbarFocusTargets();
        if (targets.length === 0) {
            return;
        }
        const activeIndex = Math.min(this.#toolbarActiveIndex(), targets.length - 1);
        if (activeIndex !== this.#toolbarActiveIndex()) {
            this.#toolbarActiveIndex.set(activeIndex);
        }
        for (const [index, target] of targets.entries()) {
            target.setAttribute("tabindex", index === activeIndex ? "0" : "-1");
        }
    }
}
