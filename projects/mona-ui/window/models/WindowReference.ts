import type { OverlaySizeConfig } from "@angular/cdk/overlay";
import type { ComponentRef } from "@angular/core";
import { positionGlobalOverlay } from "@nanahoshi/mona-ui/internal";
import { PopupCloseEvent, PopupCloseSource, type PopupRef } from "@nanahoshi/mona-ui/popup";
import { asapScheduler, map, merge, type Observable, ReplaySubject, Subject, take, takeUntil } from "rxjs";
import type { MoveEvent } from "./MoveEvent";
import type { ResizeEvent } from "./ResizeEvent";
import { WindowRef } from "./WindowRef";
import type { WindowReferenceOptions } from "./WindowReferenceOptions";
import type { WindowRefParams } from "./WindowRefParams";
import type { WindowResult } from "./WindowResult";

/** Marks the overlay hosts that hold a window, so a window can be raised above the other windows. */
export const WINDOW_HOST_CLASS = "mona-window-host";

/** Where a window sits, in pixels from the viewport's top-left corner; `null` centers it on that axis. */
export interface WindowPlacement {
    readonly left: number | null;
    readonly top: number | null;
}

/**
 * @internal - used by WindowService. Do not export.
 */
export class WindowReference<R = unknown> implements WindowRefParams<R> {
    readonly #closed$ = new ReplaySubject<WindowResult<R>>(1);
    readonly #document: Document;
    readonly #options: WindowReferenceOptions;
    readonly #windowRef: WindowRef<R>;
    #left: number | null = null;
    #top: number | null = null;
    public readonly move$$: Subject<MoveEvent> = new Subject<MoveEvent>();
    public readonly moveEnd$$: Subject<void> = new Subject<void>();
    public readonly moveStart$$: Subject<void> = new Subject<void>();
    public readonly resize$$: Subject<ResizeEvent> = new Subject<ResizeEvent>();

    public constructor(options: WindowReferenceOptions, document: Document) {
        this.#options = options;
        this.#document = document;
        this.#windowRef = new WindowRef<R>(this);
    }

    /**
     * Raises the window above the other open windows, keeping focus where it was inside it. Other overlays keep
     * their order.
     */
    public bringToFront(): void {
        const host = this.#popupRefOrThrow.overlayRef.hostElement;
        const container = host.parentElement;
        if (!container) {
            return;
        }
        const windows = Array.from(container.children).filter(child => child.classList.contains(WINDOW_HOST_CLASS));
        const topmost = windows.at(-1);
        if (!topmost || topmost === host) {
            return;
        }
        const active = this.#document.activeElement;
        const focused = active instanceof HTMLElement && host.contains(active) ? active : null;
        topmost.after(host);
        if (focused && this.#document.activeElement !== focused) {
            focused.focus({ preventScroll: true });
        }
    }

    public center(): void {
        this.#left = null;
        this.#top = null;
        this.#place();
    }

    public close(result?: R): void {
        const event =
            result instanceof PopupCloseEvent
                ? result
                : new PopupCloseEvent({ result, via: PopupCloseSource.Programmatic });
        this.#popupRefOrThrow.close(event);
    }

    public closeWithDelay(delay: number, result?: R): void {
        asapScheduler.schedule(() => this.close(result), delay);
    }

    /**
     * Connects the window to its popup and places it: at `left`/`top`, or centered on an axis that isn't given.
     */
    public initializePopupRef(popupRef: PopupRef, placement: Partial<WindowPlacement> = {}): void {
        this.#options.popupRef = popupRef;
        this.#left = placement.left ?? null;
        this.#top = placement.top ?? null;
        popupRef.overlayRef.hostElement.classList.add(WINDOW_HOST_CLASS);
        this.#place();
        popupRef.closed.pipe(take(1)).subscribe(event => {
            this.move$$.complete();
            this.moveEnd$$.complete();
            this.moveStart$$.complete();
            this.resize$$.complete();
            this.#closed$.next({
                value: event.result as R | undefined,
                via: event.via ?? PopupCloseSource.Programmatic
            });
            this.#closed$.complete();
        });
    }

    /**
     * Moves the window. An axis that isn't given keeps its place.
     */
    public move(params: { top?: number; left?: number }): void {
        if (params.left != null) {
            this.#left = params.left;
        }
        if (params.top != null) {
            this.#top = params.top;
        }
        this.#place();
    }

    /**
     * Places the window on both axes at once; `null` centers it on that axis.
     */
    public place(placement: WindowPlacement): void {
        this.#left = placement.left;
        this.#top = placement.top;
        this.#place();
    }

    /**
     * Resizes the window. A dimension that isn't given keeps its size.
     */
    public resize(params: { width?: number; height?: number; center?: boolean }): void {
        const size: OverlaySizeConfig = {};
        if (params.width != null) {
            size.width = params.width;
        }
        if (params.height != null) {
            size.height = params.height;
        }
        if (size.width != null || size.height != null) {
            this.setSize(size);
        }
        if (params.center) {
            this.center();
        }
    }

    public setComponentRef(componentRef: ComponentRef<unknown> | undefined): void {
        this.#options.componentRef = componentRef;
    }

    /**
     * Sets any of the overlay's sizes, CSS lengths included. Sizes that aren't given keep their value.
     */
    public setSize(size: OverlaySizeConfig): void {
        this.#popupRefOrThrow.overlayRef.updateSize(size);
    }

    #place(): void {
        positionGlobalOverlay(this.#popupRefOrThrow.overlayRef, { left: this.#left, top: this.#top });
    }

    public get close$(): Observable<PopupCloseEvent<R>> {
        const popupRef = this.#popupRefOrThrow;
        return popupRef.beforeClose.pipe(
            takeUntil(merge(popupRef.closed, this.#closed$).pipe(take(1))),
            map(event => event as PopupCloseEvent<R>)
        );
    }

    public get closed$(): Observable<WindowResult<R>> {
        return this.#closed$.asObservable();
    }

    public get component(): ComponentRef<unknown> | null {
        return this.#options.componentRef ?? null;
    }

    public get drag$(): Observable<MoveEvent> {
        return this.move$$.asObservable();
    }

    public get dragEnd$(): Observable<void> {
        return this.moveEnd$$.asObservable();
    }

    public get dragStart$(): Observable<void> {
        return this.moveStart$$.asObservable();
    }

    public get element(): HTMLElement {
        return this.#popupRefOrThrow.overlayRef.overlayElement;
    }

    public get height(): number {
        return this.element.offsetHeight;
    }

    /** Where the window was last placed; `null` on an axis it is centered on. */
    public get placement(): WindowPlacement {
        return { left: this.#left, top: this.#top };
    }

    public get popupRef(): PopupRef {
        return this.#popupRefOrThrow;
    }

    public get resize$(): Observable<ResizeEvent> {
        return this.resize$$.asObservable();
    }

    /** The sizes the overlay was last given, as set (pixels or CSS lengths). */
    public get size(): OverlaySizeConfig {
        const { height, maxHeight, maxWidth, minHeight, minWidth, width } =
            this.#popupRefOrThrow.overlayRef.getConfig();
        return { height, maxHeight, maxWidth, minHeight, minWidth, width };
    }

    public get width(): number {
        return this.element.offsetWidth;
    }

    public get windowRef(): WindowRef<R> {
        return this.#windowRef;
    }

    get #popupRefOrThrow(): PopupRef {
        if (!this.#options.popupRef) {
            throw new Error("WindowReference: popupRef has not been initialized.");
        }
        return this.#options.popupRef;
    }
}
