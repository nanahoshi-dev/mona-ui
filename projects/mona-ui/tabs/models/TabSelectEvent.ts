import { PreventableEvent } from "@nanahoshi/mona-ui/common";

export class TabSelectEvent extends PreventableEvent {
    readonly #index: number;

    public constructor(index: number, originalEvent?: Event) {
        super("tabSelect", originalEvent);
        this.#index = index;
    }

    /** Index of the tab being selected. */
    public get index(): number {
        return this.#index;
    }
}
