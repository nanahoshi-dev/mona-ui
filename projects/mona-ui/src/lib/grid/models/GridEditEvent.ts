import { PreventableEvent } from "../../utils/PreventableEvent";

export class GridEditEvent extends PreventableEvent {
    readonly #options: GridEditEventOptions;

    public constructor(options: GridEditEventOptions) {
        super("gridEdit", options.originalEvent);
        this.#options = options;
    }

    public get rowData(): Record<PropertyKey, unknown> {
        return this.#options.rowData;
    }
}

export interface GridEditEventOptions {
    originalEvent?: Event;
    rowData: Record<PropertyKey, unknown>;
}
