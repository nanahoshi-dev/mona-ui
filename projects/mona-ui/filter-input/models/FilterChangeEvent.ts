import { PreventableEvent } from "@mirei/mona-ui/common";

export class FilterChangeEvent extends PreventableEvent {
    readonly #filter: string;
    public constructor(filterText: string) {
        super("filterInputChange");
        this.#filter = filterText;
    }

    public get filter(): string {
        return this.#filter;
    }
}
