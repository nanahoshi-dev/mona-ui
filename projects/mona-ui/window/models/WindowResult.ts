import type { PopupCloseSource } from "@nanahoshi/mona-ui/popup";

/**
 * How a window closed, emitted once by `WindowRef.closed$`.
 * @typeParam R the type of the value passed to `WindowRef.close(value)`
 */
export interface WindowResult<R = unknown> {
    /** The value passed to `close(value)`; `undefined` for the close button, Escape and the host being destroyed. */
    readonly value: R | undefined;
    /** What closed the window: the close button, Escape, or a programmatic close. */
    readonly via: PopupCloseSource;
}
