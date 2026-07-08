import { afterNextRender, DestroyRef, Directive, DOCUMENT, ElementRef, inject, input, output } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { fromEvent } from "rxjs";
import type { Column } from "../models/Column";
import type { ColumnResizeEvent } from "../models/ColumnResizeEvent";
import { GridService } from "../services/grid.service";

@Directive({
    selector: "[monaGridColumnResizeHandler]",
    host: {
        "[attr.aria-label]": "'Resize column'",
        "[attr.aria-orientation]": "'vertical'",
        "[attr.role]": "'separator'"
    }
})
export class GridColumnResizeHandlerDirective {
    readonly #destroyRef: DestroyRef = inject(DestroyRef);
    readonly #document = inject(DOCUMENT);
    readonly #gridService = inject(GridService);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);

    public readonly column = input.required<Column>();
    public readonly resizeEnd = output<ColumnResizeEvent>();
    public readonly resizeStart = output();

    public constructor() {
        afterNextRender({
            write: () => this.#setEvents()
        });
    }

    #applyDelta(initialWidth: number, deltaX: number): number | null {
        const column = this.column();
        const minWidth = column.minWidth ?? 0;
        const maxWidth = column.maxWidth ?? this.#document.defaultView?.innerWidth ?? Infinity;

        if (initialWidth + deltaX < minWidth || initialWidth + deltaX > maxWidth) {
            return null;
        }

        const headerTableElement = this.#gridService.headerTableElement();
        const bodyTableElement = this.#gridService.bodyTableElement();
        const oldWidth = this.#gridService.getColumnWidth(this.column());
        const calculatedWidth = this.#gridService.normalizeRenderedWidth(initialWidth + deltaX);
        this.#gridService.setCalculatedWidth(column.id, calculatedWidth);
        if (headerTableElement) {
            headerTableElement.style.width = `${
                headerTableElement.getBoundingClientRect().width + (calculatedWidth - oldWidth)
            }px`;
        }
        if (bodyTableElement) {
            bodyTableElement.style.width = `${
                bodyTableElement.getBoundingClientRect().width + (calculatedWidth - oldWidth)
            }px`;
        }
        return calculatedWidth;
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

        const onPointerMove = (event: PointerEvent) => {
            const deltaX = event.clientX - initialX;
            const appliedWidth = this.#applyDelta(initialWidth, deltaX);
            if (appliedWidth != null) {
                newWidth = appliedWidth;
            }
        };

        const onPointerUp = () => {
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
