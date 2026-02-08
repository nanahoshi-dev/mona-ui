import { DOCUMENT, forwardRef, inject, Injectable } from "@angular/core";
import { asapScheduler } from "rxjs";
import { PopupCloseEvent } from "../../popup/models/PopupCloseEvent";
import { PopupService } from "../../popup/services/popup.service";
import { WindowContentComponent } from "../components/window-content/window-content.component";
import { WindowCloseEvent } from "../models/WindowCloseEvent";
import { WindowRef } from "../models/WindowRef";
import { WindowReference } from "../models/WindowReference";
import { WindowReferenceOptions } from "../models/WindowReferenceOptions";
import { WindowSettings } from "../models/WindowSettings";
import { createWindowInjectorData } from "../utils/createWindowInjectorData";
import { setWindowStyles } from "../utils/setWindowStyles";

@Injectable({
    providedIn: "root"
})
export class WindowService {
    readonly #document = inject(DOCUMENT);
    readonly #popupService = inject(PopupService);

    public open(settings: WindowSettings): WindowRef {
        const injectorData = createWindowInjectorData(settings);
        const windowReferenceHolder: { windowReference: WindowReference } = {
            windowReference: null as any
        };
        const windowReferenceOptions: WindowReferenceOptions = {
            popupRef: null as any
        };
        windowReferenceHolder.windowReference = new WindowReference(windowReferenceOptions);
        injectorData.windowReference = windowReferenceHolder.windowReference;
        windowReferenceOptions.popupRef = this.#popupService.create({
            anchor: this.#document.body,
            content: WindowContentComponent,
            closeOnBackdropClick: false,
            closeOnEscape: false, // handled by window component
            closeOnOutsideClick: false,
            hasBackdrop: settings.modal,
            backdropClass: settings.modal
                ? ["fixed", "inset-0", "bg-background/50", "transition-opacity", "z-40", "backdrop-blur-xs"]
                : "transparent",
            positionStrategy: "global",
            data: injectorData,
            width: settings.width,
            height: settings.height || "fit-content",
            providers: [
                {
                    provide: WindowRef,
                    useFactory: forwardRef(() => windowReferenceHolder.windowReference.windowRef)
                }
            ],
            preventClose: (event: PopupCloseEvent) => {
                if (settings.preventClose) {
                    const windowCloseEvent = new WindowCloseEvent({
                        event,
                        via: event.via,
                        type: event.type,
                        result: event.result
                    });
                    return settings.preventClose(windowCloseEvent);
                }
                return false;
            }
        });
        asapScheduler.schedule(() => {
            const element = windowReferenceOptions.popupRef.overlayRef.overlayElement;
            setWindowStyles(element, settings);
        });
        return windowReferenceHolder.windowReference.windowRef;
    }
}
