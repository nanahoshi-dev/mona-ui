import { afterNextRender, DestroyRef, Directive, DOCUMENT, ElementRef, inject, input, NgZone } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { fromEvent } from "rxjs";
import type { WindowReference } from "../models/WindowReference";
import {
    DEFAULT_MAX_WINDOW_HEIGHT,
    DEFAULT_MAX_WINDOW_WIDTH,
    DEFAULT_MIN_WINDOW_HEIGHT,
    DEFAULT_MIN_WINDOW_WIDTH
} from "../utils/defaults";

const KEYBOARD_STEP = 10;
const KEYBOARD_STEP_FINE = 1;

/** How far the pointer travels before a press on the title bar becomes a drag, so a click or double-click isn't. */
const DRAG_THRESHOLD = 3;

/** Controls inside the title bar (its buttons, an action template) that take the pointer and keys themselves. */
const INTERACTIVE =
    "a[href], button, input, select, textarea, [contenteditable]:not([contenteditable='false']), [tabindex]";

/**
 * The window's title bar: dragging it with the pointer moves the window, and while it has focus the arrow keys move
 * the window and Control (or Command) with the arrow keys resizes it. Shift makes either step 1px instead of 10px.
 */
@Directive({
    selector: "div[monaWindowDragHandler]",
    host: {
        "(keydown)": "onKeydown($event)"
    }
})
export class WindowDragHandlerDirective {
    readonly #destroyRef = inject(DestroyRef);
    readonly #document = inject(DOCUMENT);
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #zone = inject(NgZone);
    #activeCleanup?: () => void;

    public readonly draggable = input(true);
    public readonly maxHeight = input<number>();
    public readonly maxWidth = input<number>();
    public readonly minHeight = input<number>();
    public readonly minWidth = input<number>();
    public readonly resizable = input(false);
    public readonly windowRef = input.required<WindowReference>();

    public constructor() {
        afterNextRender({
            write: () => this.#setEvents()
        });
        this.#destroyRef.onDestroy(() => this.#activeCleanup?.());
    }

    protected onKeydown(event: KeyboardEvent): void {
        // Keys pressed on the title bar's own buttons, or on controls in an action template, are theirs.
        if (event.target !== this.#hostElementRef.nativeElement || event.altKey) {
            return;
        }
        const deltas: Record<string, [number, number]> = {
            ArrowDown: [0, 1],
            ArrowLeft: [-1, 0],
            ArrowRight: [1, 0],
            ArrowUp: [0, -1]
        };
        const delta = deltas[event.key];
        if (!delta) {
            return;
        }
        const step = event.shiftKey ? KEYBOARD_STEP_FINE : KEYBOARD_STEP;
        const [deltaX, deltaY] = [delta[0] * step, delta[1] * step];
        const handled = event.ctrlKey || event.metaKey ? this.#resizeBy(deltaX, deltaY) : this.#moveBy(deltaX, deltaY);
        if (handled) {
            event.preventDefault();
        }
    }

    /** Moves the window by the given amount, keeping all of it in the viewport. */
    #moveBy(deltaX: number, deltaY: number): boolean {
        if (!this.draggable()) {
            return false;
        }
        const windowRef = this.windowRef();
        const rect = windowRef.element.getBoundingClientRect();
        const { innerHeight, innerWidth } = this.#viewport();
        const left = Math.round(Math.min(Math.max(0, rect.left + deltaX), Math.max(0, innerWidth - rect.width)));
        const top = Math.round(Math.min(Math.max(0, rect.top + deltaY), Math.max(0, innerHeight - rect.height)));
        windowRef.moveStart$$.next();
        windowRef.move({ left, top });
        windowRef.move$$.next({ left, top });
        windowRef.moveEnd$$.next();
        return true;
    }

    #onPointerDown(event: PointerEvent): void {
        if (!this.draggable() || event.button !== 0 || !event.isPrimary) {
            return;
        }
        const host = this.#hostElementRef.nativeElement;
        const target = event.target instanceof Element ? event.target.closest(INTERACTIVE) : null;
        if (target && target !== host && host.contains(target)) {
            return;
        }

        const windowRef = this.windowRef();
        const rect = windowRef.element.getBoundingClientRect();
        const { innerHeight, innerWidth } = this.#viewport();
        const pointerId = event.pointerId;
        const initialX = event.clientX;
        const initialY = event.clientY;
        let dragging = false;

        const onPointerMove = (moveEvent: PointerEvent) => {
            if (moveEvent.pointerId !== pointerId) {
                return;
            }
            const deltaX = moveEvent.clientX - initialX;
            const deltaY = moveEvent.clientY - initialY;
            if (!dragging) {
                if (Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD) {
                    return;
                }
                dragging = true;
                windowRef.moveStart$$.next();
            }
            if (
                moveEvent.clientX < 0 ||
                moveEvent.clientX > innerWidth ||
                moveEvent.clientY < 0 ||
                moveEvent.clientY > innerHeight
            ) {
                return;
            }
            // The title bar stays below the top edge, where it can still be grabbed.
            const top = Math.max(0, Math.round(rect.top + deltaY));
            const left = Math.round(rect.left + deltaX);
            windowRef.move({ left, top });
            windowRef.move$$.next({ left, top });
        };

        const cleanup = () => {
            this.#document.removeEventListener("pointermove", onPointerMove);
            this.#document.removeEventListener("pointerup", onPointerEnd);
            this.#document.removeEventListener("pointercancel", onPointerEnd);
            if (host.hasPointerCapture?.(pointerId)) {
                host.releasePointerCapture(pointerId);
            }
            this.#activeCleanup = undefined;
        };

        const onPointerEnd = (endEvent: PointerEvent) => {
            if (endEvent.pointerId !== pointerId) {
                return;
            }
            cleanup();
            if (dragging) {
                dragging = false;
                windowRef.moveEnd$$.next();
            }
        };

        this.#activeCleanup?.();
        this.#activeCleanup = cleanup;
        try {
            host.setPointerCapture?.(pointerId);
        } catch {
            // The pointer may already be gone; the document listeners still finish the drag.
        }
        this.#document.addEventListener("pointermove", onPointerMove);
        this.#document.addEventListener("pointerup", onPointerEnd);
        this.#document.addEventListener("pointercancel", onPointerEnd);
    }

    /**
     * Resizes the window from its bottom and right edges by the given amount, within its minimum and maximum sizes
     * and the viewport.
     */
    #resizeBy(deltaX: number, deltaY: number): boolean {
        if (!this.resizable()) {
            return false;
        }
        const windowRef = this.windowRef();
        const rect = windowRef.element.getBoundingClientRect();
        const { innerHeight, innerWidth } = this.#viewport();
        const clamp = (value: number, min: number, max: number) => Math.round(Math.max(min, Math.min(value, max)));
        const minWidth = this.minWidth() ?? DEFAULT_MIN_WINDOW_WIDTH;
        const minHeight = this.minHeight() ?? DEFAULT_MIN_WINDOW_HEIGHT;
        const maxWidth = Math.max(minWidth, Math.min(this.maxWidth() ?? innerWidth, innerWidth - rect.left));
        const maxHeight = Math.max(minHeight, Math.min(this.maxHeight() ?? innerHeight, innerHeight - rect.top));
        const width = deltaX === 0 ? Math.round(rect.width) : clamp(rect.width + deltaX, minWidth, maxWidth);
        const height = deltaY === 0 ? Math.round(rect.height) : clamp(rect.height + deltaY, minHeight, maxHeight);
        const left = Math.round(rect.left);
        const top = Math.round(rect.top);
        // Pin the window where it is, so a centered window grows from its top-left corner like a dragged edge.
        windowRef.move({ left, top });
        windowRef.resize({ height, width });
        windowRef.resize$$.next({ height, left, top, width });
        return true;
    }

    #setEvents(): void {
        this.#zone.runOutsideAngular(() => {
            fromEvent<PointerEvent>(this.#hostElementRef.nativeElement, "pointerdown")
                .pipe(takeUntilDestroyed(this.#destroyRef))
                .subscribe(event => this.#onPointerDown(event));
        });
    }

    #viewport(): { innerHeight: number; innerWidth: number } {
        const view = this.#document.defaultView;
        return {
            innerHeight: view?.innerHeight || DEFAULT_MAX_WINDOW_HEIGHT,
            innerWidth: view?.innerWidth || DEFAULT_MAX_WINDOW_WIDTH
        };
    }
}
