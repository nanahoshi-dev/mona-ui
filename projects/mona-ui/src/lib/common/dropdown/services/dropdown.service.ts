import { ConnectionPositionPair } from "@angular/cdk/overlay";
import { Injectable, signal, TemplateRef } from "@angular/core";
import { Subject } from "rxjs";
import { PopupCloseEvent } from "../../../popup/models/PopupCloseEvent";
import { PopupRef } from "../../../popup/models/PopupRef";
import { PopupSettings } from "../../../popup/models/PopupSettings";
import { PreventableEvent } from "../../../utils/PreventableEvent";

@Injectable()
export class DropdownService {
    public readonly beforeKeydown$ = new Subject<PreventableEvent<KeyboardEvent>>();
    public readonly beforeNavigate$ = new Subject<PreventableEvent<KeyboardEvent>>();
    public readonly keydown$ = new Subject<KeyboardEvent>();
    public readonly popupCloseComplete$ = new Subject<PopupCloseEvent>();
    public readonly popupCloseStart$ = new Subject<PopupCloseEvent>();
    public readonly popupOpenComplete$ = new Subject<void>();
    public readonly popupRef = signal<PopupRef | null>(null);
    public readonly popupTemplate = signal<TemplateRef<any> | null>(null);
    public readonly restoreFocus = signal<boolean | "auto">("auto");
    public readonly triggerPopupOpen$ = new Subject<Partial<PopupSettings>>();
    public readonly triggerPopupToggle$ = new Subject<Partial<PopupSettings>>();

    public static getDefaultPositions(): ConnectionPositionPair[] {
        return [
            new ConnectionPositionPair(
                { originX: "start", originY: "bottom" },
                { overlayX: "start", overlayY: "top" },
                -1,
                0,
                "mona-dropdown-popup-content-bottom"
            ),
            new ConnectionPositionPair(
                { originX: "start", originY: "top" },
                { overlayX: "start", overlayY: "bottom" },
                -1,
                -1,
                "mona-dropdown-popup-content-top"
            )
        ];
    }
}
