/**
 * How long a popup opened by hovering waits after the pointer leaves its anchor, so the pointer can cross the gap
 * onto the popup and stay there (WCAG 1.4.13, Content on Hover or Focus).
 */
export const HOVER_GRACE = 100;

/** What made an anchor active: the pointer resting on it, or focus inside it. */
export type HoverSource = "focus" | "pointer";

export interface HoverIntentConfig {
    /** Closes the open popup. */
    readonly hide: () => void;
    /** Read each time a hide is scheduled, in milliseconds. */
    readonly hideDelay: () => number;
    /** Opens the popup for `anchor`; report it with `opened()` once it exists. */
    readonly show: (anchor: HTMLElement) => void;
    /** Read each time a show is scheduled, in milliseconds. */
    readonly showDelay: () => number;
}

/**
 * When to show and hide a popup that follows the pointer and focus, shared by the tooltip and the hover popover.
 *
 * - A show waits for `showDelay`, and leaving the anchor first cancels it.
 * - The popup stays while the pointer is on the anchor or on the popup, or focus is on the anchor. Leaving waits for
 *   `hideDelay` (at least {@link HOVER_GRACE} for the pointer), and coming back cancels the hide.
 * - Moving to another anchor replaces the popup.
 * - After a dismissal (Escape), the popup stays closed until the pointer and focus have left that anchor.
 */
export class HoverIntent {
    readonly #config: HoverIntentConfig;
    #anchor: HTMLElement | null = null;
    #dismissed: HTMLElement | null = null;
    #focused = false;
    #hideTimer: ReturnType<typeof setTimeout> | null = null;
    #hovered = false;
    #panelCleanup: (() => void) | null = null;
    #panelHovered = false;
    #pending: HTMLElement | null = null;
    #showTimer: ReturnType<typeof setTimeout> | null = null;
    #tracked: HTMLElement | null = null;

    public constructor(config: HoverIntentConfig) {
        this.#config = config;
    }

    /**
     * Reports that the popup for `anchor` started closing for a reason of its own (Escape, an outside click, being
     * disabled). With `dismissed`, it stays closed until the pointer and focus have left the anchor.
     */
    public closed(anchor: HTMLElement, dismissed = false): void {
        if (this.#anchor !== anchor) {
            return;
        }
        if (dismissed && (this.#hovered || this.#focused)) {
            this.#dismissed = anchor;
        }
        this.#release();
    }

    /** Stops every timer and forgets every anchor, without closing anything. */
    public dispose(): void {
        this.#clearShow();
        this.#cancelHide();
        this.#release();
        this.#pending = null;
        this.#tracked = null;
        this.#dismissed = null;
    }

    /** The pointer moved onto `anchor`, or focus moved into it. */
    public enter(anchor: HTMLElement, source: HoverSource): void {
        if (anchor !== this.#tracked) {
            this.#tracked = anchor;
            this.#hovered = false;
            this.#focused = false;
        }
        this.#setActive(source, true);
        if (this.#dismissed === anchor) {
            return;
        }
        this.#dismissed = null;
        this.#cancelHide();
        if (this.#anchor === anchor || this.#pending === anchor) {
            return;
        }
        this.#clearShow();
        this.#pending = anchor;
        const delay = this.#config.showDelay();
        if (delay > 0) {
            this.#showTimer = setTimeout(() => this.#show(anchor), delay);
        } else {
            this.#show(anchor);
        }
    }

    /** Hides the popup now, as leaving would, and cancels a pending show. */
    public hideNow(): void {
        this.#clearShow();
        this.#pending = null;
        this.#cancelHide();
        if (this.#anchor) {
            this.#release();
            this.#config.hide();
        }
    }

    /** The pointer left `anchor`, or focus left it. */
    public leave(anchor: HTMLElement, source: HoverSource): void {
        if (anchor !== this.#tracked) {
            return;
        }
        this.#setActive(source, false);
        if (this.#hovered || this.#focused) {
            return;
        }
        if (this.#dismissed === anchor) {
            this.#dismissed = null;
            return;
        }
        if (this.#pending === anchor) {
            this.#clearShow();
            this.#pending = null;
        }
        if (this.#anchor === anchor && !this.#panelHovered) {
            this.#scheduleHide(source);
        }
    }

    /**
     * Reports that the popup for `anchor` is open. While the pointer is on `panel`, the popup stays.
     */
    public opened(anchor: HTMLElement, panel: HTMLElement | null): void {
        this.#release();
        this.#anchor = anchor;
        if (!panel) {
            return;
        }
        const enter = (event: PointerEvent) => {
            if (event.pointerType === "touch") {
                return;
            }
            this.#panelHovered = true;
            this.#cancelHide();
        };
        const leave = (event: PointerEvent) => {
            if (event.pointerType === "touch") {
                return;
            }
            this.#panelHovered = false;
            if (this.#anchor === anchor && !this.#hovered && !this.#focused) {
                this.#scheduleHide("pointer");
            }
        };
        panel.addEventListener("pointerenter", enter);
        panel.addEventListener("pointerleave", leave);
        this.#panelCleanup = () => {
            panel.removeEventListener("pointerenter", enter);
            panel.removeEventListener("pointerleave", leave);
        };
    }

    #cancelHide(): void {
        if (this.#hideTimer != null) {
            clearTimeout(this.#hideTimer);
            this.#hideTimer = null;
        }
    }

    #clearShow(): void {
        if (this.#showTimer != null) {
            clearTimeout(this.#showTimer);
            this.#showTimer = null;
        }
    }

    #release(): void {
        this.#panelCleanup?.();
        this.#panelCleanup = null;
        this.#panelHovered = false;
        this.#anchor = null;
        this.#cancelHide();
    }

    #scheduleHide(source: HoverSource): void {
        this.#cancelHide();
        const delay = Math.max(this.#config.hideDelay(), source === "pointer" ? HOVER_GRACE : 0);
        const hide = () => {
            this.#hideTimer = null;
            if (this.#anchor) {
                this.#release();
                this.#config.hide();
            }
        };
        if (delay > 0) {
            this.#hideTimer = setTimeout(hide, delay);
        } else {
            hide();
        }
    }

    #setActive(source: HoverSource, active: boolean): void {
        if (source === "pointer") {
            this.#hovered = active;
        } else {
            this.#focused = active;
        }
    }

    #show(anchor: HTMLElement): void {
        this.#showTimer = null;
        this.#pending = null;
        if (this.#anchor && this.#anchor !== anchor) {
            this.#release();
            this.#config.hide();
        }
        this.#config.show(anchor);
    }

    /** The anchor whose popup is open, if any. */
    public get anchor(): HTMLElement | null {
        return this.#anchor;
    }
}

/**
 * Feeds a {@link HoverIntent} from pointer and focus events delegated on `root`, so anchors added, removed or
 * re-rendered later need no listeners of their own. Touch pointers are ignored: a tap that focuses the anchor shows
 * the popup through focus instead, and it isn't hidden again by the pointer leaving after the tap.
 * @param resolve the anchor an event target belongs to, or `null`
 * @returns the function that removes the listeners
 */
export const listenForHover = (
    root: Document | HTMLElement,
    resolve: (node: Element) => HTMLElement | null,
    intent: HoverIntent
): (() => void) => {
    const anchorOf = (target: EventTarget | null): HTMLElement | null =>
        target instanceof Element ? resolve(target) : null;
    const stillInside = (anchor: HTMLElement, to: EventTarget | null): boolean =>
        to instanceof Node && anchor.contains(to);

    const over = (event: Event) => {
        if ((event as PointerEvent).pointerType === "touch") {
            return;
        }
        const anchor = anchorOf(event.target);
        if (anchor) {
            intent.enter(anchor, "pointer");
        }
    };
    const out = (event: Event) => {
        if ((event as PointerEvent).pointerType === "touch") {
            return;
        }
        const anchor = anchorOf(event.target);
        if (anchor && !stillInside(anchor, (event as PointerEvent).relatedTarget)) {
            intent.leave(anchor, "pointer");
        }
    };
    const focusIn = (event: Event) => {
        const anchor = anchorOf(event.target);
        if (anchor) {
            intent.enter(anchor, "focus");
        }
    };
    const focusOut = (event: Event) => {
        const anchor = anchorOf(event.target);
        if (anchor && !stillInside(anchor, (event as FocusEvent).relatedTarget)) {
            intent.leave(anchor, "focus");
        }
    };

    root.addEventListener("pointerover", over);
    root.addEventListener("pointerout", out);
    root.addEventListener("focusin", focusIn);
    root.addEventListener("focusout", focusOut);
    return () => {
        root.removeEventListener("pointerover", over);
        root.removeEventListener("pointerout", out);
        root.removeEventListener("focusin", focusIn);
        root.removeEventListener("focusout", focusOut);
    };
};

/**
 * Calls `callback` once `element` leaves the document, for a popup that would otherwise stay anchored to nothing.
 * @returns the function that stops watching
 */
export const onDisconnect = (element: Element, callback: () => void): (() => void) => {
    const view = element.ownerDocument.defaultView;
    if (!view?.MutationObserver) {
        return () => undefined;
    }
    const observer = new view.MutationObserver(() => {
        if (!element.isConnected) {
            observer.disconnect();
            callback();
        }
    });
    observer.observe(element.ownerDocument.body, { childList: true, subtree: true });
    return () => observer.disconnect();
};
