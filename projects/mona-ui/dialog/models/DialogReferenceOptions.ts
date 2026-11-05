import { type ComponentRef } from "@angular/core";
import { type PopupRef } from "@nanahoshi/mona-ui/popup";

export interface DialogReferenceOptions {
    componentRef?: ComponentRef<unknown>;
    popupRef?: PopupRef;
}
