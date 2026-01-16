import { ConnectionPositionPair, OverlayRef } from "@angular/cdk/overlay";
import { ComponentRef } from "@angular/core";
import { asyncScheduler, Observable, ReplaySubject, Subject, tap } from "rxjs";
import { PopupCloseEvent, PopupCloseSource } from "./PopupCloseEvent";
import { PopupRef } from "./PopupRef";
import { PopupRefParams } from "./PopupRefParams";

/**
 * @internal - used by the popup service. Do not use directly or export.
 */
export class PopupReference implements PopupRefParams {
    public readonly beforeClosed$ = new Subject<PopupCloseEvent>();
    public readonly closeStart$ = new Subject<PopupCloseEvent>();
    public readonly closed$ = new Subject<PopupCloseEvent>();
    public readonly opened$ = new ReplaySubject<void>(1);
    public readonly positionChanges$ = new Subject<ConnectionPositionPair>();
    public componentRef?: ComponentRef<any>;

    public constructor(public readonly overlayReference: OverlayRef) {}

    public close<R>(result?: R, delay: number = 190): void {
        const beforeCloseEvent = new PopupCloseEvent({ result, via: PopupCloseSource.Programmatic });
        this.beforeClosed$.next(beforeCloseEvent);

        if (beforeCloseEvent.isDefaultPrevented()) {
            return;
        }
        this.closeStart$.next(beforeCloseEvent);
        const event =
            result instanceof PopupCloseEvent
                ? result
                : new PopupCloseEvent({ result, via: PopupCloseSource.Programmatic });

        /**
         * A delay is added to allow animations to complete before the overlay is disposed of.
         */
        asyncScheduler.schedule(() => {
            // TODO: Add an event where close is triggered but animation is not yet complete.
            this.closed$.next(event);
            this.closed$.complete();
            this.positionChanges$.complete();
            this.overlayRef.dispose();
        }, delay);
    }

    public notifyOpen(): void {
        this.opened$.next();
    }

    public get beforeClose$(): Observable<PopupCloseEvent> {
        return this.beforeClosed$.asObservable();
    }

    public get closeStart(): Observable<PopupCloseEvent> {
        return this.closeStart$.asObservable();
    }

    public get closed(): Observable<PopupCloseEvent> {
        return this.closed$.asObservable();
    }

    public get component(): ComponentRef<any> | null {
        return this.componentRef ?? null;
    }

    public get opened(): Observable<void> {
        return this.opened$.pipe(tap(e => console.log("FFF: ", e)));
    }

    public get overlayRef(): OverlayRef {
        return this.overlayReference;
    }

    public get popupRef(): PopupRef {
        return new PopupRef(this);
    }
}
