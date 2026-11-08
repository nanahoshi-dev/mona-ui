import { PreventableEvent } from "@nanahoshi/mona-ui/common";
import type { GridEditOperation } from "./GridEditOperation";
import type { GridEditSession } from "./GridEditSession";

export type GridSaveOperation = GridEditOperation;

/** `T` is the row type, which a typed `schema` or `newRowFactory` on `monaGridEditable` sets. */
export class GridSaveEvent<T extends object = Record<PropertyKey, unknown>> extends PreventableEvent {
    readonly #options: GridSaveEventOptions<T>;

    public constructor(options: GridSaveEventOptions<T>) {
        super("gridSave", options.originalEvent);
        this.#options = options;
    }

    public get operation(): GridSaveOperation {
        return this.#options.operation;
    }

    public get originalRowData(): T | null {
        return this.#options.originalRowData ?? null;
    }

    public get rowData(): T {
        return this.#options.rowData;
    }

    public get session(): GridEditSession {
        return this.#options.session;
    }
}

export interface GridSaveEventOptions<T extends object = Record<PropertyKey, unknown>> {
    operation: GridSaveOperation;
    originalEvent?: Event;
    originalRowData?: T | null;
    rowData: T;
    session: GridEditSession;
}
