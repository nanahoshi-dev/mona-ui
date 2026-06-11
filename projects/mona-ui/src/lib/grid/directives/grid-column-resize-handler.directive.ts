import { afterNextRender, DestroyRef, Directive, DOCUMENT, ElementRef, inject, input, output } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { fromEvent } from "rxjs";
import { Column } from "../models/Column";
import { GridService } from "../services/grid.service";

@Directive({
    selector: "[monaGridColumnResizeHandler]"
})
export class GridColumnResizeHandlerDirective {
    readonly #defaultMaxWidth = 1000;
    readonly #destroyRef: DestroyRef = inject(DestroyRef);
    readonly #document = inject(DOCUMENT);
    readonly #gridService = inject(GridService);
    readonly #hostElementRef: ElementRef<HTMLDivElement> = inject(ElementRef);

    public readonly resizeEnd = output();
    public readonly resizeStart = output();
    public column = input.required<Column>();

    public constructor() {
        afterNextRender({
            write: () => this.setEvents()
        });
    }

    private onMouseDown(event: MouseEvent) {
        const element = this.#hostElementRef.nativeElement;
        const initialWidth = this.column().calculatedWidth() ?? element.getBoundingClientRect().width;
        const initialX = event.clientX;
        const oldSelectStart = this.#document.onselectstart;
        const headerTableElement = this.#gridService.headerTableElement();
        const bodyTableElement = this.#gridService.bodyTableElement();

        this.#document.onselectstart = () => false;
        this.resizeStart.emit();

        const onMouseMove = (event: MouseEvent) => {
            const deltaX = event.clientX - initialX;
            const minWidth = this.column().minWidth();
            const maxWidth =
                this.column().maxWidth() ?? this.#document.defaultView?.innerWidth ?? this.#defaultMaxWidth;

            if (initialWidth + deltaX < minWidth) {
                return;
            }

            if (initialWidth + deltaX > maxWidth) {
                return;
            }

            const oldWidth = this.column().calculatedWidth() ?? element.getBoundingClientRect().width;
            const calculatedWidth = initialWidth + deltaX;
            this.column().setCalculatedWidth(calculatedWidth);
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
        };

        const onMouseUp = () => {
            this.#document.removeEventListener("mousemove", onMouseMove);
            this.#document.removeEventListener("mouseup", onMouseUp);
            this.#document.onselectstart = oldSelectStart;
            this.resizeEnd.emit();
        };

        this.#document.addEventListener("mousemove", onMouseMove);
        this.#document.addEventListener("mouseup", onMouseUp);
    }

    private setEvents(): void {
        fromEvent<MouseEvent>(this.#hostElementRef.nativeElement, "mousedown")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => {
                event.stopImmediatePropagation();
                event.preventDefault();
                this.onMouseDown(event);
            });
    }
}
