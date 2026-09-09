import { ComponentRef } from "@angular/core";
import { PopupCloseEvent, PopupRef } from "@nanahoshi/mona-ui/popup";
import { Observable } from "rxjs";
import { MoveEvent } from "./MoveEvent";
import { ResizeEvent } from "./ResizeEvent";

export interface WindowRefParams<R = unknown> {
    center: () => void;
    close: (result?: R) => void;
    get close$(): Observable<PopupCloseEvent<R>>;
    closeWithDelay: (delay: number, result?: R) => void;
    get closed$(): Observable<void>;
    get component(): ComponentRef<unknown> | null;
    get drag$(): Observable<MoveEvent>;
    get dragEnd$(): Observable<void>;
    get dragStart$(): Observable<void>;
    get element(): HTMLElement;
    get height(): number;
    move: (params: { top?: number; left?: number }) => void;
    get popupRef(): PopupRef;
    resize: (params: { width?: number; height?: number; center?: boolean }) => void;
    get resize$(): Observable<ResizeEvent>;
    get width(): number;
}
