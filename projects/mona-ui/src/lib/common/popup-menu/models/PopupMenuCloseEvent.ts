import { PopupCloseEvent } from "../../../popup/models/PopupCloseEvent";
import { PreventableEvent } from "../../../utils/PreventableEvent";

export class PopupMenuCloseEvent extends PreventableEvent {
    public constructor(originalEvent?: PopupCloseEvent) {
        super("popupMenuCloseEvent", originalEvent?.originalEvent);
    }
}
