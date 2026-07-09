import { PopupRef } from "@nanahoshi/mona-ui/popup";

export class PopoverShownEvent {
    public constructor(
        public readonly target: Element,
        public readonly popupRef: PopupRef
    ) {}
}
