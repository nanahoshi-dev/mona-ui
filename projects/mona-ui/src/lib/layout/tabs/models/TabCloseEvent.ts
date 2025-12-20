import { PreventableEvent } from "../../../utils/PreventableEvent";

export class TabCloseEvent extends PreventableEvent {
    readonly #index: number;
    readonly #selected: boolean;

    public constructor(index: number, selected: boolean, originalEvent?: Event) {
        super("tabClose", originalEvent);
        this.#index = index;
        this.#selected = selected;
    }

    public get index(): number {
        return this.#index;
    }

    public get selected(): boolean {
        return this.#selected;
    }
}
