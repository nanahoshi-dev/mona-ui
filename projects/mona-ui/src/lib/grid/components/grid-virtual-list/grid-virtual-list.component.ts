import { CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport } from "@angular/cdk/scrolling";
import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    DOCUMENT,
    ElementRef,
    inject,
    Injector,
    input,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { ImmutableList, ImmutableSet, max } from "@mirei/ts-collections";
import { LucideAngularModule } from "lucide-angular";
import { fromEvent } from "rxjs";
import { rxTimeout } from "../../../common/utils/rxTimeout";
import { ContextMenuComponent } from "../../../menus/contextmenu/components/contextmenu/context-menu.component";
import { SlicePipe } from "../../../pipes/slice.pipe";
import { ThemeService } from "../../../theme/services/theme.service";
import { GridCellDirective } from "../../directives/grid-cell.directive";
import { GridLogicalCellDirective } from "../../directives/grid-logical-cell.directive";
import { GridRowDirective } from "../../directives/grid-row.directive";
import { Column } from "../../models/Column";
import type { GridViewRow } from "../../models/GridGroup";
import { Row } from "../../models/Row";
import { GridNavigationService } from "../../services/grid-navigation.service";
import { GridRowFlattenerService } from "../../services/grid-row-flattener.service";
import { GridService } from "../../services/grid.service";
import {
    gridGroupRowThemeVariants,
    gridListBaseThemeVariants,
    gridListTableThemeVariants
} from "../../styles/grid.styles";
import { GridCellComponent } from "../grid-cell/grid-cell.component";
import { GridToggleComponent } from "../grid-toggle/grid-toggle.component";

@Component({
    selector: "mona-grid-virtual-list",
    imports: [
        CdkVirtualScrollViewport,
        CdkFixedSizeVirtualScroll,
        CdkVirtualForOf,
        GridCellComponent,
        SlicePipe,
        NgTemplateOutlet,
        ContextMenuComponent,
        GridRowDirective,
        GridCellDirective,
        GridLogicalCellDirective,
        LucideAngularModule,
        GridToggleComponent
    ],
    templateUrl: "./grid-virtual-list.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        "[class]": "baseClass()"
    }
})
export class GridVirtualListComponent {
    readonly #destroyRef = inject(DestroyRef);
    readonly #document = inject(DOCUMENT);
    readonly #gridNavigationService = inject(GridNavigationService);
    readonly #groupColumns$ = toObservable(inject(GridService).groupColumns);
    readonly #hostElementRef = inject(ElementRef<HTMLDivElement>);
    readonly #injector = inject(Injector);
    readonly #rowFlattener = inject(GridRowFlattenerService);
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridListBaseThemeVariants(theme)({ virtual: true });
    });
    protected readonly gridService = inject(GridService);
    protected readonly groupRowClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridGroupRowThemeVariants(theme)();
    });
    protected readonly flattenedGroupedRows = computed(() => {
        const groupColumns = this.gridService.groupColumns();
        if (groupColumns.length === 0) {
            return [] as GridViewRow[];
        }
        const collapsedKeys = new Set(this.gridService.collapsedGroupKeys());
        const rows = this.#rowFlattener.flatten(this.data(), groupColumns, collapsedKeys);
        return rows;
    });
    protected readonly maxDepth = computed(() => {
        return max(this.flattenedGroupedRows(), r => r.depth);
    });
    protected readonly tableClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridListTableThemeVariants(theme)();
    });
    protected readonly viewport = viewChild.required(CdkVirtualScrollViewport);
    public columns = input<ImmutableList<Column>>(ImmutableList.create());
    public data = input<ImmutableSet<Row>>(ImmutableSet.create());

    public constructor() {
        afterNextRender({
            read: () => {
                this.synchronizeHorizontalScroll();
                this.setEditModeSubscription();
                this.setFocusSubscription();
            }
        });
        this.setGroupSubscriptions();
        this.setSelectedKeysLoadSubscription();
    }

    public onGroupExpandChange(groupKey: string): void {
        this.gridService.toggleGroupCollapse(groupKey);
    }

    public onGridRowClick(event: MouseEvent, row: Row): void {
        this.gridService.handleRowClick(event, row);
    }

    public onToggleDetailClick(row: Row): void {
        this.gridService.setRowExpanded(row, !this.gridService.isRowExpanded(row));
    }

    private setEditModeSubscription(): void {
        // fromEvent<MouseEvent>(this.#document, "click")
        //     .pipe(mergeWith(fromEvent<KeyboardEvent>(this.#document, "keyup")), takeUntilDestroyed(this.#destroyRef))
        //     .subscribe(e => {
        //         if (e.type === "click") {
        //             const event = e as MouseEvent;
        //             const target = event.target as HTMLElement;
        //             if (target.closest("mona-grid-cell") == null) {
        //                 this.gridService.isInEditMode.set(false);
        //             }
        //         }
        //         if (e.type === "keyup") {
        //             const event = e as KeyboardEvent;
        //             if (event.key === "Escape") {
        //                 this.gridService.isInEditMode.set(false);
        //             }
        //         }
        //     });
    }

    private setFocusSubscription(): void {
        fromEvent<FocusEvent>(this.#hostElementRef.nativeElement, "focus")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => {
                this.#gridNavigationService.focusFirstCell();
            });
    }

    private setSelectedKeysLoadSubscription(): void {
        this.gridService.selectedKeysLoad$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(selectedKeys => {
            const firstKey = selectedKeys.firstOrDefault();
            if (firstKey == null) {
                return;
            }
            const selectBy = this.gridService.selectBy();
            if (this.gridService.groupColumns().any()) {
                const viewData = this.flattenedGroupedRows();
                const selectedRow = viewData.find(r => {
                    if (r.type !== "data" || selectBy == null) {
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

    private setGroupSubscriptions(): void {
        // Workaround for @angular/components issue #21793 — virtual scroll does not update
        // the rendered range when data changes until the user scrolls.
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
