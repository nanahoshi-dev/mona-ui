import { afterNextRender, DOCUMENT, forwardRef, inject, Injectable, Injector } from "@angular/core";
import { inertOutside } from "@nanahoshi/mona-ui/internal";
import { PopupService } from "@nanahoshi/mona-ui/popup";
import { merge, take } from "rxjs";
import { WindowContentComponent } from "../components/window-content/window-content.component";
import { WINDOW_DATA } from "../models/WindowData";
import type { WindowInjectorData } from "../models/WindowInjectorData";
import { WindowRef } from "../models/WindowRef";
import { WindowReference } from "../models/WindowReference";
import type { WindowSettings } from "../models/WindowSettings";
import { createWindowInjectorData } from "../utils/createWindowInjectorData";

@Injectable({
    providedIn: "root"
})
export class WindowService {
    readonly #document = inject(DOCUMENT);
    readonly #injector = inject(Injector);
    readonly #popupService = inject(PopupService);

    /**
     * Opens a window.
     * @typeParam R the type of the value passed to `WindowRef.close(value)`
     * @typeParam D the type of `data`
     */
    public open<R = unknown, D = unknown>(settings: WindowSettings<D>): WindowRef<R> {
        const modal = settings.modal ?? false;
        const windowReference = new WindowReference<R>({}, this.#document);
        const injectorData: WindowInjectorData = {
            ...createWindowInjectorData(settings),
            windowReference: windowReference as WindowReference
        };
        const windowClass = typeof settings.windowClass === "string" ? [settings.windowClass] : settings.windowClass;
        const popupRef = this.#popupService.create({
            anchor: this.#document.body,
            backdropClass: modal
                ? ["fixed", "inset-0", "bg-background/50", "transition-opacity", "z-40", "backdrop-blur-xs"]
                : "transparent",
            blockScroll: modal,
            closeOnBackdropClick: false,
            closeOnEscape: settings.closeOnEscape ?? true,
            closeOnOutsideClick: false,
            content: WindowContentComponent,
            data: injectorData,
            hasBackdrop: modal,
            height: settings.height ?? "fit-content",
            injector: settings.injector,
            maxHeight: settings.maxHeight ?? "100dvh",
            maxWidth: settings.maxWidth ?? "100dvw",
            minHeight: settings.minHeight,
            minWidth: settings.minWidth,
            // A window dragged past an edge keeps its size instead of shrinking to fit the overlay wrapper.
            popupClass: [
                "shrink-0",
                ...(windowClass ?? []).flatMap(name => name.split(/\s+/)).filter(name => name !== "")
            ],
            popupWrapperClass: "mona-popup-constrain-height",
            positionStrategy: "global",
            preventClose: settings.preventClose,
            providers: [
                { provide: WindowRef, useFactory: forwardRef(() => windowReference.windowRef) },
                { provide: WINDOW_DATA, useValue: settings.data }
            ],
            width: settings.width
        });
        windowReference.initializePopupRef(popupRef, { left: settings.left, top: settings.top });

        if (modal) {
            const release = inertOutside(popupRef.overlayRef.hostElement);
            merge(popupRef.closeStart, popupRef.closed)
                .pipe(take(1))
                .subscribe(() => release());
        }

        // Once rendered, center again from the real size, in case the content changed it.
        afterNextRender({ write: () => popupRef.overlayRef.updatePosition() }, { injector: this.#injector });
        return windowReference.windowRef;
    }
}
