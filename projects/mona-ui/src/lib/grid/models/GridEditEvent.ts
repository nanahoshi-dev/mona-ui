import { PreventableEvent } from "../../utils/PreventableEvent";
import type { GridEditSession } from "./GridEditSession";

export class GridEditEvent extends PreventableEvent {
    readonly #options: GridEditEventOptions;

    public constructor(options: GridEditEventOptions) {
        super("gridEdit", options.originalEvent);
        this.#options = options;
    }

    public get rowData(): Record<PropertyKey, unknown> {
        return this.#options.rowData;
    }

    public get session(): GridEditSession {
        return this.#options.session;
    }
}

export interface GridEditEventOptions {
    originalEvent?: Event;
    rowData: Record<PropertyKey, unknown>;
    session: GridEditSession;
}
