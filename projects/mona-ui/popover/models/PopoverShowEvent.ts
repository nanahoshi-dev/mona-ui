import { PreventableEvent } from "@nanahoshi/mona-ui/common";

export class PopoverShowEvent extends PreventableEvent {
    public constructor(public readonly target: Element) {
        super("popoverShow");
    }
}
