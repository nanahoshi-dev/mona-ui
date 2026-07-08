import { PreventableEvent } from "@mirei/mona-ui/common";
import type { GridEditSession } from "./GridEditSession";

export class GridAddEvent extends PreventableEvent {
    readonly #options: GridAddEventOptions;

    public constructor(options: GridAddEventOptions) {
        super("gridAdd", options.originalEvent);
        this.#options = options;
    }

    public get rowData(): Record<PropertyKey, unknown> {
        return this.#options.rowData;
    }

    public get session(): GridEditSession {
        return this.#options.session;
    }
}

export interface GridAddEventOptions {
    originalEvent?: Event;
    rowData: Record<PropertyKey, unknown>;
    session: GridEditSession;
}
