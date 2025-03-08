import { AnimationBuilder } from "@angular/animations";
import { ConnectionPositionPair, Overlay, PositionStrategy } from "@angular/cdk/overlay";
import { ComponentPortal } from "@angular/cdk/portal";
import { DestroyRef, inject, Injectable, Injector, TemplateRef } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Dictionary } from "@mirei/ts-collections";
import { defaultPopupHideAnimation, defaultPopupShowAnimation } from "mona-ui/popup/animations/popup.animation";
import { ConnectionPoint, connectionPosition } from "mona-ui/popup/utils/connectionPosition";
import { filter, fromEvent, Subject, Subscription, take, takeUntil, tap } from "rxjs";
import { v4 } from "uuid";
import { PopupWrapperComponent } from "../components/popup-wrapper/popup-wrapper.component";
import { PopupCloseEvent, PopupCloseSource } from "../models/PopupCloseEvent";
import { PopupDataInjectionToken, PopupSettingsInjectionToken } from "../models/PopupInjectionToken";
import { PopupRef } from "../models/PopupRef";
import { PopupReference } from "../models/PopupReference";
import { PopupAnimationSettings, PopupSettings } from "../models/PopupSettings";
import { PopupState } from "../models/PopupState";

@Injectable({
    providedIn: "root"
})
export class PopupService {
    readonly #animationBuilder = inject(AnimationBuilder);
    readonly #destroyRef: DestroyRef = inject(DestroyRef);
    readonly #injector: Injector = inject(Injector);
    readonly #overlay: Overlay = inject(Overlay);
    readonly #outsideEventsToClose = ["click", "mousedown", "dblclick", "contextmenu", "auxclick"];
    readonly #popupStateMap = new Dictionary<string, PopupState>();

    public create(settings: PopupSettings): PopupRef {
        const uid = v4();
        let positionStrategy: PositionStrategy;
        const position = this.getPosition(settings.anchorConnectionPoint, settings.popupConnectionPoint);

        if (settings.positionStrategy === "global") {
            positionStrategy = this.#overlay.position().global();
        } else {
            positionStrategy = this.#overlay
                .position()
                .flexibleConnectedTo(settings.anchor)
                .withPositions(position)
                .withDefaultOffsetX(settings.offset?.horizontal ?? 0)
                .withDefaultOffsetY(settings.offset?.vertical ?? 0)
                .withPush(settings.withPush ?? true);
        }

        const panelClass = settings.popupClass
            ? ["mona-popup-content"].concat(settings.popupClass)
            : "mona-popup-content";

        const overlayRef = this.#overlay.create({
            positionStrategy,
            hasBackdrop: settings.hasBackdrop ?? false,
            height: settings.height,
            maxHeight: settings.maxHeight,
            maxWidth: settings.maxWidth,
            minHeight: settings.minHeight,
            minWidth: settings.minWidth,
            width: settings.width,
            panelClass,
            backdropClass: settings.backdropClass ?? "transparent"
        });

        const preventClose = settings.preventClose;
        const popupReference = new PopupReference(overlayRef);

        const injector = Injector.create({
            parent: this.#injector,
            providers: [
                { provide: PopupRef, useFactory: () => popupReference.popupRef },
                { provide: PopupDataInjectionToken, useValue: settings.data },
                { provide: PopupSettingsInjectionToken, useValue: settings },
                ...(settings.providers ?? [])
            ]
        });

        let animationElement: HTMLElement;
        if (settings.content instanceof TemplateRef) {
            const portal = new ComponentPortal(PopupWrapperComponent, null, injector);
            popupReference.componentRef = overlayRef.attach(portal);
            const component = popupReference.componentRef.instance as PopupWrapperComponent;
            component.templateRef.set(settings.content);
            animationElement = popupReference.componentRef.location.nativeElement;
            popupReference.componentRef.changeDetectorRef.detectChanges();
        } else {
            const portal = new ComponentPortal(settings.content, null, injector);
            popupReference.componentRef = overlayRef.attach(portal);
            animationElement = popupReference.componentRef.location.nativeElement;
        }
        this.setAnimations(settings.animation, animationElement, popupReference);

        let subscription: Subscription | null = null;
        if (settings.hasBackdrop) {
            if (settings.closeOnBackdropClick ?? true) {
                const backdropSubject = new Subject<void>();
                subscription = overlayRef
                    .backdropClick()
                    .pipe(takeUntil(backdropSubject))
                    .subscribe(e => {
                        const event = new PopupCloseEvent({
                            event: e,
                            originalEvent: e,
                            via: PopupCloseSource.BackdropClick
                        });
                        const prevented = preventClose ? preventClose(event) || event.isDefaultPrevented() : false;
                        if (!prevented) {
                            popupReference.close(event);
                            this.#popupStateMap.remove(uid);
                            backdropSubject.next();
                            backdropSubject.complete();
                        }
                    });
            }
        } else if (settings.closeOnOutsideClick ?? true) {
            subscription = overlayRef
                .outsidePointerEvents()
                .pipe(takeUntilDestroyed(this.#destroyRef))
                .subscribe(event => {
                    const eventTarget = event.target as HTMLElement;
                    if (settings.anchor instanceof HTMLElement && settings.anchor.contains(eventTarget)) {
                        return;
                    }
                    if (this.#outsideEventsToClose.includes(event.type)) {
                        const closeEvent = new PopupCloseEvent({
                            event,
                            originalEvent: event,
                            via: PopupCloseSource.OutsideClick
                        });
                        const prevented = preventClose
                            ? preventClose(closeEvent) || closeEvent.isDefaultPrevented()
                            : false;
                        if (!prevented) {
                            popupReference.close(closeEvent);
                            this.#popupStateMap.remove(uid);
                            subscription?.unsubscribe();
                        }
                    }
                });
        }
        popupReference.closed.pipe(take(1)).subscribe(() => {
            subscription?.unsubscribe();
            this.#popupStateMap.remove(uid);
            if (settings.anchor instanceof HTMLElement) {
                settings.anchor.focus();
            }
        });
        this.#popupStateMap.add(uid, {
            uid,
            popupRef: popupReference.popupRef,
            settings
        });
        this.setEventListeners(this.#popupStateMap.get(uid) as PopupState);
        return popupReference.popupRef;
    }

    private getAnimationConfig(config?: boolean | PopupAnimationSettings): Required<PopupAnimationSettings> | null {
        if (config === undefined) {
            return { hide: defaultPopupHideAnimation, show: defaultPopupShowAnimation };
        }
        if (typeof config === "boolean") {
            return config ? { hide: defaultPopupHideAnimation, show: defaultPopupShowAnimation } : null;
        }
        return {
            hide: config.hide ?? defaultPopupHideAnimation,
            show: config.show ?? defaultPopupShowAnimation
        };
    }

    private getPosition(
        anchorConnectionPoint?: ConnectionPoint,
        popupConnectionPoint?: ConnectionPoint
    ): ConnectionPositionPair[] {
        const anchorPoint = anchorConnectionPoint ?? "bottomleft";
        const popupPoint = popupConnectionPoint ?? "topright";
        return connectionPosition(anchorPoint, popupPoint);
    }

    private setAnimations(
        animationSettings: PopupAnimationSettings | boolean | undefined,
        element: HTMLElement,
        popupReference: PopupReference
    ): void {
        const config = this.getAnimationConfig(animationSettings);
        if (!config) {
            return;
        }
        if (config && element) {
            this.#animationBuilder.build(config.show).create(element).play();
            popupReference.beforeClosed$
                .pipe(
                    take(1),
                    tap(() => this.#animationBuilder.build(config.hide).create(element).play())
                )
                .subscribe();
        }
    }

    private setEventListeners(state: PopupState): void {
        if (state.settings.closeOnEscape === false) {
            return;
        }
        fromEvent<KeyboardEvent>(document, "keydown")
            .pipe(
                filter(() => state.popupRef.overlayRef.hasAttached()),
                filter(event => event.key === "Escape"),
                takeUntil(state.popupRef.closed)
            )
            .subscribe(event => {
                if (event.key === "Escape") {
                    const closeEvent = new PopupCloseEvent({
                        event,
                        originalEvent: event,
                        via: PopupCloseSource.Escape
                    });
                    const prevented = state.settings.preventClose
                        ? state.settings.preventClose(closeEvent) || closeEvent.isDefaultPrevented()
                        : false;
                    if (!prevented) {
                        state.popupRef.close(closeEvent);
                        this.#popupStateMap.remove(state.uid);
                    }
                }
            });
    }
}
