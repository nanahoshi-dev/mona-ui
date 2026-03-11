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
    public constructor(private readonly options: DialogReferenceOptions) {}

    public close(result?: R): void {
        const event =
            result instanceof PopupCloseEvent
                ? result
                : new PopupCloseEvent({ result, via: PopupCloseSource.Programmatic });
        this.options.popupRef.close(event);
    }

    public get close$(): Observable<PopupCloseEvent<R>> {
        return this.options.popupRef.beforeClose.pipe(map(event => event as PopupCloseEvent<R>));
    }

    public get closed$(): Observable<void> {
        return this.options.popupRef.closed.pipe(map(() => undefined));
    }

    public get component(): ComponentRef<any> | null {
        return (this.popupRef.component as ComponentRef<any>).instance.componentRef ?? null;
    }

    public get dialogRef(): DialogRef<R> {
        return new DialogRef<R>(this);
    }

    public get element(): HTMLElement {
        return this.options.popupRef.overlayRef.overlayElement;
    }

    public get height(): number {
        return this.element.offsetHeight;
    }

    public get popupRef(): PopupRef {
        return this.options.popupRef;
    }

    public get result(): Observable<DialogResult> {
        return this.dialogResult$;
    }

    public get width(): number {
        return this.element.offsetWidth;
    }
}
