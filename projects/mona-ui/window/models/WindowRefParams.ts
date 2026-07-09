import { ComponentRef } from "@angular/core";
import { PopupCloseEvent, PopupRef } from "@nanahoshi/mona-ui/popup";
import { Observable } from "rxjs";
import { MoveEvent } from "./MoveEvent";
import { ResizeEvent } from "./ResizeEvent";

export interface WindowRefParams<R = unknown> {
    close: (result?: R) => void;
    center: () => void;
    closeWithDelay: (delay: number, result?: R) => void;
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
