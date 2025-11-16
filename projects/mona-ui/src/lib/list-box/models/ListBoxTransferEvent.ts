import { PreventableEvent } from "../../utils/PreventableEvent";
import { ToolbarAction } from "./ToolbarOptions";

type ActionType = Extract<ToolbarAction, "transferAllFrom" | "transferAllTo" | "transferFrom" | "transferTo">;

export class ListBoxTransferEvent<T = unknown> extends PreventableEvent {
    readonly #action: ActionType;
    readonly #selectedItems: T[];
    public constructor(action: ActionType, selectedItems: Iterable<T>, originalEvent?: Event) {
        super("listBoxTransfer", originalEvent);
        this.#action = action;
        this.#selectedItems = Array.from(selectedItems);
    }

    public get action(): ActionType {
        return this.#action;
    }

    public get selectedItems(): T[] {
        return this.#selectedItems;
    }
}
