import { Observable } from "rxjs";
import { PopupCloseEvent } from "./PopupCloseEvent";
import { ComponentRef } from "@angular/core";
import { ConnectionPositionPair, OverlayRef } from "@angular/cdk/overlay";

export interface PopupRefParams {
    close: <R>(result?: R) => void;

    get beforeClose$(): Observable<PopupCloseEvent>;

    get closeStart$(): Observable<PopupCloseEvent>;

    get closed$(): Observable<PopupCloseEvent>;

    get component(): ComponentRef<any> | null;

    get opened$(): Observable<void>;

    get overlayRef(): OverlayRef;

    get positionChanges$(): Observable<ConnectionPositionPair>;
}
