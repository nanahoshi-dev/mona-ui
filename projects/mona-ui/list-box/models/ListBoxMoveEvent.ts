import { PreventableEvent } from "@nanahoshi/mona-ui/common";
import type { ToolbarAction } from "./ToolbarOptions";

// `any` by default, so an event annotated without a type argument keeps untyped items.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    /** Discriminant matching the `ListBoxActionEvent` union. */
    public get action(): Extract<ToolbarAction, "moveDown" | "moveUp"> {
        return this.#action;
    }

    /** For Move Up, the index above the first selected item; for Move Down, the index below the last one. */
    public get newIndex(): number {
        return this.#newIndex;
    }

    /** The index of the first selected item (in list order) before the move. */
    public get oldIndex(): number {
        return this.#oldIndex;
    }

    /** Indices of all selected items before the move, ascending. */
    public get selectedIndices(): number[] {
        return this.#selectedIndices;
    }

    /** The items that were selected when the move was requested. */
    public get selectedItems(): T[] {
        return this.#selectedItems;
    }
}
