import { afterNextRender, DOCUMENT, forwardRef, inject, Injectable, Injector } from "@angular/core";
import { PopupCloseEvent } from "../../../popup/models/PopupCloseEvent";
import { PopupService } from "../../../popup/services/popup.service";
import { setWindowStyles } from "../../utils/setWindowStyles";
import { WindowContentComponent } from "../components/window-content/window-content.component";
import { WindowInjectorData } from "../models/WindowInjectorData";
import { WindowRef } from "../models/WindowRef";
import { WindowReference } from "../models/WindowReference";
import { WindowSettings } from "../models/WindowSettings";
import { createWindowInjectorData } from "../utils/createWindowInjectorData";

@Injectable({
    providedIn: "root"
})
export class WindowService {
    readonly #document = inject(DOCUMENT);
    readonly #injector = inject(Injector);
    readonly #popupService = inject(PopupService);

    public open(settings: WindowSettings): WindowRef {
        const windowReference = new WindowReference({}, this.#document);
        const injectorData: WindowInjectorData = { ...createWindowInjectorData(settings), windowReference };
        const popupRef = this.#popupService.create({
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
                    useFactory: forwardRef(() => windowReference.windowRef)
                }
            ],
            width: settings.width
        });
        windowReference.initializePopupRef(popupRef);

        afterNextRender({
            read: () => {
                const element = popupRef.overlayRef.overlayElement;
                setWindowStyles(element, settings);
            }
        }, { injector: this.#injector });
        return windowReference.windowRef;
    }
}
