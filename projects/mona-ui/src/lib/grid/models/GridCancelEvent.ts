import { PreventableEvent } from "../../utils/PreventableEvent";
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
}

export interface GridCancelEventOptions {
    operation: GridSaveOperation;
    originalEvent?: Event;
    rowData: Record<PropertyKey, unknown>;
}
