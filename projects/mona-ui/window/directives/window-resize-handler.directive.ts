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

    /**
     * Moves the dragged edges, each on its own axis. An edge stops at the size limits and at the viewport rather than
     * ignoring the move, so a fast drag still reaches the limit and a corner keeps resizing on its other axis.
     */
    #computeResize(
        direction: WindowResizeHandlerDirection,
        deltaX: number,
        deltaY: number,
        initial: ResizeBox,
        bounds: ResizeBounds
    ): { width?: number; height?: number; left?: number; top?: number } {
        const { minWidth, minHeight, maxWidth, maxHeight, innerWidth, innerHeight } = bounds;
        // The minimum wins when the space left is smaller than it.
        const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(value, max));
        const result: { width?: number; height?: number; left?: number; top?: number } = {};

        if (direction.includes("east")) {
            result.width = clamp(initial.width + deltaX, minWidth, Math.min(maxWidth, innerWidth - initial.left));
        } else if (direction.includes("west")) {
            const right = initial.left + initial.width;
            result.width = clamp(initial.width - deltaX, minWidth, Math.min(maxWidth, right));
            result.left = right - result.width;
        }
        if (direction.includes("south")) {
            result.height = clamp(initial.height + deltaY, minHeight, Math.min(maxHeight, innerHeight - initial.top));
        } else if (direction.includes("north")) {
            const bottom = initial.top + initial.height;
            result.height = clamp(initial.height - deltaY, minHeight, Math.min(maxHeight, bottom));
            result.top = bottom - result.height;
        }
        return result;
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
            this.#applyResize(this.#computeResize(this.direction(), deltaX, deltaY, initial, bounds), initial);
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
