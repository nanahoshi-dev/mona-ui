import { ComponentRef } from "@angular/core";
import { PopupRef } from "@nanahoshi/mona-ui/popup";

export interface WindowReferenceOptions {
    componentRef?: ComponentRef<unknown>; // Type of componentRef is ComponentRef<WindowContentComponent>. It is set as unknown to avoid circular dependency.
    popupRef?: PopupRef;
}
