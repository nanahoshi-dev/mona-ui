import { PreventableEvent } from "@nanahoshi/mona-ui/common";

export class GridRemoveEvent extends PreventableEvent {
    readonly #options: GridRemoveEventOptions;

    public constructor(options: GridRemoveEventOptions) {
        super("gridRemove", options.originalEvent);
        this.#options = options;
    }

    /** The row's position in the grid's `data`, or -1 when it is no longer there. */
    public get index(): number {
        return this.#options.index ?? -1;
    }

    /** The row's `rowKey` value, or the data item when the grid has no `rowKey`. */
    public get key(): unknown {
        return this.#options.key ?? this.#options.rowData;
    }

    public get rowData(): Record<PropertyKey, unknown> {
        return this.#options.rowData;
    }
}

export interface GridRemoveEventOptions {
    index?: number;
    key?: unknown;
    originalEvent?: Event;
    rowData: Record<PropertyKey, unknown>;
}
