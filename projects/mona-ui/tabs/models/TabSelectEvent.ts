import { PreventableEvent } from "@mirei/mona-ui/utils";

export class TabSelectEvent extends PreventableEvent {
    readonly #index: number;

    public constructor(index: number, originalEvent?: Event) {
        super("tabSelect", originalEvent);
        this.#index = index;
    }

    public get index(): number {
        return this.#index;
    }
}
