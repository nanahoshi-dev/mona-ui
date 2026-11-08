import { PreventableEvent } from "@nanahoshi/mona-ui/common";

export class PopupCloseEvent<R = unknown> extends PreventableEvent {
    readonly #options?: Partial<PopupCloseEventOptions<R>>;
    public constructor(options?: Partial<PopupCloseEventOptions<R>>) {
        super(options?.type ?? "popupClose", options?.originalEvent);
        this.#options = options;
    }

    /** The result value passed to `close()`, if any. */
    public get result(): R | undefined {
        return this.#options?.result;
    }

    /** The source of the close. */
    public get via(): PopupCloseSource | undefined {
        return this.#options?.via;
    }
}

export interface PopupCloseEventOptions<R = unknown, E = unknown> {
    event?: E;
    originalEvent: Event;
    result?: R;
    type?: string;
    via?: PopupCloseSource;
}

export enum PopupCloseSource {
    /** A dialog action button, such as OK or Cancel. */
    Action = "action",
    /** A click on the backdrop, when `closeOnBackdropClick` allows it. */
    BackdropClick = "backdropClick",
    /** The close button of a dialog, window or sheet. */
    CloseButton = "closeButton",
    /** The Escape key. */
    Escape = "escape",
    /** The pointer leaving the anchor, when `closeOnMouseLeave` is set. */
    MouseLeave = "mouseLeave",
    /** A `close()` call from code, with no user interaction behind it. */
    Programmatic = "programmatic",
    /** A pointer press outside the popup and its anchor. */
    OutsideClick = "outsideClick",
    /** The anchor scrolling away, when `closeOnScroll` is set. */
    Scroll = "scroll"
}
