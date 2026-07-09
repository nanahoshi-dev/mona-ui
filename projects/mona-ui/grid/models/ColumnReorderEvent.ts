import { PreventableEvent } from "@nanahoshi/mona-ui/common";
import type { Column } from "./Column";

export class ColumnReorderEvent extends PreventableEvent {
    readonly #column: Column;
    readonly #newIndex: number;
    readonly #oldIndex: number;

    public constructor(column: Column, oldIndex: number, newIndex: number) {
        super("columnReorder");
        this.#column = column;
        this.#oldIndex = oldIndex;
        this.#newIndex = newIndex;
    }

    public get column(): Column {
        return this.#column;
    }

    public get newIndex(): number {
        return this.#newIndex;
    }

    public get oldIndex(): number {
        return this.#oldIndex;
    }
}
