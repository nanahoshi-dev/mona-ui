import { DOCUMENT, forwardRef, inject, Injectable } from "@angular/core";
import { asapScheduler, asyncScheduler } from "rxjs";
import { PopupService } from "../../../popup/services/popup.service";
import { setWindowStyles } from "../../utils/setWindowStyles";
import { DialogContentComponent } from "../components/dialog-content/dialog-content.component";
import { DialogRef } from "../models/DialogRef";
import { DialogReference } from "../models/DialogReference";
import { DialogReferenceOptions } from "../models/DialogReferenceOptions";
import { DialogSettings } from "../models/DialogSettings";
import { createDialogInjectorData } from "../utils/createDialogInjectorData";

@Injectable({
    providedIn: "root"
})
export class DialogService {
    readonly #document = inject(DOCUMENT);
    readonly #popupService = inject(PopupService);

    public show(settings: DialogSettings): DialogRef {
        const injectorData = createDialogInjectorData(settings);
        const dialogReferenceHolder: { dialogReference: DialogReference } = { dialogReference: null as never };
        const dialogReferenceOptions: DialogReferenceOptions = { popupRef: null as never };
        dialogReferenceHolder.dialogReference = new DialogReference(dialogReferenceOptions);
        injectorData.dialogReference = dialogReferenceHolder.dialogReference;
        dialogReferenceOptions.popupRef = this.#popupService.create({
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
            providers: [
                { provide: DialogRef, useFactory: forwardRef(() => dialogReferenceHolder.dialogReference.dialogRef) }
            ],
            width: settings.width
        });

        asyncScheduler.schedule(() => {
            const element = dialogReferenceOptions.popupRef.overlayRef.overlayElement;
            setWindowStyles(element, settings);
        });
        return dialogReferenceHolder.dialogReference.dialogRef;
    }
}
