import { ComponentRef, inject } from "@angular/core";
import { asapScheduler, map, Observable, Subject } from "rxjs";
import { PopupCloseSource } from "../../popup/models/PopupCloseEvent";
import { PopupRef } from "../../popup/models/PopupRef";
import { MoveEvent } from "./MoveEvent";
import { ResizeEvent } from "./ResizeEvent";
import { WindowCloseEvent } from "./WindowCloseEvent";
import { WindowRef } from "./WindowRef";
import { WindowReferenceOptions } from "./WindowReferenceOptions";
import { WindowRefParams } from "./WindowRefParams";

/**
 * @internal - used by WindowService. Do not export.
 */
export class WindowReference<R = unknown> implements WindowRefParams<R> {
    public readonly move$$: Subject<MoveEvent> = new Subject<MoveEvent>();
    public readonly moveEnd$$: Subject<void> = new Subject<void>();
    public readonly moveStart$$: Subject<void> = new Subject<void>();
    public readonly resize$$: Subject<ResizeEvent> = new Subject<ResizeEvent>();

    public constructor(private readonly options: WindowReferenceOptions) {}

    public center(): void {
        const width = this.options.popupRef.overlayRef.overlayElement.getBoundingClientRect().width;
        const height = this.options.popupRef.overlayRef.overlayElement.getBoundingClientRect().height;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;
        this.options.popupRef.overlayRef.overlayElement.style.left = `${left}px`;
        this.options.popupRef.overlayRef.overlayElement.style.top = `${top}px`;
    }

    public close(result?: R): void {
        const event =
            result instanceof WindowCloseEvent
                ? result
                : new WindowCloseEvent({ result, via: PopupCloseSource.Programmatic });
        this.options.popupRef.close(event);
    }

    public closeWithDelay(delay: number, result?: R): void {
        asapScheduler.schedule(() => this.close(result), delay);
    }

    public move(params: { top?: number; left?: number }): void {
        const top = params.top != null ? `${params.top}px` : ``;
        const left = params.left != null ? `${params.left}px` : ``;
        this.options.popupRef.overlayRef.overlayElement.style.top = top;
        this.options.popupRef.overlayRef.overlayElement.style.left = left;
    }

    public resize(params: { width?: number; height?: number; center?: boolean }): void {
        const width = params.width ? `${params.width}px` : ``;
        const height = params.height ? `${params.height}px` : ``;
        this.options.popupRef.overlayRef.overlayElement.style.width = width;
        this.options.popupRef.overlayRef.overlayElement.style.height = height;
        if (params.center) {
            asapScheduler.schedule(() => this.center());
        }
    }

    public get close$(): Observable<WindowCloseEvent> {
        return this.options.popupRef.closed.pipe(
            map(event => {
                if (event.type === "windowClose") {
                    return event;
                }
                return new WindowCloseEvent({ event, via: event.via, type: "windowClose", result: event.result });
            })
        );
    }

    public get component(): ComponentRef<any> | null {
        // The type of component is ComponentRef<WindowContentComponent>. It is set as any to avoid circular dependency.
        return (this.popupRef.component as ComponentRef<any>).instance.componentRef ?? null;
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
        return this.options.popupRef.overlayRef.overlayElement;
    }

    public get height(): number {
        return this.element.offsetHeight;
    }

    public get popupRef(): PopupRef {
        return this.options.popupRef;
    }

    public get resize$(): Observable<ResizeEvent> {
        return this.resize$$;
    }

    public get width(): number {
        return this.element.offsetWidth;
    }

    public get windowRef(): WindowRef<R> {
        return new WindowRef<R>(this);
    }
}
