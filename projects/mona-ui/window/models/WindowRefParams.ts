import type { ComponentRef } from "@angular/core";
import type { PopupCloseEvent, PopupRef } from "@nanahoshi/mona-ui/popup";
import type { Observable } from "rxjs";
import type { MoveEvent } from "./MoveEvent";
import type { ResizeEvent } from "./ResizeEvent";
import type { WindowResult } from "./WindowResult";

export interface WindowRefParams<R = unknown> {
    center: () => void;
    close: (result?: R) => void;
    get close$(): Observable<PopupCloseEvent<R>>;
    closeWithDelay: (delay: number, result?: R) => void;
    get closed$(): Observable<WindowResult<R>>;
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
