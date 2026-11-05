import { afterNextRender, DOCUMENT, forwardRef, inject, Injectable, Injector } from "@angular/core";
import { mergeMessages, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { inertOutside, positionGlobalOverlay } from "@nanahoshi/mona-ui/internal";
import { PopupService } from "@nanahoshi/mona-ui/popup";
import { map, merge, type Observable, take } from "rxjs";
import { DialogContentComponent } from "../components/dialog-content/dialog-content.component";
import { DIALOG_DEFAULT_MESSAGES } from "../i18n/dialog.default-messages";
import type { DialogAction } from "../models/DialogAction";
import { DIALOG_DATA } from "../models/DialogData";
import { DialogRef } from "../models/DialogRef";
import { DialogReference } from "../models/DialogReference";
import type { DialogSettings } from "../models/DialogSettings";
import { createDialogInjectorData } from "../utils/createDialogInjectorData";

/** Settings for the `alert()` and `confirm()` helpers, which bring their own buttons. */
export type DialogPromptSettings = Omit<DialogSettings, "actions" | "content" | "data" | "footerTemplate">;

/** Marks the buttons `confirm()` and `alert()` add, so their result can be read without comparing text. */
export const DIALOG_OK = "ok";
export const DIALOG_CANCEL = "cancel";

/** Keeps a dialog 1rem inside the viewport unless the settings give their own limits. */
const VIEWPORT_MARGIN = "2rem";

@Injectable({
    providedIn: "root"
})
export class DialogService {
    readonly #document = inject(DOCUMENT);
    readonly #i18n = inject(MonaI18nService);
    readonly #injector = inject(Injector);
    readonly #localeMessages = this.#i18n.componentMessages("dialog", DIALOG_DEFAULT_MESSAGES);
    readonly #popupService = inject(PopupService);

    /**
     * Opens a dialog with an OK button. Emits once it closes, however it closes, then completes.
     * The dialog opens when `alert()` is called, whether or not the result is subscribed to.
     */
    public alert(settings: DialogPromptSettings): Observable<void> {
        const actions = this.#promptActions(settings, false);
        return this.show({ type: "info", ...settings, actions }).result.pipe(map(() => undefined));
    }

    /**
     * Opens a confirmation dialog with OK and Cancel buttons. Emits `true` for OK and `false` for anything else
     * (Cancel, the close button, Escape), then completes. The dialog opens when `confirm()` is called, whether or
     * not the result is subscribed to.
     */
    public confirm(settings: DialogPromptSettings): Observable<boolean> {
        const actions = this.#promptActions(settings, true);
        return this.show({ type: "confirm", ...settings, actions }).result.pipe(
            map(result => !result.viaClose && result.action.data === DIALOG_OK)
        );
    }

    /**
     * Opens a dialog.
     * @typeParam R the type of the value passed to `DialogRef.close(value)`
     * @typeParam D the type of `data`
     */
    public show<R = unknown, D = unknown>(settings: DialogSettings<D>): DialogRef<R> {
        const modal = settings.modal ?? true;
        const injectorData = createDialogInjectorData(settings);
        const dialogReference = new DialogReference<R>({}, injectorData);
        injectorData.dialogReference = dialogReference as DialogReference;
        const popupRef = this.#popupService.create({
            anchor: this.#document.body,
            backdropClass: modal
                ? ["fixed", "inset-0", "bg-background/50", "transition-opacity", "z-40", "backdrop-blur-xs"]
                : "transparent",
            blockScroll: modal,
            closeOnBackdropClick: false,
            closeOnEscape: injectorData.closeOnEscape,
            closeOnOutsideClick: false,
            content: DialogContentComponent,
            data: injectorData,
            hasBackdrop: modal,
            height: settings.height ?? "fit-content",
            injector: settings.injector,
            maxHeight: settings.maxHeight ?? `calc(100dvh - ${VIEWPORT_MARGIN})`,
            maxWidth: settings.maxWidth ?? `calc(100dvw - ${VIEWPORT_MARGIN})`,
            minHeight: settings.minHeight,
            minWidth: settings.minWidth,
            popupWrapperClass: "mona-popup-constrain-height",
            positionStrategy: "global",
            providers: [
                { provide: DialogRef, useFactory: forwardRef(() => dialogReference.dialogRef) },
                { provide: DIALOG_DATA, useValue: settings.data }
            ],
            restoreFocus: (settings.restoreFocus ?? true) ? "auto" : false,
            width: settings.width
        });
        dialogReference.initializePopupRef(popupRef);
        positionGlobalOverlay(popupRef.overlayRef, { left: settings.left, top: settings.top });

        if (modal) {
            const release = inertOutside(popupRef.overlayRef.hostElement);
            merge(popupRef.closeStart, popupRef.closed)
                .pipe(take(1))
                .subscribe(() => release());
        }

        // Once rendered, center again from the real size, in case the content changed it.
        afterNextRender({ write: () => popupRef.overlayRef.updatePosition() }, { injector: this.#injector });
        return dialogReference.dialogRef;
    }

    #promptActions(settings: DialogPromptSettings, withCancel: boolean): DialogAction[] {
        const messages = mergeMessages(this.#localeMessages(), settings.messages);
        const ok: DialogAction = { data: DIALOG_OK, default: true, look: "primary", text: messages.ok };
        const cancel: DialogAction = { data: DIALOG_CANCEL, look: "default", text: messages.cancel };
        return withCancel ? [ok, cancel] : [ok];
    }
}
