import { PreventableEvent } from "@mirei/mona-ui/common";

export class PopoverShowEvent extends PreventableEvent {
    public constructor(public readonly target: Element) {
        super("popoverShow");
    }
}
