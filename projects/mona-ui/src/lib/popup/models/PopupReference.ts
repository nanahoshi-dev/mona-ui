import { ConnectionPositionPair, OverlayRef } from "@angular/cdk/overlay";
import { ComponentRef } from "@angular/core";
import { asyncScheduler, Observable, ReplaySubject, Subject } from "rxjs";
import { Action } from "../../utils/Action";
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
    public wrapperComponentRef?: ComponentRef<any>;
    public readonly popupRef: PopupRef;
    #closed = false;
    #closing = false;

    public constructor(
        public readonly overlayReference: OverlayRef,
        private readonly preventClose?: Action<PopupCloseEvent, boolean>
    ) {
        this.popupRef = new PopupRef(this);
    }

    /**
     * Emits {@link beforeClosed$} exactly once and, unless the close is prevented (either by the
     * `preventClose` callback passed to the popup or by a subscriber calling `preventDefault()`
     * on the event), proceeds to close the popup.
     * @returns `true` if the close proceeded, `false` if it was prevented.
     */
    public close<R>(result?: R, delay?: number): boolean {
        if (this.#closing) {
            return false;
        }
        const beforeCloseEvent =
            result instanceof PopupCloseEvent
                ? result
                : new PopupCloseEvent({ result, via: PopupCloseSource.Programmatic });
        this.beforeClosed$.next(beforeCloseEvent);

        const prevented = this.preventClose
            ? this.preventClose(beforeCloseEvent) || beforeCloseEvent.isDefaultPrevented()
            : beforeCloseEvent.isDefaultPrevented();
        if (prevented) {
            return false;
        }
        this.#closing = true;
        this.closeStart$.next(beforeCloseEvent);

        if (delay != null) {
            if (delay > 0) {
                asyncScheduler.schedule(() => this.completeClose(beforeCloseEvent), delay);
            } else {
                this.completeClose(beforeCloseEvent);
            }
        } else if (this.wrapperComponentRef == null) {
            this.completeClose(beforeCloseEvent);
        }
        return true;
    }

    public notifyOpen(): void {
        this.opened$.next();
    }

    public completeClose(event: PopupCloseEvent): void {
        if (this.#closed) {
            return;
        }
        this.#closed = true;
        this.closed$.next(event);
        this.closed$.complete();
        this.positionChanges$.complete();
        this.overlayRef.dispose();
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
        return this.opened$;
    }

    public get overlayRef(): OverlayRef {
        return this.overlayReference;
    }
}
