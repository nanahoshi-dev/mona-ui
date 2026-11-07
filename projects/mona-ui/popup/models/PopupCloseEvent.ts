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
    BackdropClick = "backdropClick",
    CloseButton = "closeButton",
    Escape = "escape",
    MouseLeave = "mouseLeave",
    Programmatic = "programmatic",
    OutsideClick = "outsideClick",
    Scroll = "scroll"
}
