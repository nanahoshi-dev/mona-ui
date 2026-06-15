import { PreventableEvent } from "../../utils/PreventableEvent";

export class GridRemoveEvent extends PreventableEvent {
    readonly #options: GridRemoveEventOptions;

    public constructor(options: GridRemoveEventOptions) {
        super("gridRemove", options.originalEvent);
        this.#options = options;
    }

    public get rowData(): Record<PropertyKey, unknown> {
        return this.#options.rowData;
    }
}

export interface GridRemoveEventOptions {
    originalEvent?: Event;
    rowData: Record<PropertyKey, unknown>;
}
