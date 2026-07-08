import { PreventableEvent } from "@mirei/mona-ui/common";
import { PopupRef } from "@mirei/mona-ui/popup";

export class PopoverHideEvent extends PreventableEvent {
    public constructor(
        public readonly target: Element,
        public readonly popupRef: PopupRef
    ) {
        super("popoverHide");
    }
}
