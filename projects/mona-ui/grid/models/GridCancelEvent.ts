import { PreventableEvent } from "@nanahoshi/mona-ui/common";
import type { GridEditSession } from "./GridEditSession";
import type { GridSaveOperation } from "./GridSaveEvent";

/**
 * Why an edit is being canceled: `"command"` for the Cancel button or `cancel()` in a template, `"escape"` for
 * the Escape key, `"switch"` when another edit or the add row starts, `"removed"` when the edited row left the
 * data or the view. A `"removed"` cancel can't be prevented: the row is gone.
 */
export type GridCancelReason = "command" | "escape" | "removed" | "switch";

export class GridCancelEvent extends PreventableEvent {
    readonly #options: GridCancelEventOptions;

    public constructor(options: GridCancelEventOptions) {
        super("gridCancel", options.originalEvent);
        this.#options = options;
    }

    public get operation(): GridSaveOperation {
        return this.#options.operation;
    }

    public get reason(): GridCancelReason {
        return this.#options.reason ?? "command";
    }

    public get rowData(): Record<PropertyKey, unknown> {
        return this.#options.rowData;
    }

    public get session(): GridEditSession {
        return this.#options.session;
    }
}

export interface GridCancelEventOptions {
    operation: GridSaveOperation;
    originalEvent?: Event;
    reason?: GridCancelReason;
    rowData: Record<PropertyKey, unknown>;
    session: GridEditSession;
}
