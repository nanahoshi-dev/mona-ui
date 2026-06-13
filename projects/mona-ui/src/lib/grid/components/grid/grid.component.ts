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
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChild,
    contentChildren,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    input,
    model,
    output,
    PLATFORM_ID,
    signal,
    TemplateRef,
    untracked,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { swap } from "@mirei/ts-collections";
import { twMerge } from "tailwind-merge";
import { v4 } from "uuid";
import { ChipComponent } from "../../../buttons/chip/component/chip.component";
import { PopupMenuItemComponent } from "../../../common/popup-menu/components/popup-menu-item/popup-menu-item.component";
import { PopupMenuComponent } from "../../../common/popup-menu/components/popup-menu/popup-menu.component";
import { PopupMenuTextTemplateDirective } from "../../../common/popup-menu/directives/popup-menu-text-template.directive";
import { FilterService } from "../../../filter/services/filter.service";
import { PlaceholderComponent } from "../../../layout/placeholder/components/placeholder/placeholder.component";
import { PagerComponent } from "../../../pager/components/pager/pager.component";
import { PageChangeEvent } from "../../../pager/models/PageChangeEvent";
import { PageSizeChangeEvent } from "../../../pager/models/PageSizeChangeEvent";
import { SortDescriptor, SortDirection } from "../../../query/sort/SortDescriptor";
import { ThemeService } from "../../../theme/services/theme.service";
import { GridColumnResizeHandlerDirective } from "../../directives/grid-column-resize-handler.directive";
import { GridDetailTemplateDirective } from "../../directives/grid-detail-template.directive";
import { GridLogicalCellDirective } from "../../directives/grid-logical-cell.directive";
import { GridNoDataTemplateDirective } from "../../directives/grid-no-data-template.directive";
import { CellEditEvent } from "../../models/CellEditEvent";
import { RowEditEvent } from "../../models/RowEditEvent";
import { Column } from "../../models/Column";
import { ColumnFilterState } from "../../models/ColumnFilterState";
import { ResizeMethod } from "../../models/ResizeMethod";
import { SortableOptions } from "../../models/SortableOptions";
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
import { GridColumnComponent } from "../grid-column/grid-column.component";
import { GridFilterMenuComponent } from "../grid-filter-menu/grid-filter-menu.component";
import { GridFilterRowCellComponent } from "../grid-filter-row-cell/grid-filter-row-cell.component";
import { GridListComponent } from "../grid-list/grid-list.component";
import { GridVirtualListComponent } from "../grid-virtual-list/grid-virtual-list.component";

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
        GridLogicalCellDirective
    ],
    host: {
        "[class]": "baseClass()",
        "[attr.data-uid]": "uid",
        role: "grid"
    }
})
export class GridComponent<T> implements GridVariantInput {
    readonly #destroyRef = inject(DestroyRef);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    readonly #platformId = inject(PLATFORM_ID);
    readonly #themeService = inject(ThemeService);
    #resizeObserver: ResizeObserver | null = null;
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
    protected readonly columns = contentChildren(GridColumnComponent);
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
    protected readonly headerMargin = "0 15px 0 0";
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
    protected readonly uid = v4();

    /**
     * Emitted when a cell is edited.
     */
    public readonly cellEdit = output<CellEditEvent>();

    /**
     * Emitted when a row edit is committed (row mode only).
     */
    public readonly rowEdit = output<RowEditEvent>();

    /**
     * The row data to be displayed in the grid.
     */
    public readonly data = input<Iterable<T>>([]);

    /**
     * The number of items to be displayed on a page.
     */
    public readonly pageSize = input<number>();

    /**
     * The page sizes that the user can select from.
     * These values will be displayed in the page size dropdown.
     */
    public readonly pageSizeValues = input<number[]>([]);

    /**
     * Whether the columns of the grid can be reordered.
     */
    public readonly reorderable = input(false);

    /**
     * Whether the columns of the grid can be resized.
     */
    public readonly resizable = input(false);

    /**
     * The method to be used to set initial column widths.
     * It can be the following values:
     * - `fitView`: The columns will be resized to fit the available width.
     * - `auto`: The columns will be resized based on the content.
     * - A number representing the width of the columns. All columns except the columns with a specified width
     *   will have the same width.
     * @default "fitView"
     */
    public readonly resizeMethod = input<ResizeMethod>("fitView");

    /**
     * Whether the pager is responsive.
     * If set to `true`, the pager will be displayed as a dropdown when the grid width gets smaller.
     */
    public readonly responsivePager = input(true);

    public readonly rounded = input<GridVariantProps["rounded"]>("medium");

    /**
     * Initial sort configuration to be applied to the grid when it is loaded.
     */
    public readonly sort = model<SortDescriptor[]>([]);

    /**
     * Whether the grid is sortable.
     */
    public sortable = input<boolean | SortableOptions>(false);

    public readonly userClass = input<string>("", { alias: "class" });

    public constructor() {
        this.setSortableOptionsEffect();
        this.setSortEffect();
        this.setPageSizeEffect();
        this.setColumnEffect();
        this.setGridDetailEffect();
        this.setDataEffect();
        afterNextRender({
            read: () => {
                this.gridService.gridHeaderElement.set(this.gridHeaderElement().nativeElement);
                this.gridService.headerTableElement.set(this.gridHeaderTableElement().nativeElement);
                this.setInitialCalculatedWidthOfColumns();
                this.gridWidthSet.set(true);
                this.setSubscriptions();
                this.setResizeObserver();
            }
        });
        this.#destroyRef.onDestroy(() => this.#resizeObserver?.disconnect());
    }

    public onColumnDragEnter(event: CdkDragEnter<void, Column>): void {
        this.groupPanelPlaceholderVisible.set(event.container !== this.groupColumnList());
    }

    public onColumnDragEnterForGrouping(): void {
        this.groupingInProgress.set(true);
    }

    public onColumnDragExitForGrouping(): void {
        this.groupingInProgress.set(false);
    }

    public onColumnDragStart(event: CdkDragStart<Column>): void {
        if (this.resizing()) {
            return;
        }
        this.columnDragging.set(true);
        this.dragColumn.set(event.source.data);
    }

    public onColumnDrop(): void {
        const dragColumn = this.dragColumn();
        const dropColumn = this.dropColumn();
        if (!dropColumn || !dragColumn || !this.columnDragging() || this.resizing() || !this.reorderable()) {
            this.clearDragState();
            return;
        }
        const dropColumnIndex = this.gridService.columns().indexOf(dropColumn, c => c.field() === dropColumn?.field());
        const dragColumnIndex = this.gridService.columns().indexOf(dragColumn, c => c.field() === dragColumn?.field());
        if (dropColumnIndex === dragColumnIndex + 1) {
            this.clearDragState();
            return;
        }
        this.gridService.columns.update(columns => {
            const list = columns.toList();
            list.remove(dragColumn);
            const index = dropColumnIndex > dragColumnIndex ? dropColumnIndex - 1 : dropColumnIndex;
            list.addAt(dragColumn, index);
            list.forEach((c, i) => c.setIndex(i));
            return list.toImmutableList();
        });
        this.clearDragState();
    }

    public onColumnDropForGrouping(event: CdkDragDrop<Column, void, Column>): void {
        if (!this.groupable()) {
            this.clearDragState();
            return;
        }
        const column = event.item.data;
        if (this.gridService.groupColumns().contains(column)) {
            this.clearDragState();
            return;
        }

        column.setGroupSortDirection("asc");
        this.gridService.groupColumns.update(columns => columns.add(column));
        this.gridService.appliedGroupSorts.update(dict =>
            dict.put(column.field(), { sort: { field: column.field(), dir: "asc" } })
        );
        this.clearDragState();
    }

    public onColumnFilter(column: Column, state: ColumnFilterState): void {
        if (state.filter && state.filter.filters.length > 0) {
            this.gridService.appliedFilters.update(dict => dict.put(column.field(), state));
            column.setFiltered(true);
        } else {
            this.gridService.appliedFilters.update(dict => dict.remove(column.field()));
            column.setFiltered(false);
        }
        const allFilters = this.gridService
            .appliedFilters()
            .values()
            .select(p => p.filter)
            .where(f => f != null)
            .toArray();
        this.gridService.filterChange$.next(allFilters);
    }

    public onColumnMouseEnter(column: Column): void {
        if (!this.columnDragging() || this.resizing()) {
            return;
        }
        this.dropColumn.set(column);
    }

    public onColumnResizeStart(): void {
        this.resizing.set(true);
    }

    public onColumnSort(column: Column): void {
        if (!this.gridService.sortableOptions().enabled) {
            return;
        }
        if (!column.field()) {
            return;
        }
        if (column.columnSortDirection() == null) {
            column.setColumnSortDirection("asc");
        } else if (column.columnSortDirection() === "asc") {
            column.setColumnSortDirection("desc");
        } else if (this.gridService.sortableOptions().allowUnsort) {
            column.setColumnSortDirection(null);
            column.setSortIndex(null);
        } else {
            column.setColumnSortDirection("asc");
        }
        this.applyColumnSort(column, column.columnSortDirection());
        const sortDescriptors = this.gridService
            .appliedSorts()
            .values()
            .select(s => s.sort)
            .toArray();
        this.sort.set(sortDescriptors);
    }

    public onGroupingColumnRemove(event: Event, column: Column): void {
        event.stopPropagation();
        column.setGroupSortDirection(null);
        this.gridService.appliedGroupSorts.update(dict => dict.remove(column.field()));
        this.gridService.groupColumns.update(columns =>
            columns.where(c => c.field() !== column.field()).toImmutableSet()
        );
        this.gridService.clearCollapsedGroups(key => key.includes(column.field()));
        this.groupPanelPlaceholderVisible.set(this.gridService.groupColumns().length === 0);
    }

    public onGroupColumnReorder(column: Column, moveAs: "prev" | "next"): void {
        this.gridService.groupColumns.update(cols => {
            const colList = cols.toList();
            const index = colList.indexOf(column);
            const newIndex = moveAs === "prev" ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= colList.size()) {
                return colList.toImmutableSet();
            }
            swap(colList, index, newIndex);
            return colList.toImmutableSet();
        });
    }

    public onGroupingColumnSort(column: Column): void {
        if (column.groupSortDirection() == null) {
            column.setGroupSortDirection("asc");
        } else if (column.groupSortDirection() === "asc") {
            column.setGroupSortDirection("desc");
        } else if (column.groupSortDirection() === "desc") {
            column.setGroupSortDirection("asc");
        }
        this.gridService.appliedGroupSorts.update(dict =>
            dict
                .remove(column.field())
                .add(column.field(), { sort: { field: column.field(), dir: column.groupSortDirection() ?? "asc" } })
        );
    }

    public onPageChange(event: PageChangeEvent): void {
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

    public onPageSizeChange(data: PageSizeChangeEvent): void {
        this.gridService.setPageState({ take: data.newPageSize });
    }

    private applyColumnSort(column: Column, sortDirection: SortDirection | null): void {
        column.setColumnSortDirection(sortDirection);
        if (this.gridService.sortableOptions().mode === "single") {
            this.gridService
                .columns()
                .where(c => c.field() !== column.field())
                .forEach(c => {
                    c.setColumnSortDirection(null);
                    c.setSortIndex(null);
                    this.gridService.appliedSorts.update(dict => dict.remove(c.field()));
                });
        }
        if (column.columnSortDirection() != null) {
            const sortDescriptor: SortDescriptor = {
                field: column.field(),
                dir: column.columnSortDirection() as SortDirection
            };
            this.gridService.appliedSorts.update(dict => dict.put(column.field(), { sort: sortDescriptor }));
        } else {
            this.gridService.appliedSorts.update(dict => dict.remove(column.field()));
            column.setSortIndex(null);
        }
        this.gridService
            .appliedSorts()
            .keys()
            .forEach((field, fx) => {
                const col = this.gridService.columns().firstOrDefault(c => c.field() === field);
                if (col) {
                    col.setSortIndex(fx + 1);
                }
            });
    }

    private clearDragState(): void {
        this.dragColumn.set(null);
        this.dropColumn.set(null);
        this.columnDragging.set(false);
        this.groupingInProgress.set(false);
    }

    private getTableColumnHeaderCellList(): HTMLTableCellElement[] {
        const headerElement = this.gridHeaderElement();
        if (!headerElement) {
            return [];
        }
        const thList = headerElement.nativeElement.querySelectorAll("th");
        const headerCells = Array.from(thList) as HTMLTableCellElement[];
        if (this.gridService.masterDetailTemplate()) {
            headerCells.shift();
        }
        for (const _ of this.gridService.groupColumns()) {
            headerCells.shift();
        }
        return headerCells;
    }

    private setColumnEffect(): void {
        effect(() => {
            const columns = this.columns();
            untracked(() => {
                this.gridService.columns.update(list => list.clear().addAll(columns.map(c => c.column)));
                this.gridService.columns().forEach((c, i) => c.setIndex(i));
                if (this.sort().length !== 0) {
                    this.gridService.loadSorts(this.sort());
                }
            });
        });
    }

    private setDataEffect(): void {
        effect(() => {
            const data = this.data();
            untracked(() => this.gridService.setRows(data));
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
            const columnsWithWidth = this.gridService.columns().where(c => c.width() != null);
            const columnsWithoutWidthCount = this.gridService.columns().count() - columnsWithWidth.count();
            if (columnsWithWidth.any()) {
                headerWidth -= columnsWithWidth.sum(c => c.width() ?? 0);
            }
            if (this.gridService.masterDetailTemplate()) {
                headerWidth -= this.gridService.detailColumnWidth;
            }
            headerWidth -= this.gridService.groupColumnWidth * this.gridService.groupColumns().size();

            for (const [cx, columnTh] of headerCells.entries()) {
                const gridCol = this.gridService.columns().elementAt(cx);
                let calculatedWidth: number;
                if (typeof this.resizeMethod() === "number") {
                    calculatedWidth = this.resizeMethod() as number;
                } else if (this.resizeMethod() === "fitView") {
                    calculatedWidth = (headerWidth + 1) / Math.min(headerCells.length, columnsWithoutWidthCount);
                } else {
                    calculatedWidth = this.gridService.findTextWidthOfColumn(gridCol, columnTh);
                }
                if (gridCol.width() != null) {
                    gridCol.setCalculatedWidth(gridCol.width() ?? null);
                } else {
                    const minWidth = gridCol.minWidth();
                    const maxWidth = gridCol.maxWidth();
                    if (minWidth && calculatedWidth < minWidth) {
                        calculatedWidth = gridCol.minWidth();
                    } else if (maxWidth && calculatedWidth > maxWidth) {
                        calculatedWidth = maxWidth;
                    }
                    gridCol.setCalculatedWidth(calculatedWidth);
                }
            }
        }
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

    private setSortEffect(): void {
        effect(() => {
            const sort = this.sort();
            untracked(() => this.gridService.loadSorts(sort));
        });
    }

    private setSortableOptionsEffect(): void {
        effect(() => {
            const sortable = this.sortable();
            untracked(() => {
                if (typeof sortable === "boolean") {
                    this.gridService.setSortableOptions({ enabled: sortable });
                } else {
                    this.gridService.setSortableOptions(sortable);
                }
            });
        });
    }

    private setSubscriptions(): void {
        this.gridService.cellEdit$
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe((event: CellEditEvent) => this.cellEdit.emit(event));
        this.gridService.rowEdit$
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe((event: RowEditEvent) => this.rowEdit.emit(event));
    }
}
