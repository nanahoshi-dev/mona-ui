import { PreventableEvent } from "@mirei/mona-ui/common";
import type { Column } from "./Column";

export class ColumnSortEvent extends PreventableEvent {
    readonly #column: Column;

    public constructor(column: Column) {
        super("columnSort");
        this.#column = column;
    }

    public get column(): Column {
        return this.#column;
    }
}
