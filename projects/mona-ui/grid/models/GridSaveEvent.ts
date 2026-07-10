import { PreventableEvent } from "@nanahoshi/mona-ui/common";
import type { GridEditOperation } from "./GridEditOperation";
import type { GridEditSession } from "./GridEditSession";

export type GridSaveOperation = GridEditOperation;

export class GridSaveEvent extends PreventableEvent {
    readonly #options: GridSaveEventOptions;

    public constructor(options: GridSaveEventOptions) {
        super("gridSave", options.originalEvent);
        this.#options = options;
    }

    public get operation(): GridSaveOperation {
        return this.#options.operation;
    }

    public get originalRowData(): Record<PropertyKey, unknown> | null {
        return this.#options.originalRowData ?? null;
    }

    public get rowData(): Record<PropertyKey, unknown> {
        return this.#options.rowData;
    }

    public get session(): GridEditSession {
        return this.#options.session;
    }
}

export interface GridSaveEventOptions {
    operation: GridSaveOperation;
    originalEvent?: Event;
    originalRowData?: Record<PropertyKey, unknown> | null;
    rowData: Record<PropertyKey, unknown>;
    session: GridEditSession;
}
