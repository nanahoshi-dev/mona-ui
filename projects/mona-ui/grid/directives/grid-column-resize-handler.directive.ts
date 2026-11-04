import {
    afterNextRender,
    computed,
    DestroyRef,
    Directive,
    DOCUMENT,
    ElementRef,
    inject,
    input,
    output
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { injectComponentDirection } from "@nanahoshi/mona-ui/i18n";
import { fromEvent } from "rxjs";
import type { Column } from "../models/Column";
import type { ColumnResizeEvent } from "../models/ColumnResizeEvent";
import { GridService } from "../services/grid.service";

/** How far ArrowLeft and ArrowRight resize a column. */
const KEYBOARD_RESIZE_STEP = 10;

/**
 * The column edge that resizes a column: drag it, or focus it (F2 on the header) and use ArrowLeft/Right,
 * Home and End for the narrowest and widest width, and Enter to fit the content. Escape cancels a drag.
 */
@Directive({
    selector: "[monaGridColumnResizeHandler]",
    host: {
        role: "separator",
        tabindex: "-1",
        "aria-orientation": "vertical",
        "[attr.aria-label]": "messages().resizeColumn(column().title)",
        "[attr.aria-valuemax]": "maxWidth()",
        "[attr.aria-valuemin]": "minWidth()",
        "[attr.aria-valuenow]": "width()",
        "(keydown)": "onKeydown($event)"
    }
})
export class GridColumnResizeHandlerDirective {
    readonly #destroyRef: DestroyRef = inject(DestroyRef);
    readonly #direction = injectComponentDirection();
    readonly #document = inject(DOCUMENT);
    readonly #gridService = inject(GridService);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    /** Ends a drag in progress without reporting it; the directive may be destroyed mid-drag. */
    #releaseDrag: (() => void) | null = null;
    protected readonly maxWidth = computed(() =>
        Math.round(this.column().maxWidth ?? this.#document.defaultView?.innerWidth ?? Number.MAX_SAFE_INTEGER)
    );
    protected readonly messages = this.#gridService.messages;
    protected readonly minWidth = computed(() => Math.round(this.column().minWidth ?? 0));
    protected readonly width = computed(() => Math.round(this.#gridService.getColumnWidth(this.#currentColumn())));

    public readonly column = input.required<Column>();
    public readonly resizeEnd = output<ColumnResizeEvent>();
    public readonly resizeStart = output();

    public constructor() {
        afterNextRender({
            write: () => this.#setEvents()
        });
        this.#destroyRef.onDestroy(() => this.#releaseDrag?.());
    }

    protected onKeydown(event: KeyboardEvent): void {
        if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
            return;
        }
        const width = this.#gridService.getColumnWidth(this.#currentColumn());
        let target: number;
        switch (event.key) {
            case "ArrowLeft":
            case "ArrowRight": {
                // ArrowRight widens in LTR; in RTL the column grows to the left.
                const widens = (event.key === "ArrowRight") !== (this.#direction() === "rtl");
                target = width + (widens ? KEYBOARD_RESIZE_STEP : -KEYBOARD_RESIZE_STEP);
                break;
            }
            case "Home":
                target = this.minWidth();
                break;
            case "End":
                target = this.maxWidth();
                break;
            case "Enter": {
                const headerCell = this.#hostElementRef.nativeElement.closest("th") as HTMLTableCellElement | null;
                if (headerCell == null) {
                    return;
                }
                target = this.#gridService.findTextWidthOfColumn(this.column(), headerCell);
                break;
            }
            default:
                return;
        }
        event.preventDefault();
        const newWidth = this.#clamp(target);
        if (newWidth === width) {
            return;
        }
        this.resizeStart.emit();
        this.#gridService.setCalculatedWidth(this.column().id, newWidth);
        this.resizeEnd.emit({ column: this.column(), oldWidth: width, newWidth });
    }

    /** A width within the column's limits; a drag past a limit stops at it. */
    #clamp(width: number): number {
        const column = this.column();
        const minWidth = column.minWidth ?? 0;
        const maxWidth = column.maxWidth ?? this.#document.defaultView?.innerWidth ?? Infinity;
        return this.#gridService.normalizeRenderedWidth(Math.min(Math.max(width, minWidth), maxWidth));
    }

    /** The column as the grid has it now; the input can lag a width set a moment ago. */
    #currentColumn(): Column {
        const column = this.column();
        return this.#gridService.columns().firstOrDefault(candidate => candidate.id === column.id) ?? column;
    }

    #onPointerDown(event: PointerEvent): void {
        const element: HTMLElement = this.#hostElementRef.nativeElement;
        const initialWidth = this.#gridService.getColumnWidth(this.#currentColumn());
        const initialX = event.clientX;
        // No text selection while dragging, without touching the page's own handlers.
        const gridElement = element.closest("mona-grid") as HTMLElement | null;
        const previousUserSelect = gridElement?.style.userSelect ?? "";
        if (gridElement != null) {
            gridElement.style.userSelect = "none";
        }

        element.setPointerCapture(event.pointerId);
        this.resizeStart.emit();

        let newWidth: number = -1;
        let pendingWidth: number | null = null;
        let frame: number | null = null;
        const view = this.#document.defaultView;
        const columnId = this.column().id;
        // At most one width update per frame: pointermove can fire several times between paints.
        const commit = (): void => {
            frame = null;
            if (pendingWidth != null) {
                this.#gridService.setCalculatedWidth(columnId, pendingWidth);
                pendingWidth = null;
            }
        };
        this.#gridService.columnResizeActive.set(true);

        const onPointerMove = (moveEvent: PointerEvent): void => {
            const physicalDelta = moveEvent.clientX - initialX;
            const logicalDelta = this.#direction() === "rtl" ? -physicalDelta : physicalDelta;
            newWidth = this.#clamp(initialWidth + logicalDelta);
            pendingWidth = newWidth;
            if (frame == null) {
                if (view?.requestAnimationFrame) {
                    frame = view.requestAnimationFrame(commit);
                } else {
                    commit();
                }
            }
        };

        const release = (): void => {
            if (frame != null) {
                view?.cancelAnimationFrame(frame);
                frame = null;
            }
            this.#gridService.columnResizeActive.set(false);
            element.removeEventListener("pointermove", onPointerMove);
            element.removeEventListener("pointerup", onPointerUp);
            element.removeEventListener("pointercancel", onPointerUp);
            this.#document.removeEventListener("keydown", onKeydown, true);
            if (element.hasPointerCapture(event.pointerId)) {
                element.releasePointerCapture(event.pointerId);
            }
            if (gridElement != null) {
                gridElement.style.userSelect = previousUserSelect;
            }
            this.#releaseDrag = null;
        };

        const onPointerUp = (): void => {
            commit();
            release();
            this.resizeEnd.emit({
                column: this.column(),
                oldWidth: initialWidth,
                newWidth: newWidth === -1 ? initialWidth : newWidth
            });
        };

        // Escape puts the column back to its width before the drag.
        const onKeydown = (keyEvent: KeyboardEvent): void => {
            if (keyEvent.key !== "Escape") {
                return;
            }
            keyEvent.preventDefault();
            keyEvent.stopPropagation();
            pendingWidth = initialWidth;
            newWidth = initialWidth;
            onPointerUp();
        };

        element.addEventListener("pointermove", onPointerMove);
        element.addEventListener("pointerup", onPointerUp);
        element.addEventListener("pointercancel", onPointerUp);
        this.#document.addEventListener("keydown", onKeydown, true);
        this.#releaseDrag = release;
    }

    #setEvents(): void {
        fromEvent<PointerEvent>(this.#hostElementRef.nativeElement, "pointerdown")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => {
                event.stopImmediatePropagation();
                event.preventDefault();
                this.#onPointerDown(event);
            });
    }
}
