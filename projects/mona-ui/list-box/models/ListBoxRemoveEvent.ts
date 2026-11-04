import { PreventableEvent } from "@nanahoshi/mona-ui/common";
import type { ToolbarAction } from "./ToolbarOptions";

// `any` by default, so an event annotated without a type argument keeps untyped items.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
