import { PopupCloseEvent } from "@mirei/mona-ui/popup";
import { PreventableEvent } from "@mirei/mona-ui/common";

export class PopupMenuCloseEvent extends PreventableEvent {
    public constructor(originalEvent?: PopupCloseEvent) {
        super("popupMenuCloseEvent", originalEvent?.originalEvent);
    }
}
