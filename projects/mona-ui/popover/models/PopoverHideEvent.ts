import { PreventableEvent } from "@nanahoshi/mona-ui/common";
import { PopupRef } from "@nanahoshi/mona-ui/popup";

export class PopoverHideEvent extends PreventableEvent {
    public constructor(
        public readonly target: Element,
        public readonly popupRef: PopupRef
    ) {
        super("popoverHide");
    }
}
