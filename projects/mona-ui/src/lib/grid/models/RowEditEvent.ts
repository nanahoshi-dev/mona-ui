import { PreventableEvent } from "../../utils/PreventableEvent";

export class RowEditEvent extends PreventableEvent {
    readonly #options: RowEditEventOptions;

    public constructor(options: RowEditEventOptions) {
        super("rowEdit");
        this.#options = options;
    }

    public get rowData(): Record<PropertyKey, unknown> {
        return this.#options.rowData;
    }
}

export interface RowEditEventOptions {
    rowData: Record<PropertyKey, unknown>;
}
