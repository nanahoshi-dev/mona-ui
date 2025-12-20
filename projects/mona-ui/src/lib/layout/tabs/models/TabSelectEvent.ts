import { PreventableEvent } from "../../../utils/PreventableEvent";

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
