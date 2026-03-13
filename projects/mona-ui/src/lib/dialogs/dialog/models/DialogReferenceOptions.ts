import { ComponentRef } from "@angular/core";
import { PopupRef } from "../../../popup/models/PopupRef";

export interface DialogReferenceOptions {
    componentRef?: ComponentRef<unknown>;
    popupRef?: PopupRef;
}
