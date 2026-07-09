import { PreventableEvent } from "@nanahoshi/mona-ui/common";
import { ToolbarAction } from "./ToolbarOptions";

export class ListBoxMoveEvent<T = any> extends PreventableEvent {
    readonly #action: Extract<ToolbarAction, "moveDown" | "moveUp">;
    readonly #newIndex: number;
    readonly #oldIndex: number;
    readonly #selectedIndices: number[];
    readonly #selectedItems: T[];
    public constructor(
        action: Extract<ToolbarAction, "moveDown" | "moveUp">,
        selectedItems: Iterable<T>,
        selectedIndices: Iterable<number>,
        oldIndex: number,
        newIndex: number,
        originalEvent?: Event
    ) {
        super("listBoxMove", originalEvent);
        this.#action = action;
        this.#newIndex = newIndex;
        this.#oldIndex = oldIndex;
        this.#selectedIndices = Array.from(selectedIndices);
        this.#selectedItems = Array.from(selectedItems);
    }

    public get action(): Extract<ToolbarAction, "moveDown" | "moveUp"> {
        return this.#action;
    }

    public get newIndex(): number {
        return this.#newIndex;
    }

    public get oldIndex(): number {
        return this.#oldIndex;
    }

    public get selectedIndices(): number[] {
        return this.#selectedIndices;
    }

    public get selectedItems(): T[] {
        return this.#selectedItems;
    }
}
