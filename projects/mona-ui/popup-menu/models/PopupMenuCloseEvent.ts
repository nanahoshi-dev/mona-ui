import { PopupCloseEvent } from "@nanahoshi/mona-ui/popup";
import { PreventableEvent } from "@nanahoshi/mona-ui/common";

export class PopupMenuCloseEvent extends PreventableEvent {
    public constructor(originalEvent?: PopupCloseEvent) {
        super("popupMenuCloseEvent", originalEvent?.originalEvent);
    }
}
