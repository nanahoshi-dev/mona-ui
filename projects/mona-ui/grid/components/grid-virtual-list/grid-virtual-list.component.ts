import { GRID_DEFAULT_VIRTUAL_ROW_HEIGHT } from "../../constants/grid-virtual-scroll.constants";
import { CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport } from "@angular/cdk/scrolling";
import {
    afterNextRender,
    Component,
    computed,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    Injector,
    input,
    signal,
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

/**
 * Rows drawn past each edge of the viewport. When fewer than the first number are left on a side, the viewport draws
 * up to the second, so scrolling redraws a few rows at a time.
 */
const MIN_BUFFER_ROWS = 4;
const MAX_BUFFER_ROWS = 8;

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
    host: {
        "[class]": "baseClass()",
        "[style.--mona-grid-row-height]": "gridService.virtualScrollOptions().height + 'px'",
        "(click)": "onBodyClick($event)",
        "(contextmenu)": "onBodyClick($event)",
        "(mousedown)": "onBodyMouseDown($event)"
    }
})
export class GridVirtualListComponent {
    readonly #destroyRef = inject(DestroyRef);
    readonly #gridNavigationService = inject(GridNavigationService);
    readonly #groupColumns$ = toObservable(inject(GridService).groupColumns);
    readonly #hostElementRef = inject(ElementRef<HTMLDivElement>);
    readonly #injector = inject(Injector);
    readonly #viewportHeight = signal(0);
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
    protected readonly maxBufferPx = computed(() => this.rowHeight() * MAX_BUFFER_ROWS);
    protected readonly minBufferPx = computed(() => this.rowHeight() * MIN_BUFFER_ROWS);
    protected readonly rowHeight = computed(
        () => this.gridService.virtualScrollOptions().height ?? GRID_DEFAULT_VIRTUAL_ROW_HEIGHT
    );
    protected readonly tableClass = computed(() => {
        return gridListTableThemeVariants();
    });
    /**
     * How many row views the list keeps for reuse: every row it can draw at once. Scrolling a page then gives the
     * views other rows' data, rather than destroying them and building new ones.
     */
    protected readonly templateCacheSize = computed(
        () => Math.ceil(this.#viewportHeight() / this.rowHeight()) + 2 * MAX_BUFFER_ROWS + 2
    );
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
                this.setViewportResizeObserver(bodyScrollElement);
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

    /** A click or right-click on the body's empty space, below the rows, clears a selection made by clicking rows. */
    protected onBodyClick(event: MouseEvent): void {
        if (!(event.target instanceof Element) || event.target.closest("tr") == null) {
            this.gridService.handleBodyEmptyClick(event);
        }
    }

    /** A press on the body's empty space keeps the focus in the grid. */
    protected onBodyMouseDown(event: MouseEvent): void {
        this.#gridNavigationService.keepFocusOnPress(event);
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
            indexOfRow: rowUid => this.bodyRows().findIndex(row => row.type === "data" && row.row.uid === rowUid),
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
        viewport.scrolledIndexChange.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(index => {
            // From the first visible row rather than the scroll height: the rows have just changed, and reading
            // the scroll height would make the browser lay them out again.
            const itemHeight = this.rowHeight();
            const bottomOffset = (viewport.getDataLength() - index) * itemHeight - viewport.getViewportSize();
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

    /** The viewport measures its height once; a grid that's resized needs it measured again to draw enough rows. */
    private setViewportResizeObserver(viewportElement: HTMLElement | null): void {
        if (viewportElement == null) {
            return;
        }
        this.#viewportHeight.set(viewportElement.clientHeight);
        if (typeof ResizeObserver === "undefined") {
            return;
        }
        const observer = new ResizeObserver(entries => {
            this.#viewportHeight.set(entries[entries.length - 1]?.contentRect.height ?? 0);
            this.viewport().checkViewportSize();
        });
        observer.observe(viewportElement);
        this.#destroyRef.onDestroy(() => observer.disconnect());
    }
}
