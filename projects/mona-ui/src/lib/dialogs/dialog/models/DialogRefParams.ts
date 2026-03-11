import { ComponentRef } from "@angular/core";
import { Observable } from "rxjs";
import { PopupCloseEvent } from "../../../popup/models/PopupCloseEvent";
import { PopupRef } from "../../../popup/models/PopupRef";
import { DialogResult } from "./DialogResult";

export interface DialogRefParams<R = unknown> {
    close: (result?: R) => void;
    get close$(): Observable<PopupCloseEvent<R>>;
    get closed$(): Observable<void>;
    get component(): ComponentRef<any> | null;
    get element(): HTMLElement;
    get height(): number;
    get popupRef(): PopupRef;
    get result(): Observable<DialogResult>;
    get width(): number;
}
