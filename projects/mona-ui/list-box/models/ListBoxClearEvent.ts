import { PreventableEvent } from "@nanahoshi/mona-ui/common";
import { ToolbarAction } from "./ToolbarOptions";

export class ListBoxClearEvent<T = any> extends PreventableEvent {
    readonly #action: Extract<ToolbarAction, "clear"> = "clear";
    readonly #selectedItems: T[];
    public constructor(selectedItems: Iterable<T>, originalEvent?: Event) {
        super("listBoxClear", originalEvent);
        this.#selectedItems = [...selectedItems];
    }

    public get action(): Extract<ToolbarAction, "clear"> {
        return this.#action;
    }

    public get selectedItems(): T[] {
        return this.#selectedItems;
    }
}
