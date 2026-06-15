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

    public get originalRowData(): Record<PropertyKey, unknown> | null {
        return this.#options.originalRowData ?? null;
    }
}

export interface RowEditEventOptions {
    originalRowData?: Record<PropertyKey, unknown> | null;
    rowData: Record<PropertyKey, unknown>;
}
