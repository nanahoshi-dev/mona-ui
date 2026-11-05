import type { ComponentRef } from "@angular/core";
import type { PopupCloseEvent, PopupRef } from "@nanahoshi/mona-ui/popup";
import type { Observable } from "rxjs";
import type { DialogActionEvent } from "./DialogActionEvent";
import type { DialogResult } from "./DialogResult";
import type { DialogSettings } from "./DialogSettings";

export interface DialogRefParams<R = unknown> {
    get action$(): Observable<DialogActionEvent>;
    close: (result?: R) => void;
    get close$(): Observable<PopupCloseEvent<R>>;
    get closed$(): Observable<DialogResult<R>>;
    get component(): ComponentRef<unknown> | null;
    get element(): HTMLElement;
    get height(): number;
    get popupRef(): PopupRef;
    get result(): Observable<DialogResult<R>>;
    update: (data: Partial<DialogSettings>) => void;
    get width(): number;
}
