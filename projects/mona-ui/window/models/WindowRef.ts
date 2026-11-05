import type { ComponentRef } from "@angular/core";
import type { PopupCloseEvent, PopupRef } from "@nanahoshi/mona-ui/popup";
import type { Observable } from "rxjs";
import type { MoveEvent } from "./MoveEvent";
import type { ResizeEvent } from "./ResizeEvent";
import type { WindowRefParams } from "./WindowRefParams";
import type { WindowResult } from "./WindowResult";

/**
 * A handle on an open window.
 * @typeParam R the type of the value passed to `close(value)`
 */
export class WindowRef<R = unknown> implements WindowRefParams<R> {
    #options: WindowRefParams<R>;

    public constructor(options: WindowRefParams<R>) {
        this.#options = options;
    }

    /**
     * Centers the window in the viewport. It stays centered as its size changes, until it is moved.
     */
    public center(): void {
        this.#options.center();
    }

    /**
     * Closes the window. `close$` can still prevent it.
     * @param result the value `closed$` reports
     */
    public close(result?: R): void {
        this.#options.close(result);
    }

    public closeWithDelay(delay: number, result?: R): void {
        this.#options.closeWithDelay(delay, result);
    }

    /**
     * Moves the window, in pixels from the viewport's top-left corner. An axis that isn't given keeps its place.
     */
    public move(params: { top?: number; left?: number }): void {
        this.#options.move(params);
    }

    /**
     * Resizes the window, in pixels. A dimension that isn't given keeps its size; `center` centers the window
     * afterward.
     */
    public resize(params: { width?: number; height?: number; center?: boolean }): void {
        this.#options.resize(params);
    }

    /**
     * Emits before the window closes, whatever closes it. Call `preventDefault()` to keep it open. Completes once the
     * window has closed.
     */
    public get close$(): Observable<PopupCloseEvent<R>> {
        return this.#options.close$;
    }

    /**
     * Emits how the window closed, once it has closed, then completes. Replays to late subscribers.
     */
    public get closed$(): Observable<WindowResult<R>> {
        return this.#options.closed$;
    }

    public get component(): ComponentRef<unknown> | null {
        return this.#options.component;
    }

    /** Emits while the window is dragged. Completes when it closes. */
    public get drag$(): Observable<MoveEvent> {
        return this.#options.drag$;
    }

    /** Emits when a drag ends. Completes when the window closes. */
    public get dragEnd$(): Observable<void> {
        return this.#options.dragEnd$;
    }

    /** Emits when a drag starts. Completes when the window closes. */
    public get dragStart$(): Observable<void> {
        return this.#options.dragStart$;
    }

    public get element(): HTMLElement {
        return this.#options.element;
    }

    public get height(): number {
        return this.#options.height;
    }

    public get popupRef(): PopupRef {
        return this.#options.popupRef;
    }

    /** Emits while the window is resized by the user. Completes when it closes. */
    public get resize$(): Observable<ResizeEvent> {
        return this.#options.resize$;
    }

    public get width(): number {
        return this.#options.width;
    }
}
