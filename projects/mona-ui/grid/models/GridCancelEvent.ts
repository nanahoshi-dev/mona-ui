import { PreventableEvent } from "@mirei/mona-ui/common";
import type { GridEditSession } from "./GridEditSession";
import type { GridSaveOperation } from "./GridSaveEvent";

export class GridCancelEvent extends PreventableEvent {
    readonly #options: GridCancelEventOptions;

    public constructor(options: GridCancelEventOptions) {
        super("gridCancel", options.originalEvent);
        this.#options = options;
    }

    public get operation(): GridSaveOperation {
        return this.#options.operation;
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
    rowData: Record<PropertyKey, unknown>;
    session: GridEditSession;
}
