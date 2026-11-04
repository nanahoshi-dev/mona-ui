import { CdkDrag, CdkDragDrop, CdkDragEnd, CdkDragPreview, CdkDragStart, CdkDropList } from "@angular/cdk/drag-drop";
import { LucideGripVertical } from "@lucide/angular";
import {
    afterNextRender,
    afterRenderEffect,
    Component,
    computed,
    DestroyRef,
    ElementRef,
    inject,
    input,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ImmutableList } from "@mirei/ts-collections";
import { fromEvent } from "rxjs";
import { Row } from "../../models/Row";
import { GridNavigationService } from "../../services/grid-navigation.service";
import { GridService } from "../../services/grid.service";
import {
    gridListBaseThemeVariants,
    gridListTableThemeVariants,
    gridRowDragPreviewThemeVariants,
    GridListVariantInput
} from "../../styles/grid.styles";
import { ContextMenuComponent } from "@nanahoshi/mona-ui/contextmenu";
import { GridAddRowComponent } from "../grid-add-row/grid-add-row.component";
import { GridColgroupComponent } from "../grid-colgroup/grid-colgroup.component";
import { GridDetailRowComponent } from "../grid-detail-row/grid-detail-row.component";
import { GridFooterRowComponent } from "../grid-footer-row/grid-footer-row.component";
import { GridGroupRowComponent } from "../grid-group-row/grid-group-row.component";
import { GridRowComponent } from "../grid-row/grid-row.component";

interface RowMove {
    readonly element: HTMLTableRowElement;
    /** How far the row has to travel back up to where it was drawn before the move, in pixels. */
    readonly offset: number;
}

interface RowPosition {
    readonly element: HTMLTableRowElement;
    readonly top: number;
}

const ROW_MOVE_DURATION = 200;
const ROW_MOVE_EASING = "cubic-bezier(0.2, 0, 0, 1)";
/** Data that arrives later than this after a move request is not animated, since rows may have moved for other reasons. */
const ROW_MOVE_SNAPSHOT_LIFETIME = 1000;

@Component({
    selector: "mona-grid-list",
    templateUrl: "./grid-list.component.html",
    imports: [
        ContextMenuComponent,
        LucideGripVertical,
        GridAddRowComponent,
        GridColgroupComponent,
        GridDetailRowComponent,
        GridFooterRowComponent,
        GridGroupRowComponent,
        GridRowComponent,
        CdkDropList,
        CdkDrag,
        CdkDragPreview
    ],
    host: {
        "[class]": "baseClass"
    }
})
export class GridListComponent implements GridListVariantInput {
    readonly #destroyRef = inject(DestroyRef);
    readonly #gridNavigationService = inject(GridNavigationService);
    readonly #hostElementRef = inject(ElementRef<HTMLDivElement>);
    readonly #rowMoveAnimations = new Map<HTMLTableRowElement, Animation>();
    #dropping = false;
    #rowPositionsBeforeMove: { readonly positions: ReadonlyMap<string, number>; readonly time: number } | null = null;
    private readonly bodyTableElementRef = viewChild.required<ElementRef<HTMLTableElement>>("bodyTable");
    protected readonly baseClass = gridListBaseThemeVariants({ virtual: false });
    protected readonly bodyRows = computed(() => this.gridService.createBodyRows(this.data()));
    protected readonly dropListData = computed(() => this.data().toArray());
    protected readonly gridService = inject(GridService);
    protected readonly rowDragPreviewClass = gridRowDragPreviewThemeVariants();
    protected readonly tableClass = gridListTableThemeVariants();

    public readonly data = input<ImmutableList<Row>>(ImmutableList.create());

    public constructor() {
        afterNextRender({
            read: () => {
                const bodyTableElement = this.bodyTableElementRef().nativeElement;
                const bodyScrollElement = this.#hostElementRef.nativeElement;
                this.gridService.bodyTableElement.set(bodyTableElement);
                this.gridService.bodyScrollElement.set(bodyScrollElement);
                this.setSubscriptions();
                this.#destroyRef.onDestroy(() => {
                    if (this.gridService.bodyTableElement() === bodyTableElement) {
                        this.gridService.bodyTableElement.set(null);
                    }
                    if (this.gridService.bodyScrollElement() === bodyScrollElement) {
                        this.gridService.bodyScrollElement.set(null);
                    }
                });
            }
        });
        // Rows moved from the keyboard slide from where they were drawn to their new place.
        afterRenderEffect({
            earlyRead: () => {
                this.bodyRows();
                return this.#measureRowMoves();
            },
            write: moves => this.#playRowMoves(moves())
        });
    }

    public onRowDragEnded(_event: CdkDragEnd<Row>): void {
        this.gridService.draggingRowUid.set(null);
    }

    public onRowDragStarted(event: CdkDragStart<Row>): void {
        this.gridService.draggingRowUid.set(event.source.data.uid);
    }

    public onRowDrop(event: CdkDragDrop<Row[]>): void {
        this.gridService.draggingRowUid.set(null);
        // The drag already showed the rows in their new order, so the move must not be animated again.
        this.#dropping = true;
        try {
            this.gridService.requestRowReorder(event.item.data, event.previousIndex, event.currentIndex);
        } finally {
            this.#dropping = false;
        }
    }

    protected onBodyFocus(): void {
        this.#gridNavigationService.focusActiveCellOrFirstHeader();
    }

    #canAnimateRowMoves(): boolean {
        const view = this.#hostElementRef.nativeElement.ownerDocument.defaultView;
        if (view == null || typeof this.#hostElementRef.nativeElement.animate !== "function") {
            return false;
        }
        return !view.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    #measureRowMoves(): readonly RowMove[] {
        const snapshot = this.#rowPositionsBeforeMove;
        this.#rowPositionsBeforeMove = null;
        if (snapshot == null || performance.now() - snapshot.time > ROW_MOVE_SNAPSHOT_LIFETIME) {
            return [];
        }
        // Rows still sliding from an earlier move are measured where they finally belong.
        for (const animation of this.#rowMoveAnimations.values()) {
            animation.cancel();
        }
        this.#rowMoveAnimations.clear();
        const moves: RowMove[] = [];
        for (const [uid, position] of this.#readRowPositions()) {
            const previousTop = snapshot.positions.get(uid);
            if (previousTop != null && Math.abs(previousTop - position.top) >= 0.5) {
                moves.push({ element: position.element, offset: previousTop - position.top });
            }
        }
        return moves;
    }

    #playRowMoves(moves: readonly RowMove[]): void {
        for (const { element, offset } of moves) {
            const animation = element.animate(
                [{ transform: `translateY(${offset}px)` }, { transform: "translateY(0)" }],
                { duration: ROW_MOVE_DURATION, easing: ROW_MOVE_EASING }
            );
            this.#rowMoveAnimations.set(element, animation);
            animation.addEventListener("finish", () => {
                if (this.#rowMoveAnimations.get(element) === animation) {
                    this.#rowMoveAnimations.delete(element);
                }
            });
        }
    }

    /** Reads where each data row is drawn, relative to the top of the body table. */
    #readRowPositions(): Map<string, RowPosition> {
        const table = this.bodyTableElementRef().nativeElement;
        const tableTop = table.getBoundingClientRect().top;
        const positions = new Map<string, RowPosition>();
        for (const element of table.querySelectorAll<HTMLTableRowElement>(":scope > tbody > tr[data-ruid]")) {
            const uid = element.dataset["ruid"];
            if (uid != null) {
                positions.set(uid, { element, top: element.getBoundingClientRect().top - tableTop });
            }
        }
        return positions;
    }

    private setSubscriptions(): void {
        fromEvent<FocusEvent>(this.#hostElementRef.nativeElement, "focus")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => {
                this.#gridNavigationService.focusActiveCellOrFirstHeader();
            });
        this.gridService.rowReorder$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            if (this.#dropping || !this.#canAnimateRowMoves()) {
                return;
            }
            const positions = new Map<string, number>();
            for (const [uid, position] of this.#readRowPositions()) {
                positions.set(uid, position.top);
            }
            this.#rowPositionsBeforeMove = { positions, time: performance.now() };
        });
    }
}
