import {
    ApplicationRef,
    type ComponentRef,
    computed,
    createComponent,
    DOCUMENT,
    effect,
    EnvironmentInjector,
    inject,
    Injectable,
    signal,
    untracked
} from "@angular/core";
import { DragPreviewComponent } from "../components/drag-preview/drag-preview.component";
import type { DragInfo } from "../models/DragInfo";
import type { DragPreviewContext } from "../models/DragPreviewContext";
import type { DropEffect } from "../models/DropEffect";
import type { DropTargetEvent } from "../models/DropTargetEvent";
import type { DragSourceStart, DropTargetRef } from "../models/DropTargetRef";
import { DRAG_CURSOR_CLASSES, DRAGGING_ROOT_CLASSES } from "../styles/drag-drop.styles";

/** How far the pointer moves with the button held before a drag starts: Windows' 4 pixels either way. */
export const DRAG_THRESHOLD = 4;

/** How close to the edge of a scrolling element the pointer brings it to scroll, in pixels. */
export const DRAG_SCROLL_EDGE = 32;

/** How far a scrolling element scrolls in a frame, at most, with the pointer at its very edge. */
export const DRAG_SCROLL_STEP = 16;

/** Where the preview sits from the pointer, so the pointer's tip stays on what it points at. */
const PREVIEW_OFFSET = { x: 12, y: 16 };

/** Fields a drag doesn't start from, so text in them can still be selected by dragging. */
const FIELD_SELECTOR = `input, textarea, select, [contenteditable]:not([contenteditable="false"])`;

interface Keys {
    readonly altKey: boolean;
    readonly ctrlKey: boolean;
    readonly metaKey: boolean;
    readonly shiftKey: boolean;
}

interface Session {
    readonly data: unknown;
    readonly end: (effect: DropEffect) => void;
    readonly preview: ComponentRef<DragPreviewComponent>;
}

const NO_KEYS: Keys = { altKey: false, ctrlKey: false, metaKey: false, shiftKey: false };

function keysOf(event: KeyboardEvent | PointerEvent): Keys {
    return { altKey: event.altKey, ctrlKey: event.ctrlKey, metaKey: event.metaKey, shiftKey: event.shiftKey };
}

function sameKeys(left: Keys, right: Keys): boolean {
    return (
        left.altKey === right.altKey &&
        left.ctrlKey === right.ctrlKey &&
        left.metaKey === right.metaKey &&
        left.shiftKey === right.shiftKey
    );
}

/** How far to scroll along one axis, from the pointer's distance to each edge: back near the start, on near the end. */
function scrollStep(fromStart: number, toEnd: number): number {
    const step = (distance: number): number =>
        Math.ceil(((DRAG_SCROLL_EDGE - Math.max(distance, 0)) / DRAG_SCROLL_EDGE) * DRAG_SCROLL_STEP);
    if (fromStart < DRAG_SCROLL_EDGE && fromStart <= toEnd) {
        return -step(fromStart);
    }
    return toEnd < DRAG_SCROLL_EDGE ? step(toEnd) : 0;
}

/**
 * @hidden
 * Runs drags with the pointer: a source arms one on `pointerdown`, and once the pointer moves far enough, the drag
 * follows it, finds the drop target under it, scrolls what it nears the edge of, and drops where the button is let go.
 * Escape cancels it. Drop targets are found by where the pointer is, so they needn't know the source. One drag at a
 * time, with the mouse or a pen; touch keeps scrolling.
 */
@Injectable({ providedIn: "root" })
export class DragDropService {
    readonly #application = inject(ApplicationRef);
    readonly #document = inject(DOCUMENT);
    readonly #injector = inject(EnvironmentInjector);
    readonly #keys = signal<Keys>(NO_KEYS);
    readonly #previewContext = computed<DragPreviewContext>(() => {
        const data = this.drag()?.data;
        return { $implicit: data, data, effect: this.effect(), target: this.#target()?.value() ?? null };
    });
    readonly #session = signal<Session | null>(null);
    readonly #target = signal<DropTargetRef | null>(null);
    readonly #targets = new WeakMap<Element, DropTargetRef>();
    /** The cursor's classes on the root element now. */
    #cursor = "";
    #disarm: (() => void) | null = null;
    #frame = 0;
    /** The element last found under the pointer, and the element around it that scrolls, if any. */
    #hit: Element | null = null;
    #pointer = { x: 0, y: 0 };
    #pointerId = -1;
    #scroller: Element | null = null;
    #stop: (() => void) | null = null;

    /** The drag in progress, or null. */
    public readonly drag = computed<DragInfo | null>(() => {
        const session = this.#session();
        return session === null ? null : { data: session.data, ...this.#keys() };
    });

    /** What a drop where the pointer is would do: `"none"` away from every target, or where the target refuses it. */
    public readonly effect = computed<DropEffect>(() => {
        const drag = this.drag();
        const target = this.#target();
        return drag === null || target === null ? "none" : (target.effect(drag) ?? "none");
    });

    /** The target under the pointer, or null. */
    public readonly target = this.#target.asReadonly();

    public constructor() {
        effect(() => {
            const cursor = this.drag() === null ? "" : DRAG_CURSOR_CLASSES[this.effect()];
            untracked(() => this.setCursor(cursor));
        });
    }

    /**
     * Arms a drag from a `pointerdown`: once the pointer moves far enough with the button held, `start` says what
     * to drag, or null for nothing. Only the main button of a mouse or a pen arms one, and not in a text field.
     */
    public arm(down: PointerEvent, start: (move: PointerEvent) => DragSourceStart | null): void {
        const window = this.#document.defaultView;
        if (
            window === null ||
            this.#session() !== null ||
            down.button !== 0 ||
            !down.isPrimary ||
            down.pointerType === "touch" ||
            (down.target instanceof Element && down.target.closest(FIELD_SELECTOR) !== null)
        ) {
            return;
        }
        this.#disarm?.();
        const listeners = new AbortController();
        const options = { capture: true, signal: listeners.signal };
        const disarm = (): void => {
            listeners.abort();
            if (this.#disarm === disarm) {
                this.#disarm = null;
            }
        };
        this.#disarm = disarm;
        window.addEventListener(
            "pointermove",
            (move: PointerEvent) => {
                if (move.pointerId !== down.pointerId) {
                    return;
                }
                if ((move.buttons & 1) === 0) {
                    disarm();
                    return;
                }
                const dx = Math.abs(move.clientX - down.clientX);
                const dy = Math.abs(move.clientY - down.clientY);
                if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) {
                    return;
                }
                disarm();
                const drag = start(move);
                if (drag !== null) {
                    this.begin(drag, move);
                }
            },
            options
        );
        window.addEventListener("pointerup", disarm, options);
        window.addEventListener("pointercancel", disarm, options);
        // An image or a link would start the browser's own drag, which takes the pointer away.
        window.addEventListener("dragstart", event => event.preventDefault(), options);
    }

    /** Ends the drag in progress, if any, without a drop. */
    public cancel(): void {
        this.finish(null);
    }

    /**
     * Makes an element a drop target: a drag over it, or over anything inside it that isn't a target for the drag,
     * asks `target`. Returns what unregisters it.
     */
    public register(element: Element, target: DropTargetRef): () => void {
        this.#targets.set(element, target);
        this.#hit = null;
        return () => {
            if (this.#targets.get(element) === target) {
                this.#targets.delete(element);
                this.#hit = null;
            }
        };
    }

    private begin(start: DragSourceStart, move: PointerEvent): void {
        const window = this.#document.defaultView;
        if (window === null) {
            return;
        }
        const preview = createComponent(DragPreviewComponent, { environmentInjector: this.#injector });
        preview.setInput("context", this.#previewContext);
        preview.setInput("template", start.preview);
        this.#application.attachView(preview.hostView);
        const element = preview.location.nativeElement as HTMLElement;
        Object.assign(element.style, { left: "0px", top: "0px" });
        this.#document.body.appendChild(element);

        this.#keys.set(keysOf(move));
        this.#session.set({ data: start.data, end: start.end ?? ((): void => undefined), preview });
        this.#pointerId = move.pointerId;
        const root = this.#document.documentElement;
        root.classList.add(DRAGGING_ROOT_CLASSES);
        this.#document.getSelection()?.removeAllRanges();
        // The root keeps the pointer, so the drag goes on when the element it started on scrolls away.
        try {
            root.setPointerCapture?.(move.pointerId);
        } catch {
            // The pointer is gone already; the next move or `pointerup` ends the drag.
        }

        const listeners = new AbortController();
        const options = { capture: true, signal: listeners.signal };
        window.addEventListener("pointermove", (event: PointerEvent) => this.onPointerMove(event), options);
        window.addEventListener("pointerup", (event: PointerEvent) => this.onPointerUp(event), options);
        window.addEventListener("pointercancel", () => this.finish(null), options);
        window.addEventListener("keydown", (event: KeyboardEvent) => this.onKey(event), options);
        window.addEventListener("keyup", (event: KeyboardEvent) => this.onKey(event), options);
        window.addEventListener("blur", () => this.finish(null), options);
        window.addEventListener("dragstart", event => event.preventDefault(), options);
        this.#stop = () => {
            listeners.abort();
            window.cancelAnimationFrame(this.#frame);
            this.#frame = 0;
            try {
                root.releasePointerCapture?.(this.#pointerId);
            } catch {
                // It was released already.
            }
            root.classList.remove(DRAGGING_ROOT_CLASSES);
        };

        this.moveTo(move.clientX, move.clientY);
        this.#frame = window.requestAnimationFrame(() => this.onFrame());
    }

    private eventFor(target: DropTargetRef, drag: DragInfo): DropTargetEvent {
        return { drag, effect: target.effect(drag) ?? "none", target: target.value() };
    }

    /** Ends the drag: dropped on `target`, or with no drop when it is null. */
    private finish(target: DropTargetRef | null): void {
        const session = this.#session();
        if (session === null) {
            return;
        }
        const drag = this.drag() as DragInfo;
        const effect = target === null ? "none" : this.effect();
        const current = this.#target();
        this.#stop?.();
        this.#stop = null;
        this.#hit = null;
        this.#scroller = null;
        this.#session.set(null);
        this.#target.set(null);
        this.#keys.set(NO_KEYS);
        this.#application.detachView(session.preview.hostView);
        session.preview.destroy();
        session.preview.location.nativeElement.remove();
        this.setCursor("");
        if (target !== null && effect !== "none") {
            target.drop({ drag, effect, target: target.value() });
        } else if (current !== null) {
            current.leave({ drag, effect: current.effect(drag) ?? "none", target: current.value() });
        }
        session.end(target !== null ? effect : "none");
    }

    /** The target under a point: the innermost registered element there whose target takes the drag. */
    private hitTest(x: number, y: number): DropTargetRef | null {
        const drag = this.drag();
        const hit = this.#document.elementFromPoint?.(x, y) ?? null;
        if (hit !== this.#hit) {
            this.#hit = hit;
            this.#scroller = this.scrollerOf(hit);
        }
        if (drag === null) {
            return null;
        }
        for (let element = hit; element !== null; element = element.parentElement) {
            const target = this.#targets.get(element);
            if (target !== undefined && target.effect(drag) !== null) {
                return target;
            }
        }
        return null;
    }

    private moveTo(x: number, y: number): void {
        this.#pointer = { x, y };
        const preview = this.#session()?.preview.location.nativeElement as HTMLElement | undefined;
        if (preview !== undefined) {
            preview.style.transform = `translate(${x + PREVIEW_OFFSET.x}px, ${y + PREVIEW_OFFSET.y}px)`;
        }
        this.retarget();
    }

    private onFrame(): void {
        const window = this.#document.defaultView;
        if (window === null || this.#session() === null) {
            return;
        }
        const scroller = this.#scroller;
        if (scroller !== null) {
            const { x, y } = this.#pointer;
            const rect = scroller.getBoundingClientRect();
            const dx = scroller.scrollWidth > scroller.clientWidth ? scrollStep(x - rect.left, rect.right - x) : 0;
            const dy = scroller.scrollHeight > scroller.clientHeight ? scrollStep(y - rect.top, rect.bottom - y) : 0;
            if (dx !== 0 || dy !== 0) {
                scroller.scrollLeft += dx;
                scroller.scrollTop += dy;
                // What is under the pointer moved with the content.
                this.#hit = null;
                this.retarget();
            }
        }
        this.#frame = window.requestAnimationFrame(() => this.onFrame());
    }

    private onKey(event: KeyboardEvent): void {
        // Keys belong to the drag while it lasts, so the page's own shortcuts don't act on what is dragged.
        event.stopImmediatePropagation();
        if (event.type === "keydown" && event.key === "Escape") {
            event.preventDefault();
            this.finish(null);
            this.suppressClickAfterRelease();
            return;
        }
        this.setKeys(keysOf(event));
    }

    private onPointerMove(event: PointerEvent): void {
        if (event.pointerId !== this.#pointerId) {
            return;
        }
        // The button was let go where the page couldn't see it, such as outside the window.
        if ((event.buttons & 1) === 0) {
            this.finish(null);
            return;
        }
        this.setKeys(keysOf(event));
        this.moveTo(event.clientX, event.clientY);
    }

    private onPointerUp(event: PointerEvent): void {
        if (event.pointerId !== this.#pointerId) {
            return;
        }
        this.setKeys(keysOf(event));
        this.moveTo(event.clientX, event.clientY);
        this.suppressClick();
        this.finish(this.#target());
    }

    /** Finds the target under the pointer again, and tells the old and the new one if it changed. */
    private retarget(): void {
        const next = this.hitTest(this.#pointer.x, this.#pointer.y);
        const current = this.#target();
        if (next === current) {
            return;
        }
        const drag = this.drag() as DragInfo;
        this.#target.set(next);
        if (current !== null) {
            current.leave(this.eventFor(current, drag));
        }
        if (next !== null) {
            next.enter(this.eventFor(next, drag));
        }
    }

    /** The element around `element` that scrolls, or null. */
    private scrollerOf(element: Element | null): Element | null {
        const window = this.#document.defaultView;
        for (let candidate = element; candidate !== null && window !== null; candidate = candidate.parentElement) {
            if (candidate === this.#document.documentElement || candidate === this.#document.body) {
                return null;
            }
            const style = window.getComputedStyle(candidate);
            const scrollsY = /auto|scroll/.test(style.overflowY) && candidate.scrollHeight > candidate.clientHeight;
            const scrollsX = /auto|scroll/.test(style.overflowX) && candidate.scrollWidth > candidate.clientWidth;
            if (scrollsY || scrollsX) {
                return candidate;
            }
        }
        return null;
    }

    private setCursor(classes: string): void {
        if (classes === this.#cursor) {
            return;
        }
        const root = this.#document.documentElement;
        if (this.#cursor !== "") {
            root.classList.remove(...this.#cursor.split(" "));
        }
        if (classes !== "") {
            root.classList.add(...classes.split(" "));
        }
        this.#cursor = classes;
    }

    private setKeys(keys: Keys): void {
        if (!sameKeys(keys, this.#keys())) {
            this.#keys.set(keys);
        }
    }

    /** The click that follows the `pointerup` ending a drag would select what the drag started on, so it's dropped. */
    private suppressClick(): void {
        const window = this.#document.defaultView;
        if (window === null) {
            return;
        }
        const listeners = new AbortController();
        window.addEventListener(
            "click",
            event => {
                event.preventDefault();
                event.stopImmediatePropagation();
                listeners.abort();
            },
            { capture: true, signal: listeners.signal }
        );
        // The click comes in the same task as the `pointerup`, or not at all.
        window.setTimeout(() => listeners.abort());
    }

    /** After Escape, the button is still held: the click its release makes is dropped too. */
    private suppressClickAfterRelease(): void {
        const window = this.#document.defaultView;
        if (window === null) {
            return;
        }
        const listeners = new AbortController();
        const options = { capture: true, signal: listeners.signal };
        window.addEventListener(
            "pointerup",
            () => {
                listeners.abort();
                this.suppressClick();
            },
            options
        );
        window.addEventListener("pointercancel", () => listeners.abort(), options);
    }
}
