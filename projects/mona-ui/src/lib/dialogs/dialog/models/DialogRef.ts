import { ComponentRef } from "@angular/core";
import { Observable } from "rxjs";
import { PopupCloseEvent } from "../../../popup/models/PopupCloseEvent";
import { PopupRef } from "../../../popup/models/PopupRef";
import { DialogRefParams } from "./DialogRefParams";
import { DialogResult } from "./DialogResult";
import { DialogSettings } from "./DialogSettings";

export class DialogRef<R = unknown> implements DialogRefParams<R> {
    #options: DialogRefParams<R>;
    public constructor(options: DialogRefParams<R>) {
        this.#options = options;
    }

    public close(result?: R): void {
        this.#options.close(result);
    }

    /**
     * @description Updates the dialog's content and appearance in place without closing and reopening it.
     * Only the fields provided are changed; anything omitted keeps its current value.
     */
    public update(data: Partial<DialogSettings>): void {
        this.#options.update(data);
    }

    public get close$(): Observable<PopupCloseEvent<R>> {
        return this.#options.close$;
    }

    public get closed$(): Observable<void> {
        return this.#options.closed$;
    }

    public get component(): ComponentRef<unknown> | null {
        return this.#options.component;
    }

    public get element(): HTMLElement {
        return this.#options.element;
    }

    public get height(): number {
        return this.#options.height;
    }

    public get popupRef(): PopupRef {
        return this.#options.popupRef;
    }

    public get result(): Observable<DialogResult> {
        return this.#options.result;
    }

    public get width(): number {
        return this.#options.width;
    }
}
