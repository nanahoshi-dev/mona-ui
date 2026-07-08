import { PopupRef } from "@mirei/mona-ui/popup";

export class PopoverShownEvent {
    public constructor(public readonly target: Element, public readonly popupRef: PopupRef) {}
}
