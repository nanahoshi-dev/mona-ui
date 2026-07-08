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

interface ResizeBox {
    height: number;
    left: number;
    top: number;
    width: number;
}

interface ResizeBounds {
    innerHeight: number;
    innerWidth: number;
    maxHeight: number;
    maxWidth: number;
    minHeight: number;
    minWidth: number;
}

const KeyboardResizeStep = 10;
const KeyboardResizeStepFine = 1;

@Directive({
    selector: "div[monaWindowResizeHandler]",
    host: {
        "(keydown)": "onKeydown($event)"
    }
})
export class WindowResizeHandlerDirective {
    readonly #destroyRef: DestroyRef = inject(DestroyRef);
    readonly #document = inject(DOCUMENT);
    readonly #hostElementRef: ElementRef<HTMLDivElement> = inject(ElementRef);
    readonly #zone: NgZone = inject(NgZone);
    #activeCleanup?: () => void;

    public readonly direction = input.required<WindowResizeHandlerDirection>();
    public readonly maxHeight = input<number>();
    public readonly maxWidth = input<number>();
    public readonly minHeight = input<number>();
    public readonly minWidth = input<number>();
    public readonly windowRef = input.required<WindowReference>();

    public constructor() {
        afterNextRender({
            read: () => this.#setEvents()
        });
        this.#destroyRef.onDestroy(() => this.#activeCleanup?.());
    }

    protected onKeydown(event: KeyboardEvent): void {
        const step = event.shiftKey ? KeyboardResizeStepFine : KeyboardResizeStep;
        let deltaX = 0;
        let deltaY = 0;

        switch (event.key) {
            case "ArrowUp":
                deltaY = -step;
                break;
            case "ArrowDown":
                deltaY = step;
                break;
            case "ArrowLeft":
                deltaX = -step;
                break;
            case "ArrowRight":
                deltaX = step;
                break;
            default:
                return;
        }

        const element = this.windowRef().element;
        const rect = element.getBoundingClientRect();
        const initial: ResizeBox = { width: rect.width, height: rect.height, top: rect.top, left: rect.left };
        const result = this.#computeResize(this.direction(), deltaX, deltaY, initial, this.#bounds());
        if (!result) {
            return;
        }

        event.preventDefault();
        this.#applyResize(element, result, initial);
    }

    #applyResize(
        element: HTMLElement,
        result: { width?: number; height?: number; left?: number; top?: number },
        initial: ResizeBox
    ): void {
        if (result.height != null) {
            element.style.height = `${result.height}px`;
        }
        if (result.top != null) {
            element.style.top = `${result.top}px`;
        }
        if (result.width != null) {
            element.style.width = `${result.width}px`;
        }
        if (result.left != null) {
            element.style.left = `${result.left}px`;
        }
        this.windowRef().resize$$.next({
            width: result.width ?? initial.width,
            height: result.height ?? initial.height,
            left: result.left ?? initial.left,
            top: result.top ?? initial.top
        });
    }

    #bounds(): ResizeBounds {
        const innerWidth = this.#document.defaultView?.innerWidth || DefaultMaxWindowWidth;
        const innerHeight = this.#document.defaultView?.innerHeight || DefaultMaxWindowHeight;
        return {
            innerWidth,
            innerHeight,
            minWidth: this.minWidth() || DefaultMinWindowWidth,
            minHeight: this.minHeight() || DefaultMinWindowHeight,
            maxWidth: this.maxWidth() ?? innerWidth,
            maxHeight: this.maxHeight() ?? innerHeight
        };
    }

    #computeResize(
        direction: WindowResizeHandlerDirection,
        deltaX: number,
        deltaY: number,
        initial: ResizeBox,
        bounds: ResizeBounds
    ): { width?: number; height?: number; left?: number; top?: number } | null {
        const { minWidth, minHeight, maxWidth, maxHeight, innerWidth, innerHeight } = bounds;
        let height: number | undefined;
        let left: number | undefined;
        let width: number | undefined;
        let top: number | undefined;

        switch (direction) {
            case "northwest":
                if (initial.top + deltaY <= 0 || initial.height - deltaY < minHeight) {
                    return null;
                }
                if (initial.height - deltaY > maxHeight || initial.width - deltaX > maxWidth) {
                    return null;
                }

                height = initial.height - deltaY;
                top = initial.top + deltaY;

                if (initial.left + deltaX < 0 || initial.width - deltaX < minWidth) {
                    return null;
                }

                width = initial.width - deltaX;
                left = initial.left + deltaX;
                break;
            case "north":
                if (initial.top + deltaY <= 0 || initial.height - deltaY < minHeight) {
                    return null;
                }
                if (initial.height - deltaY > maxHeight) {
                    return null;
                }
                height = initial.height - deltaY;
                top = initial.top + deltaY;
                break;
            case "northeast":
                if (initial.top + deltaY <= 0 || initial.height - deltaY < minHeight) {
                    return null;
                }
                if (initial.height - deltaY > maxHeight || initial.width + deltaX > maxWidth) {
                    return null;
                }

                height = initial.height - deltaY;
                top = initial.top + deltaY;

                if (initial.width + deltaX < 100 || initial.left + initial.width + deltaX > innerWidth) {
                    return null;
                }

                width = initial.width + deltaX;
                break;
            case "east":
                if (initial.width + deltaX < minWidth || initial.left + initial.width + deltaX > innerWidth) {
                    return null;
                }
                if (initial.width + deltaX > maxWidth) {
                    return null;
                }

                width = initial.width + deltaX;
                break;
            case "southeast":
                if (initial.height + deltaY < minHeight || initial.top + initial.height + deltaY > innerHeight) {
                    return null;
                }
                if (initial.height + deltaY > maxHeight || initial.width + deltaX > maxWidth) {
                    return null;
                }

                height = initial.height + deltaY;

                if (initial.width + deltaX < minWidth || initial.left + initial.width + deltaX > innerWidth) {
                    return null;
                }

                width = initial.width + deltaX;
                break;
            case "south":
                if (initial.height + deltaY < minHeight || initial.top + initial.height + deltaY > innerHeight) {
                    return null;
                }
                if (initial.height + deltaY > maxHeight) {
                    return null;
                }

                height = initial.height + deltaY;
                break;
            case "southwest":
                if (initial.height + deltaY < minHeight || initial.top + initial.height + deltaY > innerHeight) {
                    return null;
                }
                if (initial.height + deltaY > maxHeight || initial.width - deltaX > maxWidth) {
                    return null;
                }

                height = initial.height + deltaY;

                if (initial.left + deltaX < 0 || initial.width - deltaX < minWidth) {
                    return null;
                }

                width = initial.width - deltaX;
                left = initial.left + deltaX;
                break;
            case "west":
                if (initial.left + deltaX < 0 || initial.width - deltaX < minWidth) {
                    return null;
                }
                if (initial.width - deltaX > maxWidth) {
                    return null;
                }

                width = initial.width - deltaX;
                left = initial.left + deltaX;
                break;
        }

        return { width, height, left, top };
    }

    #onPointerDown(event: PointerEvent): void {
        const element = this.windowRef().element;
        const rect = element.getBoundingClientRect();
        const initial: ResizeBox = { width: rect.width, height: rect.height, top: rect.top, left: rect.left };
        const initialX = event.clientX;
        const initialY = event.clientY;
        const oldSelectStart = this.#document.onselectstart;
        const oldDragStart = this.#document.ondragstart;

        this.#document.onselectstart = () => false;
        this.#document.ondragstart = () => false;

        const bounds = this.#bounds();

        const onPointerMove = (event: PointerEvent) => {
            const deltaX = event.clientX - initialX;
            const deltaY = event.clientY - initialY;
            const result = this.#computeResize(this.direction(), deltaX, deltaY, initial, bounds);
            if (!result) {
                return;
            }
            this.#applyResize(element, result, initial);
        };
        const cleanup = () => {
            this.#document.removeEventListener("pointermove", onPointerMove);
            this.#document.removeEventListener("pointerup", onPointerUp);
            this.#document.onselectstart = oldSelectStart;
            this.#document.ondragstart = oldDragStart;
            this.#activeCleanup = undefined;
        };
        const onPointerUp = () => {
            cleanup();
        };
        this.#activeCleanup = cleanup;
        this.#document.addEventListener("pointermove", onPointerMove);
        this.#document.addEventListener("pointerup", onPointerUp);
    }

    #setEvents(): void {
        this.#zone.runOutsideAngular(() => {
            fromEvent<PointerEvent>(this.#hostElementRef.nativeElement, "pointerdown")
                .pipe(takeUntilDestroyed(this.#destroyRef))
                .subscribe(event => this.#onPointerDown(event));
        });
    }
}
