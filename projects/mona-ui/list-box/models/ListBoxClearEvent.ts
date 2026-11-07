import { PreventableEvent } from "@nanahoshi/mona-ui/common";
import type { ToolbarAction } from "./ToolbarOptions";

// `any` by default, so an event annotated without a type argument keeps untyped items.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class ListBoxClearEvent<T = any> extends PreventableEvent {
    readonly #action: Extract<ToolbarAction, "clear"> = "clear";
    readonly #selectedItems: T[];
    public constructor(selectedItems: Iterable<T>, originalEvent?: Event) {
        super("listBoxClear", originalEvent);
        this.#selectedItems = [...selectedItems];
    }

    /** Discriminant matching the `ListBoxActionEvent` union. */
    public get action(): Extract<ToolbarAction, "clear"> {
        return this.#action;
    }

    /** The items that were selected when Clear Selection was clicked. */
    public get selectedItems(): T[] {
        return this.#selectedItems;
    }
}
