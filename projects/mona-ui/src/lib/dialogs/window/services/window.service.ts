import { DOCUMENT, forwardRef, inject, Injectable } from "@angular/core";
import { asapScheduler } from "rxjs";
import { PopupCloseEvent } from "../../../popup/models/PopupCloseEvent";
import { PopupService } from "../../../popup/services/popup.service";
import { setWindowStyles } from "../../utils/setWindowStyles";
import { WindowContentComponent } from "../components/window-content/window-content.component";
import { WindowRef } from "../models/WindowRef";
import { WindowReference } from "../models/WindowReference";
import { WindowReferenceOptions } from "../models/WindowReferenceOptions";
import { WindowSettings } from "../models/WindowSettings";
import { createWindowInjectorData } from "../utils/createWindowInjectorData";

@Injectable({
    providedIn: "root"
})
export class WindowService {
    readonly #document = inject(DOCUMENT);
    readonly #popupService = inject(PopupService);

    public open(settings: WindowSettings): WindowRef {
        const injectorData = createWindowInjectorData(settings);
        const windowReferenceHolder: { windowReference: WindowReference } = {
            windowReference: null as never
        };
        const windowReferenceOptions: WindowReferenceOptions = {
            popupRef: null as never
        };
        windowReferenceHolder.windowReference = new WindowReference(windowReferenceOptions);
        injectorData.windowReference = windowReferenceHolder.windowReference;
        windowReferenceOptions.popupRef = this.#popupService.create({
            anchor: this.#document.body,
            backdropClass: settings.modal
                ? ["fixed", "inset-0", "bg-background/50", "transition-opacity", "z-40", "backdrop-blur-xs"]
                : "transparent",
            closeOnBackdropClick: false,
            closeOnEscape: settings.closeOnEscape ?? true,
            closeOnOutsideClick: false,
            content: WindowContentComponent,
            data: injectorData,
            hasBackdrop: settings.modal,
            height: settings.height || "fit-content",
            maxHeight: settings.maxHeight,
            maxWidth: settings.maxWidth,
            minHeight: settings.minHeight,
            minWidth: settings.minWidth,
            positionStrategy: "global",
            preventClose: (event: PopupCloseEvent) => {
                if (settings.preventClose) {
                    return settings.preventClose(event);
                }
                return false;
            },
            providers: [
                {
                    provide: WindowRef,
                    useFactory: forwardRef(() => windowReferenceHolder.windowReference.windowRef)
                }
            ],
            width: settings.width
        });
        asapScheduler.schedule(() => {
            const element = windowReferenceOptions.popupRef.overlayRef.overlayElement;
            setWindowStyles(element, settings);
        });
        return windowReferenceHolder.windowReference.windowRef;
    }
}
