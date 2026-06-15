import { PreventableEvent } from "../../utils/PreventableEvent";

export class GridAddEvent extends PreventableEvent {
    readonly #options: GridAddEventOptions;

    public constructor(options: GridAddEventOptions) {
        super("gridAdd", options.originalEvent);
        this.#options = options;
    }

    public get rowData(): Record<PropertyKey, unknown> {
        return this.#options.rowData;
    }
}

export interface GridAddEventOptions {
    originalEvent?: Event;
    rowData: Record<PropertyKey, unknown>;
}
