import { asapScheduler, Observable } from "rxjs";
import { PopupCloseEvent } from "./PopupCloseEvent";
import { ComponentRef } from "@angular/core";
import { ConnectionPositionPair, OverlayRef } from "@angular/cdk/overlay";
import { PopupRefParams } from "./PopupRefParams";

export class PopupRef {
    #options: PopupRefParams;

    public constructor(options: PopupRefParams) {
        this.#options = options;
    }

    public close<R>(result?: R, delay?: number): void {
        this.#options.close(result, delay);
    }

    /**
     * Closes the popup after a delay.
     * When the popup is closed, the overlay element is removed from the DOM instantly.
     * This causes the animation of the child elements to not play, therefore,
     * a delay is added to allow the animation to play.
     *
     * @see {@link https://github.com/angular/angular/issues/23302} for more information.
     * @param delay delay in milliseconds
     * @param result optional result to pass to the closed observable
     */
    public closeWithDelay<R>(delay: number = 100, result?: R): void {
        asapScheduler.schedule(() => this.close(result), delay);
    }

    /**
     * @description Emitted when the popup is about to close.
     * This event can be prevented. If it is prevented, the popup will not close.
     */
    public get beforeClose(): Observable<PopupCloseEvent> {
        return this.#options.beforeClose$;
    }

    /**
     * @description Emitted when the popup begins closing, before the leave animation completes.
     * Subscribe to this to react at the moment the close sequence starts — for example, to begin
     * coordinating a transition in the consuming component. The `closed` observable fires after
     * the leave animation finishes.
     */
    public get closeStart(): Observable<PopupCloseEvent> {
        return this.#options.closeStart$;
    }

    /**
     * @description Emitted when the popup is closed.
     * This event is emitted after the animation completes.
     * Preventing this event has no effect.
     */
    public get closed(): Observable<PopupCloseEvent> {
        return this.#options.closed$;
    }

    /**
     * @description Reference to the component hosted in the popup.
     * This is `null` if the popup does not contain a component.
     */
    public get component(): ComponentRef<unknown> | null {
        return this.#options.component;
    }

    /**
     * @description Emitted when the popup is opened.
     */
    public get opened(): Observable<void> {
        return this.#options.opened$;
    }

    /**
     * @description Reference to the underlying CDK overlay.
     * Use this reference to manipulate the overlay directly, such as to set its size or position.
     * @see {@link https://material.angular.io/cdk/overlay/overview} for more information.
     * @example
     * ```ts
     * const overlayRef = popupRef.overlayRef;
     * overlayRef.updateSize({ width: '500px', height: '300px' });
     * ```
     */
    public get overlayRef(): OverlayRef {
        return this.#options.overlayRef;
    }

    /**
     * @description Returns the position pair of the popup's anchor element.
     * @example
     * ```ts
     * const positionChanges$ = popupRef.positionChanges;
     * positionChanges$.subscribe(pair => {
     *   console.log(`Popup position changed to: ${pair.originX} ${pair.originY} -> ${pair.overlayX} ${pair.overlayY}`);
     * });
     * ```
     */
    public get positionChanges(): Observable<ConnectionPositionPair> {
        return this.#options.positionChanges$;
    }
}
