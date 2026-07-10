import { ConnectionPositionPair, OverlayRef } from "@angular/cdk/overlay";
import { ComponentRef } from "@angular/core";
import { Observable } from "rxjs";
import { PopupCloseEvent } from "./PopupCloseEvent";

export interface PopupRefParams {
    close: <R>(result?: R, delay?: number) => void;

    get beforeClose$(): Observable<PopupCloseEvent>;

    get closeStart$(): Observable<PopupCloseEvent>;

    get closed$(): Observable<PopupCloseEvent>;

    get component(): ComponentRef<unknown> | null;

    get opened$(): Observable<void>;

    get overlayRef(): OverlayRef;

    get positionChanges$(): Observable<ConnectionPositionPair>;
}
