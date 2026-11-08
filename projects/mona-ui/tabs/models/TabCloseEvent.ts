import { PreventableEvent } from "@nanahoshi/mona-ui/common";

export class TabCloseEvent extends PreventableEvent {
    readonly #index: number;
    readonly #selected: boolean;

    public constructor(index: number, selected: boolean, originalEvent?: Event) {
        super("tabClose", originalEvent);
        this.#index = index;
        this.#selected = selected;
    }

    /** Index of the tab a close was requested for. */
    public get index(): number {
        return this.#index;
    }

    /** Whether the tab a close was requested for was the selected tab. */
    public get selected(): boolean {
        return this.#selected;
    }
}
