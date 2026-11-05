import { type ComponentRef, signal, type WritableSignal } from "@angular/core";
import { PopupCloseEvent, PopupCloseSource, type PopupRef } from "@nanahoshi/mona-ui/popup";
import { map, merge, type Observable, ReplaySubject, Subject, take, takeUntil } from "rxjs";
import type { DialogAction } from "./DialogAction";
import { DialogActionEvent } from "./DialogActionEvent";
import type { DialogInjectorData } from "./DialogInjectorData";
import { DialogRef } from "./DialogRef";
import type { DialogReferenceOptions } from "./DialogReferenceOptions";
import type { DialogRefParams } from "./DialogRefParams";
import type { DialogResult } from "./DialogResult";
import type { DialogSettings } from "./DialogSettings";

/**
 * @internal The dialog's own side of `DialogRef`: action buttons and the close button report here, so a dialog
 * opened through `DialogService` and one declared with `<mona-dialog>` close the same way.
 */
export class DialogReference<R = unknown> implements DialogRefParams<R> {
    readonly #action$ = new Subject<DialogActionEvent>();
    readonly #closed$ = new ReplaySubject<DialogResult<R>>(1);
    readonly #dialogRef: DialogRef<R>;
    readonly #options: DialogReferenceOptions;
    readonly #result$ = new ReplaySubject<DialogResult<R>>(1);
    #pendingAction: DialogAction | null = null;
    #resultValue: DialogResult<R> | null = null;
    public readonly data: WritableSignal<DialogInjectorData>;
    public constructor(options: DialogReferenceOptions, initialData: DialogInjectorData) {
        this.#options = options;
        this.#dialogRef = new DialogRef<R>(this);
        this.data = signal(initialData);
    }

    public close(result?: R): void {
        const event =
            result instanceof PopupCloseEvent
                ? result
                : new PopupCloseEvent({ result, via: PopupCloseSource.Programmatic });
        this.#popupRefOrThrow.close(event);
    }

    public initializePopupRef(popupRef: PopupRef): void {
        this.#options.popupRef = popupRef;
        popupRef.closeStart.pipe(take(1)).subscribe(event => this.#settle(event));
        popupRef.closed.pipe(take(1)).subscribe(event => {
            const result = this.#settle(event);
            this.#result$.complete();
            this.#action$.complete();
            this.#closed$.next(result);
            this.#closed$.complete();
        });
    }

    /**
     * Reports a click on an action button: `action$` first, where it can be prevented, then the close.
     */
    public requestAction(action: DialogAction): void {
        const event = new DialogActionEvent(action);
        this.#action$.next(event);
        if (event.isDefaultPrevented()) {
            return;
        }
        this.#pendingAction = action;
        if (!this.#popupRefOrThrow.close(new PopupCloseEvent({ via: PopupCloseSource.Action }))) {
            this.#pendingAction = null;
        }
    }

    /**
     * Reports a click on the close button.
     */
    public requestClose(): void {
        this.#popupRefOrThrow.close(new PopupCloseEvent({ via: PopupCloseSource.CloseButton }));
    }

    public setComponentRef(componentRef: ComponentRef<unknown> | undefined): void {
        this.#options.componentRef = componentRef;
    }

    public update(data: Partial<DialogSettings>): void {
        this.data.update(current => ({ ...current, ...data }));
    }

    /** Works out the result once, when the close goes ahead, and publishes it on `result`. */
    #settle(event: PopupCloseEvent): DialogResult<R> {
        if (this.#resultValue) {
            return this.#resultValue;
        }
        const action = this.#pendingAction;
        const result: DialogResult<R> =
            action && event.via === PopupCloseSource.Action
                ? { action, via: PopupCloseSource.Action, viaClose: false }
                : {
                      value: event.result as R | undefined,
                      via:
                          event.via == null || event.via === PopupCloseSource.Action
                              ? PopupCloseSource.Programmatic
                              : event.via,
                      viaClose: true
                  };
        this.#resultValue = result;
        this.#result$.next(result);
        return result;
    }

    public get action$(): Observable<DialogActionEvent> {
        return this.#action$.asObservable();
    }

    public get close$(): Observable<PopupCloseEvent<R>> {
        const popupRef = this.#popupRefOrThrow;
        return popupRef.beforeClose.pipe(
            takeUntil(merge(popupRef.closed, this.#closed$).pipe(take(1))),
            map(event => event as PopupCloseEvent<R>)
        );
    }

    public get closed$(): Observable<DialogResult<R>> {
        return this.#closed$.asObservable();
    }

    public get component(): ComponentRef<unknown> | null {
        return this.#options.componentRef ?? null;
    }

    public get dialogRef(): DialogRef<R> {
        return this.#dialogRef;
    }

    public get element(): HTMLElement {
        return this.#popupRefOrThrow.overlayRef.overlayElement;
    }

    public get height(): number {
        return this.element.offsetHeight;
    }

    public get popupRef(): PopupRef {
        return this.#popupRefOrThrow;
    }

    get #popupRefOrThrow(): PopupRef {
        if (!this.#options.popupRef) {
            throw new Error("DialogReference: popupRef has not been initialized.");
        }
        return this.#options.popupRef;
    }

    public get result(): Observable<DialogResult<R>> {
        return this.#result$.asObservable();
    }

    public get width(): number {
        return this.element.offsetWidth;
    }
}
