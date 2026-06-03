import { PreventableEvent } from "../../utils/PreventableEvent";

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

    public get rowData(): unknown {
        return this.#options.rowData;
    }
}

export interface CellEditEventOptions {
    field: string;
    newValue: unknown;
    oldValue: unknown;
    rowData: unknown;
}
