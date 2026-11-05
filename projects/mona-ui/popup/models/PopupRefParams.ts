import { type ConnectionPositionPair, type OverlayRef } from "@angular/cdk/overlay";
import { type ComponentRef } from "@angular/core";
import { type Observable } from "rxjs";
import { type PopupCloseEvent } from "./PopupCloseEvent";

export interface PopupRefParams {
    get beforeClose$(): Observable<PopupCloseEvent>;

    close: <R>(result?: R, delay?: number) => boolean;

    get closeStart$(): Observable<PopupCloseEvent>;

    get closed$(): Observable<PopupCloseEvent>;

    get component(): ComponentRef<unknown> | null;

    get opened$(): Observable<void>;

    get overlayRef(): OverlayRef;

    get positionChanges$(): Observable<ConnectionPositionPair>;
}
