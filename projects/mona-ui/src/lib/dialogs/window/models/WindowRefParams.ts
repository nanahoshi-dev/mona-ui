import { Observable } from "rxjs";
import { PopupCloseEvent } from "../../../popup/models/PopupCloseEvent";
import { ComponentRef } from "@angular/core";
import { MoveEvent } from "./MoveEvent";
import { PopupRef } from "../../../popup/models/PopupRef";
import { ResizeEvent } from "./ResizeEvent";

export interface WindowRefParams<R = unknown> {
    close: (result?: R) => void;
    center: () => void;
    move: (params: { top?: number; left?: number }) => void;
    resize: (params: { width?: number; height?: number; center?: boolean }) => void;

    get close$(): Observable<PopupCloseEvent<R>>;
    get closed$(): Observable<void>;
    get component(): ComponentRef<unknown> | null;
    get drag$(): Observable<MoveEvent>;
    get dragEnd$(): Observable<void>;
    get dragStart$(): Observable<void>;
    get element(): HTMLElement;
    get height(): number;
    get popupRef(): PopupRef;
    get resize$(): Observable<ResizeEvent>;
    get width(): number;
}
