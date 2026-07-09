import { PreventableEvent } from "@nanahoshi/mona-ui/common";
import { ToolbarAction } from "./ToolbarOptions";

export class ListBoxRemoveEvent<T = any> extends PreventableEvent {
    readonly #action: Extract<ToolbarAction, "remove"> = "remove";
    readonly #selectedItems: T[];
    public constructor(selectedItems: Iterable<T>, originalEvent?: Event) {
        super("listBoxRemove", originalEvent);
        this.#selectedItems = [...selectedItems];
    }

    public get action(): Extract<ToolbarAction, "remove"> {
        return this.#action;
    }

    public get selectedItems(): T[] {
        return this.#selectedItems;
    }
}
