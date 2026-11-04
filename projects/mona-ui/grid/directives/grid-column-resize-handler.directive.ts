import { afterNextRender, DestroyRef, Directive, DOCUMENT, ElementRef, inject, input, output } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { injectComponentDirection } from "@nanahoshi/mona-ui/i18n";
import { fromEvent } from "rxjs";
import type { Column } from "../models/Column";
import type { ColumnResizeEvent } from "../models/ColumnResizeEvent";
import { GridService } from "../services/grid.service";

@Directive({
    selector: "[monaGridColumnResizeHandler]",
    host: {
        "[attr.aria-label]": "messages().resizeColumn",
        "[attr.aria-orientation]": "'vertical'",
        "[attr.role]": "'separator'"
    }
})
export class GridColumnResizeHandlerDirective {
    readonly #destroyRef: DestroyRef = inject(DestroyRef);
    readonly #direction = injectComponentDirection();
    readonly #document = inject(DOCUMENT);
    readonly #gridService = inject(GridService);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    protected readonly messages = this.#gridService.messages;

    public readonly column = input.required<Column>();
    public readonly resizeEnd = output<ColumnResizeEvent>();
    public readonly resizeStart = output();

    public constructor() {
        afterNextRender({
            write: () => this.#setEvents()
        });
    }

    /**
     * The width for a drag distance, or `null` outside the column's limits. The table widths follow the
     * column widths through their bindings, so nothing is measured here.
     */
    #widthFor(initialWidth: number, deltaX: number): number | null {
        const column = this.column();
        const minWidth = column.minWidth ?? 0;
        const maxWidth = column.maxWidth ?? this.#document.defaultView?.innerWidth ?? Infinity;

        if (initialWidth + deltaX < minWidth || initialWidth + deltaX > maxWidth) {
            return null;
        }
        return this.#gridService.normalizeRenderedWidth(initialWidth + deltaX);
    }

    #onPointerDown(event: PointerEvent): void {
        const element = this.#hostElementRef.nativeElement;
        const initialWidth = this.#gridService.getColumnWidth(this.column());
        const initialX = event.clientX;
        const oldSelectStart = this.#document.onselectstart;

        this.#document.onselectstart = () => false;
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

        const onPointerMove = (event: PointerEvent) => {
            const physicalDelta = event.clientX - initialX;
            const logicalDelta = this.#direction() === "rtl" ? -physicalDelta : physicalDelta;
            const width = this.#widthFor(initialWidth, logicalDelta);
            if (width == null) {
                return;
            }
            newWidth = width;
            pendingWidth = width;
            if (frame == null) {
                if (view?.requestAnimationFrame) {
                    frame = view.requestAnimationFrame(commit);
                } else {
                    commit();
                }
            }
        };

        const onPointerUp = () => {
            if (frame != null) {
                view?.cancelAnimationFrame(frame);
            }
            commit();
            this.#gridService.columnResizeActive.set(false);
            element.removeEventListener("pointermove", onPointerMove);
            element.removeEventListener("pointerup", onPointerUp);
            element.removeEventListener("pointercancel", onPointerUp);
            if (element.hasPointerCapture(event.pointerId)) {
                element.releasePointerCapture(event.pointerId);
            }
            this.#document.onselectstart = oldSelectStart;
            this.resizeEnd.emit({
                column: this.column(),
                oldWidth: initialWidth,
                newWidth: newWidth === -1 ? initialWidth : newWidth
            });
        };

        element.addEventListener("pointermove", onPointerMove);
        element.addEventListener("pointerup", onPointerUp);
        element.addEventListener("pointercancel", onPointerUp);
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
