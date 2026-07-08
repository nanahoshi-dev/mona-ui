import { Observable } from "rxjs";
import { PopupCloseEvent } from "@mirei/mona-ui/popup";
import { ResizeEvent } from "./ResizeEvent";
import { PopupRef } from "@mirei/mona-ui/popup";
import { MoveEvent } from "./MoveEvent";
import { ComponentRef } from "@angular/core";
import { WindowRefParams } from "./WindowRefParams";

export class WindowRef<R = unknown> implements WindowRefParams<R> {
    #options: WindowRefParams<R>;

    public constructor(options: WindowRefParams<R>) {
        this.#options = options;
    }

    public center(): void {
        this.#options.center();
    }

    public close(result?: R): void {
        this.#options.close(result);
    }

    public closeWithDelay(delay: number, result?: R): void {
        this.#options.closeWithDelay(delay, result);
    }

    public move(params: { top?: number; left?: number }): void {
        this.#options.move(params);
    }

    public resize(params: { width?: number; height?: number; center?: boolean }): void {
        this.#options.resize(params);
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

    public get drag$(): Observable<MoveEvent> {
        return this.#options.drag$;
    }

    public get dragEnd$(): Observable<void> {
        return this.#options.dragEnd$;
    }

    public get dragStart$(): Observable<void> {
        return this.#options.dragStart$;
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

    public get resize$(): Observable<ResizeEvent> {
        return this.#options.resize$;
    }

    public get width(): number {
        return this.#options.width;
    }
}
