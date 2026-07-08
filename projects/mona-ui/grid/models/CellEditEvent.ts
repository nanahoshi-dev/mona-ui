import { PreventableEvent } from "@mirei/mona-ui/common";
import type { GridEditSession } from "./GridEditSession";

export class CellEditEvent extends PreventableEvent {
    readonly #options: CellEditEventOptions;
    public constructor(options: CellEditEventOptions) {
        super("cellEdit");
        this.#options = options;
    }

    public get field(): string {
        return this.#options.field;
    }

    public get newValue(): unknown {
        return this.#options.newValue;
    }

    public get oldValue(): unknown {
        return this.#options.oldValue;
    }

    public get rowData(): Record<PropertyKey, unknown> {
        return this.#options.rowData;
    }

    public get session(): GridEditSession {
        return this.#options.session;
    }
}

export interface CellEditEventOptions {
    field: string;
    newValue: unknown;
    oldValue: unknown;
    rowData: Record<PropertyKey, unknown>;
    session: GridEditSession;
}
