import { afterNextRender, DestroyRef, Directive, DOCUMENT, ElementRef, inject, input, NgZone } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { fromEvent } from "rxjs";
import type { WindowReference } from "../models/WindowReference";
import type { WindowResizeHandlerDirection } from "../models/WindowResizeHandlerDirection";
import {
    DEFAULT_MAX_WINDOW_HEIGHT,
    DEFAULT_MAX_WINDOW_WIDTH,
    DEFAULT_MIN_WINDOW_HEIGHT,
    DEFAULT_MIN_WINDOW_WIDTH
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

/**
 * A resize handle on a window's edge or corner, for the pointer. The keyboard resizes from the title bar instead
 * (see `WindowDragHandlerDirective`), so the handles stay out of the Tab order.
 */
@Directive({
    selector: "div[monaWindowResizeHandler]"
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
            write: () => this.#setEvents()
        });
        this.#destroyRef.onDestroy(() => this.#activeCleanup?.());
    }

    #applyResize(result: { width?: number; height?: number; left?: number; top?: number }, initial: ResizeBox): void {
        const windowRef = this.windowRef();
        // Pin both axes first, so the edge that isn't dragged stays put even when the window was centered.
        windowRef.move({ left: result.left ?? initial.left, top: result.top ?? initial.top });
        windowRef.resize({ height: result.height, width: result.width });
        windowRef.resize$$.next({
            width: result.width ?? initial.width,
            height: result.height ?? initial.height,
            left: result.left ?? initial.left,
            top: result.top ?? initial.top
        });
    }

    #bounds(): ResizeBounds {
        const innerWidth = this.#document.defaultView?.innerWidth || DEFAULT_MAX_WINDOW_WIDTH;
        const innerHeight = this.#document.defaultView?.innerHeight || DEFAULT_MAX_WINDOW_HEIGHT;
        return {
            innerWidth,
            innerHeight,
            minWidth: this.minWidth() || DEFAULT_MIN_WINDOW_WIDTH,
            minHeight: this.minHeight() || DEFAULT_MIN_WINDOW_HEIGHT,
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

                if (initial.width + deltaX < minWidth || initial.left + initial.width + deltaX > innerWidth) {
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
        if (event.button !== 0 || !event.isPrimary) {
            return;
        }
        event.preventDefault();
        const handle = this.#hostElementRef.nativeElement;
        const pointerId = event.pointerId;
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

        const onPointerMove = (moveEvent: PointerEvent) => {
            if (moveEvent.pointerId !== pointerId) {
                return;
            }
            const deltaX = moveEvent.clientX - initialX;
            const deltaY = moveEvent.clientY - initialY;
            const result = this.#computeResize(this.direction(), deltaX, deltaY, initial, bounds);
            if (!result) {
                return;
            }
            this.#applyResize(result, initial);
        };
        const cleanup = () => {
            this.#document.removeEventListener("pointermove", onPointerMove);
            this.#document.removeEventListener("pointerup", onPointerEnd);
            this.#document.removeEventListener("pointercancel", onPointerEnd);
            this.#document.onselectstart = oldSelectStart;
            this.#document.ondragstart = oldDragStart;
            if (handle.hasPointerCapture?.(pointerId)) {
                handle.releasePointerCapture(pointerId);
            }
            this.#activeCleanup = undefined;
        };
        const onPointerEnd = (endEvent: PointerEvent) => {
            if (endEvent.pointerId === pointerId) {
                cleanup();
            }
        };
        this.#activeCleanup?.();
        this.#activeCleanup = cleanup;
        try {
            handle.setPointerCapture?.(pointerId);
        } catch {
            // The pointer may already be gone; the document listeners still finish the resize.
        }
        this.#document.addEventListener("pointermove", onPointerMove);
        this.#document.addEventListener("pointerup", onPointerEnd);
        this.#document.addEventListener("pointercancel", onPointerEnd);
    }

    #setEvents(): void {
        this.#zone.runOutsideAngular(() => {
            fromEvent<PointerEvent>(this.#hostElementRef.nativeElement, "pointerdown")
                .pipe(takeUntilDestroyed(this.#destroyRef))
                .subscribe(event => this.#onPointerDown(event));
        });
    }
}
