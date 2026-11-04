import { PreventableEvent } from "@nanahoshi/mona-ui/common";
import type { ToolbarAction } from "./ToolbarOptions";

type ActionType = Extract<ToolbarAction, "transferAllFrom" | "transferAllTo" | "transferFrom" | "transferTo">;

// `any` by default, so an event annotated without a type argument keeps untyped items.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class ListBoxTransferEvent<T = any> extends PreventableEvent {
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
