import { ComponentRef } from "@angular/core";
import { PopupRef } from "@nanahoshi/mona-ui/popup";

export interface DialogReferenceOptions {
    componentRef?: ComponentRef<unknown>;
    popupRef?: PopupRef;
}
