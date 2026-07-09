import { ComponentRef } from "@angular/core";
import { PopupCloseEvent, PopupRef } from "@nanahoshi/mona-ui/popup";
import { Observable } from "rxjs";
import { DialogResult } from "./DialogResult";
import { DialogSettings } from "./DialogSettings";

export interface DialogRefParams<R = unknown> {
    close: (result?: R) => void;
    update: (data: Partial<DialogSettings>) => void;
    get close$(): Observable<PopupCloseEvent<R>>;
    get closed$(): Observable<void>;
    get component(): ComponentRef<unknown> | null;
    get element(): HTMLElement;
    get height(): number;
    get popupRef(): PopupRef;
    get result(): Observable<DialogResult>;
    get width(): number;
}
