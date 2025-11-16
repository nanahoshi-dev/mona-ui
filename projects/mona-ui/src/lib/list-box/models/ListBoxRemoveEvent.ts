import { ToolbarAction } from "./ToolbarOptions";
import { PreventableEvent } from "../../utils/PreventableEvent";

export class ListBoxRemoveEvent<T = unknown> extends PreventableEvent {
    readonly #action: Extract<ToolbarAction, "remove">;
    readonly #selectedItems: T[];
    public constructor(action: Extract<ToolbarAction, "remove">, selectedItems: Iterable<T>, originalEvent?: Event) {
        super("listBoxRemove", originalEvent);
        this.#action = action;
        this.#selectedItems = Array.from(selectedItems);
    }

    public get action(): Extract<ToolbarAction, "remove"> {
        return this.#action;
    }

    public get selectedItems(): T[] {
        return this.#selectedItems;
    }
}
