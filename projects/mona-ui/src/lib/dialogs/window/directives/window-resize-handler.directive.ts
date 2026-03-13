import { afterNextRender, DestroyRef, Directive, DOCUMENT, ElementRef, inject, input, NgZone } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { fromEvent } from "rxjs";
import { WindowReference } from "../models/WindowReference";
import { WindowResizeHandlerDirection } from "../models/WindowResizeHandlerDirection";
import {
    DefaultMaxWindowHeight,
    DefaultMaxWindowWidth,
    DefaultMinWindowHeight,
    DefaultMinWindowWidth
} from "../utils/defaults";

@Directive({
    selector: "div[monaWindowResizeHandler]"
})
export class WindowResizeHandlerDirective {
    readonly #destroyRef: DestroyRef = inject(DestroyRef);
    readonly #document = inject(DOCUMENT);
    readonly #hostElementRef: ElementRef<HTMLDivElement> = inject(ElementRef);
    readonly #zone: NgZone = inject(NgZone);

    public direction = input.required<WindowResizeHandlerDirection>();
    public maxHeight = input<number>();
    public maxWidth = input<number>();
    public minHeight = input<number>();
    public minWidth = input<number>();
    public windowRef = input.required<WindowReference>();

    public constructor() {
        afterNextRender({
            read: () => this.setEvents()
        });
    }

    public onMouseDown(event: MouseEvent) {
        const element = this.windowRef().element;
        const initialWidth = element.getBoundingClientRect().width;
        const initialHeight = element.getBoundingClientRect().height;
        const initialX = event.clientX;
        const initialY = event.clientY;
        const initialTop = element.getBoundingClientRect().top;
        const initialLeft = element.getBoundingClientRect().left;
        const oldSelectStart = this.#document.onselectstart;
        const oldDragStart = this.#document.ondragstart;

        this.#document.onselectstart = () => false;
        this.#document.ondragstart = () => false;

        const innerWidth = this.#document.defaultView?.innerWidth || DefaultMaxWindowWidth;
        const innerHeight = this.#document.defaultView?.innerHeight || DefaultMaxWindowHeight;

        const onMouseMove = (event: MouseEvent) => {
            const deltaX = event.clientX - initialX;
            const deltaY = event.clientY - initialY;
            const minWidth = this.minWidth() || DefaultMinWindowWidth;
            const minHeight = this.minHeight() || DefaultMinWindowHeight;
            const maxWidth = this.maxWidth() ?? innerWidth;
            const maxHeight = this.maxHeight() ?? innerHeight;
            let height: number | undefined;
            let left: number | undefined;
            let width: number | undefined;
            let top: number | undefined;

            switch (this.direction()) {
                case "northwest":
                    if (initialTop + deltaY <= 0 || initialHeight - deltaY < minHeight) {
                        return;
                    }
                    if (initialHeight - deltaY > maxHeight || initialWidth - deltaX > maxWidth) {
                        return;
                    }

                    height = initialHeight - deltaY;
                    top = initialTop + deltaY;
                    element.style.height = `${height}px`;
                    element.style.top = `${top}px`;

                    if (initialLeft + deltaX < 0 || initialWidth - deltaX < minWidth) {
                        return;
                    }

                    width = initialWidth - deltaX;
                    left = initialLeft + deltaX;
                    element.style.left = `${left}px`;
                    element.style.width = `${width}px`;
                    break;
                case "north":
                    if (initialTop + deltaY <= 0 || initialHeight - deltaY < minHeight) {
                        return;
                    }
                    if (initialHeight - deltaY > maxHeight) {
                        return;
                    }
                    height = initialHeight - deltaY;
                    top = initialTop + deltaY;
                    element.style.height = `${height}px`;
                    element.style.top = `${top}px`;
                    break;
                case "northeast":
                    if (initialTop + deltaY <= 0 || initialHeight - deltaY < minHeight) {
                        return;
                    }
                    if (initialHeight - deltaY > maxHeight || initialWidth + deltaX > maxWidth) {
                        return;
                    }

                    height = initialHeight - deltaY;
                    top = initialTop + deltaY;
                    element.style.height = `${height}px`;
                    element.style.top = `${top}px`;

                    if (initialWidth + deltaX < 100 || initialLeft + initialWidth + deltaX > innerWidth) {
                        return;
                    }

                    width = initialWidth + deltaX;
                    element.style.width = `${width}px`;
                    break;
                case "east":
                    if (initialWidth + deltaX < minWidth || initialLeft + initialWidth + deltaX > innerWidth) {
                        return;
                    }
                    if (initialWidth + deltaX > maxWidth) {
                        return;
                    }

                    width = initialWidth + deltaX;
                    element.style.width = `${width}px`;
                    break;
                case "southeast":
                    if (initialHeight + deltaY < minHeight || initialTop + initialHeight + deltaY > innerHeight) {
                        return;
                    }
                    if (initialHeight + deltaY > maxHeight || initialWidth + deltaX > maxWidth) {
                        return;
                    }

                    height = initialHeight + deltaY;
                    element.style.height = `${height}px`;

                    if (initialWidth + deltaX < minWidth || initialLeft + initialWidth + deltaX > innerWidth) {
                        return;
                    }

                    width = initialWidth + deltaX;
                    element.style.width = `${width}px`;
                    break;
                case "south":
                    if (initialHeight + deltaY < minHeight || initialTop + initialHeight + deltaY > innerHeight) {
                        return;
                    }
                    if (initialHeight + deltaY > maxHeight) {
                        return;
                    }

                    height = initialHeight + deltaY;
                    element.style.height = `${height}px`;
                    break;
                case "southwest":
                    if (initialHeight + deltaY < minHeight || initialTop + initialHeight + deltaY > innerHeight) {
                        return;
                    }
                    if (initialHeight + deltaY > maxHeight || initialWidth - deltaX > maxWidth) {
                        return;
                    }

                    height = initialHeight + deltaY;
                    element.style.height = `${height}px`;

                    if (initialLeft + deltaX < 0 || initialWidth - deltaX < minWidth) {
                        return;
                    }

                    width = initialWidth - deltaX;
                    left = initialLeft + deltaX;
                    element.style.width = `${width}px`;
                    element.style.left = `${left}px`;
                    break;
                case "west":
                    if (initialLeft + deltaX < 0 || initialWidth - deltaX < minWidth) {
                        return;
                    }
                    if (initialWidth - deltaX > maxWidth) {
                        return;
                    }

                    width = initialWidth - deltaX;
                    left = initialLeft + deltaX;
                    element.style.width = `${width}px`;
                    element.style.left = `${left}px`;
                    break;
            }

            this.windowRef().resize$$.next({
                width: width ?? initialWidth,
                height: height ?? initialHeight,
                left: left ?? initialLeft,
                top: top ?? initialTop
            });
        };
        const onMouseUp = () => {
            this.#document.removeEventListener("mousemove", onMouseMove);
            this.#document.removeEventListener("mouseup", onMouseUp);

            this.#document.onselectstart = oldSelectStart;
            this.#document.ondragstart = oldDragStart;
        };
        this.#document.addEventListener("mousemove", onMouseMove);
        this.#document.addEventListener("mouseup", onMouseUp);
    }

    private setEvents(): void {
        this.#zone.runOutsideAngular(() => {
            fromEvent<MouseEvent>(this.#hostElementRef.nativeElement, "mousedown")
                .pipe(takeUntilDestroyed(this.#destroyRef))
                .subscribe(event => this.onMouseDown(event));
        });
    }
}
