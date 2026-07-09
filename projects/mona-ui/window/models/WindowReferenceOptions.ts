import { PopupRef } from "@nanahoshi/mona-ui/popup";
import { ComponentRef } from "@angular/core";

export interface WindowReferenceOptions {
    componentRef?: ComponentRef<unknown>; // Type of componentRef is ComponentRef<WindowContentComponent>. It is set as unknown to avoid circular dependency.
    popupRef?: PopupRef;
}
