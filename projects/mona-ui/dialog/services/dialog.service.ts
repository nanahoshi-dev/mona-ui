import { afterNextRender, DOCUMENT, forwardRef, inject, Injectable, Injector } from "@angular/core";
import { setWindowStyles } from "@nanahoshi/mona-ui/internal";
import { PopupService } from "@nanahoshi/mona-ui/popup";
import { DialogContentComponent } from "../components/dialog-content/dialog-content.component";
import { DialogRef } from "../models/DialogRef";
import { DialogReference } from "../models/DialogReference";
import { DialogSettings } from "../models/DialogSettings";
import { createDialogInjectorData } from "../utils/createDialogInjectorData";

@Injectable({
    providedIn: "root"
})
export class DialogService {
    readonly #document = inject(DOCUMENT);
    readonly #injector = inject(Injector);
    readonly #popupService = inject(PopupService);

    public show(settings: DialogSettings): DialogRef {
        const injectorData = createDialogInjectorData(settings);
        const dialogReference = new DialogReference({}, injectorData);
        injectorData.dialogReference = dialogReference;
        const popupRef = this.#popupService.create({
            anchor: this.#document.body,
            backdropClass: settings.modal
                ? ["fixed", "inset-0", "bg-background/50", "transition-opacity", "z-40", "backdrop-blur-xs"]
                : "transparent",
            closeOnBackdropClick: false,
            closeOnEscape: injectorData.closeOnEscape,
            closeOnOutsideClick: false,
            content: DialogContentComponent,
            data: injectorData,

            hasBackdrop: settings.modal ?? true,
            height: settings.height ?? "fit-content",
            maxHeight: settings.maxHeight,
            maxWidth: settings.maxWidth,
            minHeight: settings.minHeight,
            minWidth: settings.minWidth,
            positionStrategy: "global",
            providers: [{ provide: DialogRef, useFactory: forwardRef(() => dialogReference.dialogRef) }],
            width: settings.width
        });
        dialogReference.initializePopupRef(popupRef);

        afterNextRender(
            {
                read: () => {
                    const element = popupRef.overlayRef.overlayElement;
                    setWindowStyles(element, settings);
                }
            },
            { injector: this.#injector }
        );
        return dialogReference.dialogRef;
    }
}
