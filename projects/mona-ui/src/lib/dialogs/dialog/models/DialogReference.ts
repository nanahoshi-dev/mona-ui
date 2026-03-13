import { ComponentRef } from "@angular/core";
import { map, Observable, Subject } from "rxjs";
import { PopupCloseEvent, PopupCloseSource } from "../../../popup/models/PopupCloseEvent";
import { PopupRef } from "../../../popup/models/PopupRef";
import { DialogRef } from "./DialogRef";
import { DialogReferenceOptions } from "./DialogReferenceOptions";
import { DialogRefParams } from "./DialogRefParams";
import { DialogResult } from "./DialogResult";

export class DialogReference<R = unknown> implements DialogRefParams<R> {
    public readonly dialogResult$ = new Subject<DialogResult>();
    readonly #dialogRef: DialogRef<R>;
    public constructor(private readonly options: DialogReferenceOptions) {
        this.#dialogRef = new DialogRef<R>(this);
    }

    public close(result?: R): void {
        const event =
            result instanceof PopupCloseEvent
                ? result
                : new PopupCloseEvent({ result, via: PopupCloseSource.Programmatic });
        this.#popupRefOrThrow.close(event);
    }

    public initializePopupRef(popupRef: PopupRef): void {
        this.options.popupRef = popupRef;
    }

    public get close$(): Observable<PopupCloseEvent<R>> {
        return this.#popupRefOrThrow.beforeClose.pipe(map(event => event as PopupCloseEvent<R>));
    }

    public get closed$(): Observable<void> {
        return this.#popupRefOrThrow.closed.pipe(map(() => undefined));
    }

    public get component(): ComponentRef<unknown> | null {
        return (
            (this.#popupRefOrThrow.component as ComponentRef<{ componentRef: ComponentRef<unknown> }>).instance
                .componentRef ?? null
        );
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
        if (!this.options.popupRef) {
            throw new Error("DialogReference: popupRef has not been initialized.");
        }
        return this.options.popupRef;
    }

    public get result(): Observable<DialogResult> {
        return this.dialogResult$;
    }

    public get width(): number {
        return this.element.offsetWidth;
    }
}
