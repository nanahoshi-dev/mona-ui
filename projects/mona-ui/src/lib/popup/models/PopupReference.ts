import { OverlayRef } from "@angular/cdk/overlay";
import { ComponentRef } from "@angular/core";
import { asyncScheduler, Observable, Subject } from "rxjs";
import { PopupCloseEvent, PopupCloseSource } from "./PopupCloseEvent";
import { PopupRef } from "./PopupRef";
import { PopupRefParams } from "./PopupRefParams";

/**
 * @internal - used by the popup service. Do not use directly or export.
 */
export class PopupReference implements PopupRefParams {
    public readonly beforeClosed$: Subject<PopupCloseEvent> = new Subject<PopupCloseEvent>();
    public readonly closed$: Subject<PopupCloseEvent> = new Subject<PopupCloseEvent>();
    public componentRef?: ComponentRef<any>;

    public constructor(public readonly overlayReference: OverlayRef) {}

    public close<R>(result?: R, delay: number = 300): void {
        this.beforeClosed$.next(new PopupCloseEvent({ result, via: PopupCloseSource.Programmatic }));
        const event =
            result instanceof PopupCloseEvent
                ? result
                : new PopupCloseEvent({ result, via: PopupCloseSource.Programmatic });
        this.closed$.next(event);
        this.closed$.complete();
        /**
         * A delay is added to allow animations to complete before the overlay is disposed.
         */
        asyncScheduler.schedule(() => this.overlayRef.dispose(), delay);
    }

    public get closed(): Observable<PopupCloseEvent> {
        return this.closed$.asObservable();
    }

    public get component(): ComponentRef<any> | null {
        return this.componentRef ?? null;
    }

    public get overlayRef(): OverlayRef {
        return this.overlayReference;
    }

    public get popupRef(): PopupRef {
        return new PopupRef(this);
    }
}
