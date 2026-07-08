import { CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport } from "@angular/cdk/scrolling";
import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    Injector,
    input,
    untracked,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { SlicePipe } from "@mirei/mona-ui/common";
import { ContextMenuComponent } from "@mirei/mona-ui/contextmenu";
import { ThemeService } from "@mirei/mona-ui/theme";
import { rxTimeout } from "@mirei/mona-ui/internal";
import { ImmutableList, ImmutableSet } from "@mirei/ts-collections";
import { fromEvent } from "rxjs";
import { GridCellDirective } from "../../directives/grid-cell.directive";
import { GridDetailContentCellDirective } from "../../directives/grid-detail-content-cell.directive";
import { GridDetailIndentCellDirective } from "../../directives/grid-detail-indent-cell.directive";
import { GridDetailRowDirective } from "../../directives/grid-detail-row.directive";
import { GridFooterTableCellDirective } from "../../directives/grid-footer-table-cell.directive";
import { GridLockedCellDirective } from "../../directives/grid-locked-cell.directive";
import { GridLogicalCellDirective } from "../../directives/grid-logical-cell.directive";
import { GridRowDirective } from "../../directives/grid-row.directive";
import { Column } from "../../models/Column";
import type { GridViewRow } from "../../models/GridGroup";
import { Row } from "../../models/Row";
import { GridNavigationService } from "../../services/grid-navigation.service";
import { GridRowFlattenerService } from "../../services/grid-row-flattener.service";
import { GridService } from "../../services/grid.service";
import {
    gridFooterTableRowThemeVariants,
    gridFooterTableThemeVariants,
    gridFooterThemeVariants,
    gridGroupRowThemeVariants,
    gridListBaseThemeVariants,
    gridListTableThemeVariants
} from "../../styles/grid.styles";
import { GridAddRowComponent } from "../grid-add-row/grid-add-row.component";
import { GridCellComponent } from "../grid-cell/grid-cell.component";
import { GridFooterCellComponent } from "../grid-footer-cell/grid-footer-cell.component";
import { GridToggleComponent } from "../grid-toggle/grid-toggle.component";

@Component({
    selector: "mona-grid-virtual-list",
    imports: [
        CdkVirtualScrollViewport,
        CdkFixedSizeVirtualScroll,
        CdkVirtualForOf,
        GridAddRowComponent,
        GridCellComponent,
        SlicePipe,
        NgTemplateOutlet,
        ContextMenuComponent,
        GridRowDirective,
        GridCellDirective,
        GridDetailRowDirective,
        GridDetailIndentCellDirective,
        GridDetailContentCellDirective,
        GridLogicalCellDirective,
        GridLockedCellDirective,
        GridFooterTableCellDirective,
        GridToggleComponent,
        GridFooterCellComponent
    ],
    templateUrl: "./grid-virtual-list.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        "[class]": "baseClass()"
    }
})
export class GridVirtualListComponent {
    readonly #destroyRef = inject(DestroyRef);
    readonly #gridNavigationService = inject(GridNavigationService);
    readonly #groupColumns$ = toObservable(inject(GridService).groupColumns);
    readonly #hostElementRef = inject(ElementRef<HTMLDivElement>);
    readonly #injector = inject(Injector);
    readonly #rowFlattener = inject(GridRowFlattenerService);
    readonly #themeService = inject(ThemeService);
    private readonly addRowScrollElementRef = viewChild<ElementRef<HTMLDivElement>>("addRowScrollElement");
    private readonly bodyTableElementRef = viewChild.required<ElementRef<HTMLTableElement>>("bodyTable");
    private readonly footerScrollElementRef = viewChild<ElementRef<HTMLDivElement>>("footerScrollElement");
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridListBaseThemeVariants(theme)({ virtual: true });
    });
    protected readonly flattenedGroupedRows = computed(() => {
        const groupColumns = this.gridService.groupColumns();
        if (groupColumns.length === 0) {
            return [] as GridViewRow[];
        }
        const collapsedKeys = new Set(this.gridService.collapsedGroupKeys());
        const groupAggregateDict = this.gridService.groupAggregateMap().toDictionary(
            e => e.key,
            e => e.value
        );
        const showFooter = this.gridService.groupableOptions().showFooter;
        return this.#rowFlattener.flatten(this.data(), groupColumns, collapsedKeys, showFooter, groupAggregateDict);
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
    protected readonly gridService = inject(GridService);
    protected readonly groupRowClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridGroupRowThemeVariants(theme)();
    });
    protected readonly tableClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridListTableThemeVariants(theme)();
    });
    protected readonly viewport = viewChild.required(CdkVirtualScrollViewport);
    public readonly columns = input<ImmutableList<Column>>(ImmutableList.create());
    public readonly data = input<ImmutableSet<Row>>(ImmutableSet.create());

    public constructor() {
        effect(() => {
            const footerScrollElement = this.footerScrollElementRef()?.nativeElement ?? null;
            untracked(() => this.gridService.footerScrollElement.set(footerScrollElement));
        });
        effect(() => {
            const addRowScrollElement = this.addRowScrollElementRef()?.nativeElement ?? null;
            const scrollLeft = this.gridService.horizontalScrollLeft();
            untracked(() => this.setElementScrollLeft(addRowScrollElement, scrollLeft));
        });
        afterNextRender({
            read: () => {
                const bodyTableElement = this.bodyTableElementRef().nativeElement;
                const bodyScrollElement = this.#hostElementRef.nativeElement.querySelector(
                    ".cdk-virtual-scroll-viewport"
                ) as HTMLElement | null;
                this.gridService.bodyTableElement.set(bodyTableElement);
                this.gridService.bodyScrollElement.set(bodyScrollElement);
                this.setFocusSubscription();
                this.setScrollEndSubscription();
                this.#destroyRef.onDestroy(() => {
                    if (this.gridService.bodyTableElement() === bodyTableElement) {
                        this.gridService.bodyTableElement.set(null);
                    }
                    if (bodyScrollElement != null && this.gridService.bodyScrollElement() === bodyScrollElement) {
                        this.gridService.bodyScrollElement.set(null);
                    }
                    if (this.gridService.footerScrollElement() === this.footerScrollElementRef()?.nativeElement) {
                        this.gridService.footerScrollElement.set(null);
                    }
                });
            }
        });
        this.setGroupSubscriptions();
        this.setSelectedKeysLoadSubscription();
    }

    public onGridRowClick(event: MouseEvent, row: Row): void {
        this.gridService.handleRowClick(event, row);
    }

    public onGroupExpandChange(groupKey: string): void {
        this.gridService.toggleGroupCollapse(groupKey);
    }

    public onToggleDetailClick(row: Row): void {
        this.gridService.setRowExpanded(row, !this.gridService.isRowExpanded(row));
    }

    private setElementScrollLeft(element: HTMLElement | null, scrollLeft: number): void {
        if (element != null && element.scrollLeft !== scrollLeft) {
            element.scrollLeft = scrollLeft;
        }
    }

    private setFocusSubscription(): void {
        fromEvent<FocusEvent>(this.#hostElementRef.nativeElement, "focus")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => {
                this.#gridNavigationService.focusActiveCellOrFirstHeader();
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

    private setScrollEndSubscription(): void {
        const viewport = this.viewport();
        viewport.scrolledIndexChange.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            const bottomOffset = viewport.measureScrollOffset("bottom");
            const itemHeight = this.gridService.virtualScrollOptions().height ?? 32;
            const threshold = this.gridService.scrollEndThreshold();
            if (bottomOffset <= threshold * itemHeight) {
                this.gridService.scrollEnd$.next();
            }
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
}
