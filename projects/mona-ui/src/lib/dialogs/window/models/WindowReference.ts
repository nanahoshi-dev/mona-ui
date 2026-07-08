import { ComponentRef } from "@angular/core";
import { asapScheduler, map, Observable, Subject } from "rxjs";
import { PopupCloseEvent, PopupCloseSource } from "@mirei/mona-ui/popup";
import { PopupRef } from "@mirei/mona-ui/popup";
import { DefaultMaxWindowHeight, DefaultMaxWindowWidth } from "../utils/defaults";
import { MoveEvent } from "./MoveEvent";
import { ResizeEvent } from "./ResizeEvent";
import { WindowRef } from "./WindowRef";
import { WindowReferenceOptions } from "./WindowReferenceOptions";
import { WindowRefParams } from "./WindowRefParams";

/**
 * @internal - used by WindowService. Do not export.
 */
export class WindowReference<R = unknown> implements WindowRefParams<R> {
    readonly #windowRef: WindowRef<R>;
    public readonly move$$: Subject<MoveEvent> = new Subject<MoveEvent>();
    public readonly moveEnd$$: Subject<void> = new Subject<void>();
    public readonly moveStart$$: Subject<void> = new Subject<void>();
    public readonly resize$$: Subject<ResizeEvent> = new Subject<ResizeEvent>();

    public constructor(
        private readonly options: WindowReferenceOptions,
        private readonly document: Document
    ) {
        this.#windowRef = new WindowRef<R>(this);
    }

    public center(): void {
        const element = this.#popupRefOrThrow.overlayRef.overlayElement;
        const width = element.getBoundingClientRect().width;
        const height = element.getBoundingClientRect().height;
        const left = (this.document.defaultView?.innerWidth || DefaultMaxWindowWidth - width) / 2;
        const top = (this.document.defaultView?.innerHeight || DefaultMaxWindowHeight - height) / 2;
        element.style.left = `${left}px`;
        element.style.top = `${top}px`;
    }

    public close(result?: R): void {
        const event =
            result instanceof PopupCloseEvent
                ? result
                : new PopupCloseEvent({ result, via: PopupCloseSource.Programmatic });
        this.#popupRefOrThrow.close(event);
    }

    public closeWithDelay(delay: number, result?: R): void {
        asapScheduler.schedule(() => this.close(result), delay);
    }

    public initializePopupRef(popupRef: PopupRef): void {
        this.options.popupRef = popupRef;
    }

    public move(params: { top?: number; left?: number }): void {
        const element = this.#popupRefOrThrow.overlayRef.overlayElement;
        const top = params.top != null ? `${params.top}px` : ``;
        const left = params.left != null ? `${params.left}px` : ``;
        element.style.top = top;
        element.style.left = left;
    }

    public resize(params: { width?: number; height?: number; center?: boolean }): void {
        const element = this.#popupRefOrThrow.overlayRef.overlayElement;
        const width = params.width ? `${params.width}px` : ``;
        const height = params.height ? `${params.height}px` : ``;
        element.style.width = width;
        element.style.height = height;
        if (params.center) {
            asapScheduler.schedule(() => this.center());
        }
    }

    public get close$(): Observable<PopupCloseEvent<R>> {
        return this.#popupRefOrThrow.beforeClose.pipe(map(event => event as PopupCloseEvent<R>));
    }

    public get closed$(): Observable<void> {
        return this.#popupRefOrThrow.closed.pipe(map(() => undefined));
    }

    public get component(): ComponentRef<unknown> | null {
        // The type of component is ComponentRef<WindowContentComponent>. It is set as unknown to avoid circular dependency.
        return (this.popupRef.component as ComponentRef<{ componentRef: ComponentRef<unknown> }>).instance.componentRef ?? null;
    }

    public get drag$(): Observable<MoveEvent> {
        return this.move$$;
    }

    public get dragEnd$(): Observable<void> {
        return this.moveEnd$$;
    }

    public get dragStart$(): Observable<void> {
        return this.moveStart$$;
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

    public get resize$(): Observable<ResizeEvent> {
        return this.resize$$;
    }

    public get width(): number {
        return this.element.offsetWidth;
    }

    public get windowRef(): WindowRef<R> {
        return this.#windowRef;
    }

    get #popupRefOrThrow(): PopupRef {
        if (!this.options.popupRef) {
            throw new Error("WindowReference: popupRef has not been initialized.");
        }
        return this.options.popupRef;
    }
}
