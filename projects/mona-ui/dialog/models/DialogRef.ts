import type { ComponentRef } from "@angular/core";
import type { PopupCloseEvent, PopupRef } from "@nanahoshi/mona-ui/popup";
import type { Observable } from "rxjs";
import type { DialogActionEvent } from "./DialogActionEvent";
import type { DialogRefParams } from "./DialogRefParams";
import type { DialogResult } from "./DialogResult";
import type { DialogSettings } from "./DialogSettings";

/**
 * A handle on an open dialog. The close contract:
 * - `action$` emits when an action button is clicked, before the dialog closes; `preventDefault()` keeps it open.
 * - `close$` emits before any close, and `preventDefault()` keeps the dialog open.
 * - `result` emits how the dialog closed as soon as the close goes ahead, and `closed$` emits the same result once
 *   the dialog is gone. All of them complete when it closes.
 */
export class DialogRef<R = unknown> implements DialogRefParams<R> {
    #options: DialogRefParams<R>;
    public constructor(options: DialogRefParams<R>) {
        this.#options = options;
    }

    /**
     * @description Closes the dialog. The value is the `value` of the result, which reports the close as
     * programmatic.
     */
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

    /**
     * @description Emits when an action button is clicked, before the dialog closes. Call `preventDefault()` on
     * the event to keep the dialog open. Completes when the dialog closes.
     */
    public get action$(): Observable<DialogActionEvent> {
        return this.#options.action$;
    }

    /**
     * @description Emits before the dialog closes, whatever closes it. Call `preventDefault()` to keep it open.
     * Completes when the dialog closes.
     */
    public get close$(): Observable<PopupCloseEvent<R>> {
        return this.#options.close$;
    }

    /**
     * @description Emits the dialog's result once it has closed and its leave animation has finished, then
     * completes.
     */
    public get closed$(): Observable<DialogResult<R>> {
        return this.#options.closed$;
    }

    /**
     * @description The component given as `content`, or `null` for template and text content.
     */
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

    /**
     * @description Emits how the dialog closed (an action, the close button, Escape, a backdrop click or
     * `close()`) as soon as the close goes ahead, then completes when the dialog is gone. Late subscribers get the
     * result too.
     */
    public get result(): Observable<DialogResult<R>> {
        return this.#options.result;
    }

    public get width(): number {
        return this.#options.width;
    }
}
