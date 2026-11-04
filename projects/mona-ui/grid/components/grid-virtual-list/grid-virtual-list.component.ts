import { GRID_DEFAULT_VIRTUAL_ROW_HEIGHT } from "../../constants/grid-virtual-scroll.constants";
import { CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport } from "@angular/cdk/scrolling";
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
import { ImmutableList } from "@mirei/ts-collections";
import { rxTimeout } from "@nanahoshi/mona-ui/internal";
import type { GridViewRow } from "../../models/GridGroup";
import { Row } from "../../models/Row";
import { GridNavigationService } from "../../services/grid-navigation.service";
import { GridService } from "../../services/grid.service";
import {
    gridFooterTableThemeVariants,
    gridFooterThemeVariants,
    gridListBaseThemeVariants,
    gridListTableThemeVariants
} from "../../styles/grid.styles";
import { ContextMenuComponent } from "@nanahoshi/mona-ui/contextmenu";
import { GridAddRowComponent } from "../grid-add-row/grid-add-row.component";
import { GridColgroupComponent } from "../grid-colgroup/grid-colgroup.component";
import { GridFooterRowComponent } from "../grid-footer-row/grid-footer-row.component";
import { GridGroupRowComponent } from "../grid-group-row/grid-group-row.component";
import { GridRowComponent } from "../grid-row/grid-row.component";

@Component({
    selector: "mona-grid-virtual-list",
    imports: [
        ContextMenuComponent,
        CdkVirtualScrollViewport,
        CdkFixedSizeVirtualScroll,
        CdkVirtualForOf,
        GridAddRowComponent,
        GridColgroupComponent,
        GridFooterRowComponent,
        GridGroupRowComponent,
        GridRowComponent
    ],
    templateUrl: "./grid-virtual-list.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        "[class]": "baseClass()",
        "[style.--mona-grid-row-height]": "gridService.virtualScrollOptions().height + 'px'"
    }
})
export class GridVirtualListComponent {
    readonly #destroyRef = inject(DestroyRef);
    readonly #gridNavigationService = inject(GridNavigationService);
    readonly #groupColumns$ = toObservable(inject(GridService).groupColumns);
    readonly #hostElementRef = inject(ElementRef<HTMLDivElement>);
    readonly #injector = inject(Injector);
    private readonly addRowScrollElementRef = viewChild<ElementRef<HTMLDivElement>>("addRowScrollElement");
    private readonly bodyTableElementRef = viewChild.required<ElementRef<HTMLTableElement>>("bodyTable");
    private readonly footerScrollElementRef = viewChild<ElementRef<HTMLDivElement>>("footerScrollElement");
    protected readonly baseClass = computed(() => {
        return (
            gridListBaseThemeVariants({ virtual: true }) +
            " [&_mona-grid-toggle>span]:min-h-0 [&_mona-grid-toggle>span]:h-full" +
            " [&_mona-grid-command-cell]:min-h-0 [&_mona-grid-command-cell>div]:min-h-0"
        );
    });
    protected readonly bodyRows = computed(() => this.gridService.createBodyRows(this.data()));
    protected readonly footerClass = computed(() => {
        return gridFooterThemeVariants();
    });
    protected readonly footerTableClass = computed(() => {
        return gridFooterTableThemeVariants();
    });
    /** The grid footer is the last row of the grid: after the header rows, the add row and every body row. */
    protected readonly gridAriaRowCount = computed(
        () => this.gridService.bodyAriaRowStart() + this.bodyRows().length + 1
    );
    protected readonly gridService = inject(GridService);
    protected readonly tableClass = computed(() => {
        return gridListTableThemeVariants();
    });
    protected readonly viewport = viewChild.required(CdkVirtualScrollViewport);
    public readonly data = input<ImmutableList<Row>>(ImmutableList.create());

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
                this.setRowScroller();
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
        effect(() => {
            const count = this.bodyRows().length;
            untracked(() => this.gridService.renderedBodyRowCount.set(count));
        });
        this.setGroupSubscriptions();
        this.setSelectedKeysLoadSubscription();
    }

    protected trackBodyRow(_: number, bodyRow: GridViewRow): string {
        return bodyRow.key;
    }

    private setElementScrollLeft(element: HTMLElement | null, scrollLeft: number): void {
        if (element != null && element.scrollLeft !== scrollLeft) {
            element.scrollLeft = scrollLeft;
        }
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

    /**
     * Lets keyboard navigation reach rows that aren't drawn: PageDown, Ctrl+End and the arrows scroll to the
     * row, which takes focus once it is drawn. Scrolling the focused row out and back returns focus to it.
     */
    private setRowScroller(): void {
        const viewport = this.viewport();
        this.#gridNavigationService.setRowScroller({
            isNavigableRow: index => this.bodyRows()[index] != null,
            rowCount: () => this.bodyRows().length,
            scrollToRow: index => viewport.scrollToIndex(index)
        });
        viewport.renderedRangeStream
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(() =>
                afterNextRender(() => this.#gridNavigationService.restoreLostFocus(), { injector: this.#injector })
            );
        this.#destroyRef.onDestroy(() => this.#gridNavigationService.setRowScroller(null));
    }

    private setScrollEndSubscription(): void {
        const viewport = this.viewport();
        viewport.scrolledIndexChange.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            const bottomOffset = viewport.measureScrollOffset("bottom");
            const itemHeight = this.gridService.virtualScrollOptions().height ?? GRID_DEFAULT_VIRTUAL_ROW_HEIGHT;
            const threshold = this.gridService.scrollEndThreshold();
            if (bottomOffset <= threshold * itemHeight) {
                this.gridService.scrollEnd$.next();
            }
        });
    }

    private setSelectedKeysLoadSubscription(): void {
        this.gridService.selectedKeysLoad$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(selectedKeys => {
            const firstKey = selectedKeys.firstOrDefault();
            const selectBy = this.gridService.selectBy();
            if (firstKey == null || selectBy == null) {
                return;
            }
            const index = this.bodyRows().findIndex(bodyRow => {
                if (bodyRow.type !== "data") {
                    return false;
                }
                const key = typeof selectBy === "string" ? bodyRow.row.data[selectBy] : selectBy(bodyRow.row.data);
                return key === firstKey;
            });
            if (index !== -1) {
                rxTimeout(this.#destroyRef, () => {
                    this.viewport().scrollToIndex(index);
                });
            }
        });
    }
}
