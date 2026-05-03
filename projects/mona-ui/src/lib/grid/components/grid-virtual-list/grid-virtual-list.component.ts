import { CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport } from "@angular/cdk/scrolling";
import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    ElementRef,
    inject,
    Injector,
    input,
    OnInit,
    signal,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { faChevronDown, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { ImmutableList, ImmutableSet } from "@mirei/ts-collections";
import { LucideAngularModule, MinusIcon, PlusIcon } from "lucide-angular";
import { DateTime } from "luxon";
import { fromEvent, pairwise, startWith } from "rxjs";
import { ButtonDirective } from "../../../buttons/button/directives/button.directive";
import { rxTimeout } from "../../../common/utils/rxTimeout";
import { ContextMenuComponent } from "../../../menus/contextmenu/components/contextmenu/context-menu.component";
import { ContainsPipe } from "../../../pipes/contains.pipe";
import { SlicePipe } from "../../../pipes/slice.pipe";
import { ThemeService } from "../../../theme/services/theme.service";
import { GridCellDirective } from "../../directives/grid-cell.directive";
import { GridRowDirective } from "../../directives/grid-row.directive";
import { Column } from "../../models/Column";
import { VirtualGridGroup, VirtualGridRow } from "../../models/GridGroup";
import { Row } from "../../models/Row";
import { GridService } from "../../services/grid.service";
import {
    gridGroupRowThemeVariants,
    gridListBaseThemeVariants,
    gridListTableThemeVariants
} from "../../styles/grid.styles";
import { GridCellComponent } from "../grid-cell/grid-cell.component";

@Component({
    selector: "mona-grid-virtual-list",
    imports: [
        CdkVirtualScrollViewport,
        CdkFixedSizeVirtualScroll,
        CdkVirtualForOf,
        GridCellComponent,
        ButtonDirective,
        FaIconComponent,
        SlicePipe,
        ContainsPipe,
        NgTemplateOutlet,
        ContextMenuComponent,
        GridRowDirective,
        GridCellDirective,
        LucideAngularModule
    ],
    templateUrl: "./grid-virtual-list.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        "[class]": "baseClass()"
    }
})
export class GridVirtualListComponent implements OnInit, AfterViewInit {
    readonly #destroyRef = inject(DestroyRef);
    readonly #hostElementRef = inject(ElementRef<HTMLDivElement>);
    readonly #groupColumns$ = toObservable(inject(GridService).groupColumns);
    readonly #injector = inject(Injector);
    readonly #themeService = inject(ThemeService);
    readonly #virtualGridRows = computed(() => {
        const data = this.data();
        const columns = this.gridService.groupColumns();
        const rows = this.flattenGroups(this.createGridGroup(data, columns), 0, null);
        return ImmutableList.create(rows);
    });
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridListBaseThemeVariants(theme)({ virtual: true });
    });
    protected readonly collapseIcon = faChevronDown;
    protected readonly collapsedGroups = signal<ImmutableSet<string>>(ImmutableSet.create());
    protected readonly detailCollapseIcon = MinusIcon;
    protected readonly detailExpandIcon = PlusIcon;
    protected readonly expandIcon = faChevronRight;
    protected readonly gridService = inject(GridService);
    protected readonly groupRowClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridGroupRowThemeVariants(theme)();
    });
    protected readonly tableClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridListTableThemeVariants(theme)();
    });
    protected readonly groupedGridRows = computed(() => {
        const collapsedGroups = this.collapsedGroups();
        const rows = this.#virtualGridRows();
        return rows
            .where(row => {
                const parents = row.parentList;
                return parents.every(p => p.type === "group" && !collapsedGroups.contains(p.groupId));
            })
            .toImmutableList();
    });
    protected readonly viewport = viewChild.required(CdkVirtualScrollViewport);
    public columns = input<ImmutableList<Column>>(ImmutableList.create());
    public data = input<ImmutableSet<Row>>(ImmutableSet.create());

    public ngAfterViewInit(): void {
        rxTimeout(
            this.#destroyRef,
            () => {
                this.synchronizeHorizontalScroll();
            },
            0
        );
    }

    public ngOnInit(): void {
        this.setSubscriptions();
    }

    public onGroupExpandChange(rowItem: VirtualGridRow): void {
        if (rowItem.type === "group") {
            const groupId = rowItem.groupId;
            this.collapsedGroups.update(groups => {
                if (groups.contains(groupId)) {
                    return groups.remove(groupId);
                }
                return groups.add(groupId);
            });
        }
    }

    public onGridRowClick(event: MouseEvent, row: Row): void {
        this.gridService.handleRowClick(event, row);
    }

    public onToggleDetailClick(event: MouseEvent, row: VirtualGridRow | Row): void {
        event.stopPropagation();
        if (row instanceof Row) {
            this.gridService.setRowExpanded(row, !this.gridService.isRowExpanded(row));
        } else if (row.type === "row") {
            this.gridService.setRowExpanded(row.row, !this.gridService.isRowExpanded(row.row));
        }
    }

    private createGridGroup(rows: Iterable<Row>, columns: Iterable<Column>): VirtualGridGroup[] {
        const columnArray = [...columns];
        if (columnArray.length === 0) {
            return [];
        }

        const column = columnArray[0];
        const field = column.field();
        const isDate = column.dataType() === "date";
        const groupMap = new Map<unknown, Row[]>();
        const keyOrder: unknown[] = [];

        for (const row of rows) {
            const rawValue = row.data[field] as unknown;
            const mapKey =
                isDate && rawValue instanceof Date
                    ? DateTime.fromJSDate(rawValue).toFormat("yyyy-M-d-H-m-s")
                    : rawValue;
            if (!groupMap.has(mapKey)) {
                groupMap.set(mapKey, []);
                keyOrder.push(mapKey);
            }
            groupMap.get(mapKey)!.push(row);
        }

        const remainingColumns = columnArray.slice(1);
        return keyOrder.map(mapKey => {
            const groupRows = groupMap.get(mapKey)!;
            return {
                column,
                key: this.getGroupKey(field, groupRows),
                rows: remainingColumns.length > 0 ? this.createGridGroup(groupRows, remainingColumns) : groupRows,
                title: groupRows[0].data[field]
            } as VirtualGridGroup;
        });
    }

    private flattenGroups(
        groups: VirtualGridGroup[],
        level: number,
        parentHeader: VirtualGridRow | null
    ): VirtualGridRow[] {
        const result: VirtualGridRow[] = [];
        for (const group of groups) {
            if (group.rows.length === 0) {
                continue;
            }
            const parentList = [...(parentHeader?.parentList ?? []), parentHeader].filter(
                p => p != null
            ) as VirtualGridRow[];
            const groupId = this.getNestedGroupKey(parentList, group.key);
            const headerRow: VirtualGridRow = {
                type: "group",
                column: group.column,
                level,
                groupTitle: group.title,
                groupId,
                parentList
            };
            result.push(headerRow);
            if (group.rows[0] instanceof Row) {
                const parentList = [...headerRow.parentList, headerRow].filter(p => p != null) as VirtualGridRow[];
                const groupId = this.getNestedGroupKey(parentList, group.key);
                for (const row of group.rows) {
                    result.push({
                        type: "row",
                        row: row as Row,
                        column: group.column,
                        level,
                        groupId,
                        parentList
                    });
                }
            } else {
                const nested = this.flattenGroups(group.rows as VirtualGridGroup[], level + 1, headerRow);
                for (const row of nested) {
                    result.push(row);
                }
            }
        }
        return result;
    }

    private getGroupKey(field: string, rows: Row[]): string {
        return `${field}-${rows[0].data[field]}`;
    }

    private getNestedGroupKey(parentList: VirtualGridRow[], key: string): string {
        return `${parentList.map(p => p.groupId).join("-")}-${key}`.replaceAll(" ", "_");
    }

    private setSelectedKeysLoadSubscription(): void {
        this.gridService.selectedKeysLoad$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(selectedKeys => {
            const firstKey = selectedKeys.firstOrDefault();
            if (firstKey == null) {
                return;
            }
            const selectBy = this.gridService.selectBy();
            if (this.gridService.groupColumns().any()) {
                const viewData = this.groupedGridRows();
                const selectedRow = viewData.firstOrDefault(r => {
                    if (r.type !== "row" || selectBy == null) {
                        return false;
                    }
                    if (typeof selectBy === "string") {
                        return r.row.data[selectBy] === firstKey;
                    }
                    return selectBy(r.row.data) === firstKey;
                });
                if (selectedRow != null) {
                    const index = viewData.indexOf(selectedRow);
                    rxTimeout(this.#destroyRef, () => {
                        this.viewport().scrollToIndex(index);
                    });
                }
            } else {
                const viewData = this.data().toImmutableList();
                const selectedRow = viewData.firstOrDefault(r => {
                    if (selectBy == null) {
                        return false;
                    }
                    if (typeof selectBy === "string") {
                        return r.data[selectBy] === firstKey;
                    }
                    return selectBy(r.data) === firstKey;
                });
                if (selectedRow != null) {
                    const index = viewData.indexOf(selectedRow);
                    rxTimeout(this.#destroyRef, () => {
                        this.viewport().scrollToIndex(index);
                    });
                }
            }
        });
    }

    private setSubscriptions(): void {
        this.#groupColumns$
            .pipe(startWith(this.gridService.groupColumns()), pairwise(), takeUntilDestroyed(this.#destroyRef))
            .subscribe(([prev, current]) => {
                const removedColumns = prev.where(c => !current.contains(c));
                removedColumns.forEach(c => {
                    this.collapsedGroups.update(groups => {
                        return groups.where(g => !g.includes(c.field())).toImmutableSet();
                    });
                });
            });

        /**
         * This is a workaround to force the virtual scroll to update the rendered range
         * When the data changes, the view is not rendered correctly. It is empty until the user scrolls,
         * which triggers the update of the rendered range.
         * We manually trigger the update so that the grid is rendered when the grouping changes.
         * @see @angular/components issue #21793 on GitHub
         */
        this.#groupColumns$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            afterNextRender(
                () => {
                    const renderedRange = this.viewport().getRenderedRange();
                    this.viewport().setRenderedRange({
                        start: renderedRange.start,
                        end: renderedRange.end + 1
                    });
                },
                { injector: this.#injector }
            );
        });
        this.setSelectedKeysLoadSubscription();
    }

    private synchronizeHorizontalScroll(): void {
        const headerElement = this.gridService.gridHeaderElement();
        const gridElement = this.#hostElementRef.nativeElement as HTMLElement;
        if (headerElement == null || gridElement == null) {
            return;
        }
        const scrollableElement = gridElement.querySelector(".cdk-virtual-scroll-viewport") as HTMLElement;
        fromEvent(scrollableElement, "scroll")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => (headerElement.scrollLeft = scrollableElement.scrollLeft));
    }
}
