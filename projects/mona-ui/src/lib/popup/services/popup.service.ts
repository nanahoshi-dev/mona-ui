import { AnimationBuilder } from "@angular/animations";
import {
    ComponentType,
    ConnectionPositionPair,
    FlexibleConnectedPositionStrategy,
    FlexibleConnectedPositionStrategyOrigin,
    Overlay,
    OverlayRef,
    PositionStrategy
} from "@angular/cdk/overlay";
import { ComponentPortal } from "@angular/cdk/portal";
import { CdkScrollable, ScrollDispatcher } from "@angular/cdk/scrolling";
import { DestroyRef, inject, Injectable, Injector, TemplateRef } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { exhaustMap, filter, fromEvent, Subject, Subscription, take, takeUntil, tap } from "rxjs";
import { defaultPopupHideAnimation, defaultPopupShowAnimation } from "../animations/popup.animation";
import { PopupWrapperComponent } from "../components/popup-wrapper/popup-wrapper.component";
import { PopupCloseEvent, PopupCloseSource } from "../models/PopupCloseEvent";
import { PopupDataInjectionToken, PopupSettingsInjectionToken } from "../models/PopupInjectionToken";
import { PopupRef } from "../models/PopupRef";
import { PopupReference } from "../models/PopupReference";
import { PopupAnchor, PopupAnimationSettings, PopupSettings } from "../models/PopupSettings";
import { ConnectionPoint, connectionPosition } from "../utils/connectionPosition";

@Injectable({
    providedIn: "root"
})
export class PopupService {
    readonly #animationBuilder = inject(AnimationBuilder);
    readonly #destroyRef = inject(DestroyRef);
    readonly #injector = inject(Injector);
    readonly #outsideEventsToClose = ["click", "mousedown", "dblclick", "contextmenu", "auxclick"];
    readonly #overlay = inject(Overlay);
    readonly #selectorSubscriptions = new Map<string, Subscription[]>();
    readonly #scrollDispatcher = inject(ScrollDispatcher);

    public create(settings: PopupSettings): PopupRef {
        if (typeof settings.anchor === "string") {
            return this.createMultiElementPopup(settings);
        }
        return this.createSingleElementPopup(settings);
    }

    private attachComponentContent(
        settings: PopupSettings,
        popupReference: PopupReference,
        overlayRef: OverlayRef,
        injector: Injector
    ): HTMLElement {
        const portal = new ComponentPortal(settings.content as ComponentType<any>, null, injector);
        popupReference.componentRef = overlayRef.attach(portal);
        return popupReference.componentRef.location.nativeElement;
    }

    private attachContent(
        settings: PopupSettings,
        popupReference: PopupReference,
        overlayRef: OverlayRef,
        injector: Injector
    ): HTMLElement {
        if (settings.content instanceof TemplateRef) {
            return this.attachTemplateContent(settings, popupReference, overlayRef, injector);
        }
        return this.attachComponentContent(settings, popupReference, overlayRef, injector);
    }

    private attachTemplateContent(
        settings: PopupSettings,
        popupReference: PopupReference,
        overlayRef: OverlayRef,
        injector: Injector
    ): HTMLElement {
        const portal = new ComponentPortal(PopupWrapperComponent, null, injector);
        popupReference.componentRef = overlayRef.attach(portal);
        const component = popupReference.componentRef.instance as PopupWrapperComponent;
        component.templateRef.set(settings.content as TemplateRef<any>);
        popupReference.componentRef.changeDetectorRef.detectChanges();
        return popupReference.componentRef.location.nativeElement;
    }

    private buildPanelClass(popupClass?: string | string[]): string | string[] {
        if (!popupClass) {
            return "mona-popup-content";
        }
        return ["mona-popup-content"].concat(popupClass);
    }

    private cleanupEventDelegation(selector: string): void {
        const subscriptions = this.#selectorSubscriptions.get(selector);
        if (subscriptions) {
            subscriptions.forEach(sub => sub.unsubscribe());
            this.#selectorSubscriptions.delete(selector);
        }
    }

    private createInjector(settings: PopupSettings, popupReference: PopupReference): Injector {
        return Injector.create({
            parent: this.#injector,
            providers: [
                { provide: PopupRef, useFactory: () => popupReference.popupRef },
                { provide: PopupDataInjectionToken, useValue: settings.data },
                { provide: PopupSettingsInjectionToken, useValue: settings },
                ...(settings.providers ?? [])
            ]
        });
    }

    private createMultiElementPopup(settings: PopupSettings): PopupRef {
        const selector = settings.anchor as string;

        // Create a virtual PopupRef that manages multi-element interactions
        const virtualOverlayRef = this.#overlay.create({ hasBackdrop: false });
        const virtualPopupReference = new PopupReference(virtualOverlayRef);

        // Set up event delegation internally
        this.setupInternalEventDelegation(selector, settings);

        // Clean up when the virtual popup is closed
        virtualPopupReference.popupRef.closed.subscribe(() => {
            this.cleanupEventDelegation(selector);
        });

        return virtualPopupReference.popupRef;
    }

    private createOverlay(settings: PopupSettings): OverlayRef {
        const positionStrategy = this.createPositionStrategy(settings);
        const panelClass = this.buildPanelClass(settings.popupClass);

        return this.#overlay.create({
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
    }

    private createPositionStrategy(settings: PopupSettings): PositionStrategy {
        if (settings.positionStrategy === "global") {
            return this.#overlay.position().global();
        }

        const resolvedAnchor = this.resolveAnchor(settings.anchor);

        const position = this.getPosition(settings.anchorConnectionPoint, settings.popupConnectionPoint);
        const strategy = this.#overlay
            .position()
            .flexibleConnectedTo(resolvedAnchor)
            .withPositions(position)
            .withDefaultOffsetX(settings.offset?.horizontal ?? 0)
            .withDefaultOffsetY(settings.offset?.vertical ?? 0)
            .withPush(settings.withPush ?? true);

        if (settings.withScrollTracking ?? true) {
            const scrollableContainers = this.getScrollableContainers(resolvedAnchor);
            strategy.withScrollableContainers(scrollableContainers);
        }

        return strategy;
    }

    private createSingleElementPopup(settings: PopupSettings): PopupRef {
        const overlayRef = this.createOverlay(settings);
        const popupReference = new PopupReference(overlayRef);

        const injector = this.createInjector(settings, popupReference);
        const animationElement = this.attachContent(settings, popupReference, overlayRef, injector);

        this.setupAnimations(settings.animation, animationElement, popupReference);
        const subscription = this.setupCloseSubscriptions(settings, popupReference, overlayRef);
        this.setupCleanupSubscription(popupReference, subscription, settings);
        this.setupScrollTracking(settings, overlayRef, popupReference);
        this.setupEscapeKeyListener(settings, popupReference);
        this.setupPositionChangeTracking(settings, overlayRef, popupReference);

        return popupReference.popupRef;
    }

    private getAnchorElement(anchor: PopupAnchor): HTMLElement | null {
        if (anchor instanceof HTMLElement) {
            return anchor;
        }
        if (typeof anchor === "object" && "nativeElement" in anchor && anchor.nativeElement instanceof HTMLElement) {
            return anchor.nativeElement;
        }
        return null;
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

    private getScrollableContainers(anchor: FlexibleConnectedPositionStrategyOrigin): CdkScrollable[] {
        const scrollables: CdkScrollable[] = [];
        if (anchor instanceof HTMLElement) {
            const ancestorScrollables = this.#scrollDispatcher.getAncestorScrollContainers(anchor);
            scrollables.push(...ancestorScrollables);
        }
        return scrollables;
    }

    /**
     * Resolves a PopupAnchor to a FlexibleConnectedPositionStrategyOrigin.
     * This method should only receive actual elements or ElementRefs, not CSS selector strings.
     * CSS selectors are handled by the multi-element popup creation path.
     * @param anchor The anchor to resolve (should be Element or ElementRef)
     * @returns The resolved anchor
     */
    private resolveAnchor(anchor: PopupAnchor): FlexibleConnectedPositionStrategyOrigin {
        if (typeof anchor === "string") {
            throw new Error(
                `CSS selector "${anchor}" should not reach resolveAnchor(). ` +
                    `CSS selectors should be handled by createMultiElementPopup().`
            );
        }
        return anchor;
    }

    private restoreFocusToAnchor(anchor: PopupAnchor): void {
        if (typeof anchor === "string") {
            return;
        }
        const resolvedAnchor = this.resolveAnchor(anchor);
        const anchorElement = this.getAnchorElement(resolvedAnchor);
        if (anchorElement) {
            anchorElement.focus();
        }
    }

    private setupAnimations(
        animationSettings: PopupAnimationSettings | boolean | undefined,
        element: HTMLElement,
        popupReference: PopupReference
    ): void {
        const config = this.getAnimationConfig(animationSettings);
        if (!config || !element) {
            return;
        }

        this.#animationBuilder.build(config.show).create(element).play();
        popupReference.beforeClosed$
            .pipe(
                take(1),
                tap(() => this.#animationBuilder.build(config.hide).create(element).play())
            )
            .subscribe();
    }

    private setupBackdropCloseSubscription(
        settings: PopupSettings,
        popupReference: PopupReference,
        overlayRef: OverlayRef
    ): Subscription | null {
        if (!(settings.closeOnBackdropClick ?? true)) {
            return null;
        }

        const backdropSubject = new Subject<void>();
        return overlayRef
            .backdropClick()
            .pipe(takeUntil(backdropSubject))
            .subscribe(e => {
                const event = new PopupCloseEvent({
                    event: e,
                    originalEvent: e,
                    via: PopupCloseSource.BackdropClick
                });

                if (this.shouldPreventClose(settings.preventClose, event)) {
                    return;
                }

                popupReference.close(event);
                backdropSubject.next();
                backdropSubject.complete();
            });
    }

    private setupCleanupSubscription(
        popupReference: PopupReference,
        subscription: Subscription | null,
        settings: PopupSettings
    ): void {
        popupReference.closed.pipe(take(1)).subscribe(() => {
            subscription?.unsubscribe();
            this.restoreFocusToAnchor(settings.anchor);
        });
    }

    private setupCloseSubscriptions(
        settings: PopupSettings,
        popupReference: PopupReference,
        overlayRef: OverlayRef
    ): Subscription | null {
        const subscriptions: Subscription[] = [];

        if (settings.hasBackdrop) {
            const backdropSub = this.setupBackdropCloseSubscription(settings, popupReference, overlayRef);
            if (backdropSub) subscriptions.push(backdropSub);
        }

        if (settings.closeOnOutsideClick ?? true) {
            const outsideClickSub = this.setupOutsideClickSubscription(settings, popupReference, overlayRef);
            if (outsideClickSub) subscriptions.push(outsideClickSub);
        }

        if (settings.closeOnMouseLeave) {
            const mouseLeaveSubscription = this.setupMouseLeaveSubscription(settings, popupReference);
            if (mouseLeaveSubscription) subscriptions.push(mouseLeaveSubscription);
        }

        if (subscriptions.length === 0) {
            return null;
        }

        const combinedSubscription = new Subscription();
        subscriptions.forEach(sub => combinedSubscription.add(sub));
        return combinedSubscription;
    }

    private setupEscapeKeyListener(settings: PopupSettings, popupReference: PopupReference): void {
        if (settings.closeOnEscape === false) {
            return;
        }

        fromEvent<KeyboardEvent>(document, "keydown")
            .pipe(
                filter(() => popupReference.overlayRef.hasAttached()),
                filter(event => event.key === "Escape"),
                takeUntil(popupReference.closed),
                takeUntilDestroyed(this.#destroyRef)
            )
            .subscribe(event => {
                const closeEvent = new PopupCloseEvent({
                    event,
                    originalEvent: event,
                    via: PopupCloseSource.Escape
                });

                if (this.shouldPreventClose(settings.preventClose, closeEvent)) {
                    return;
                }

                popupReference.popupRef.close(closeEvent);
            });
    }

    private setupInternalEventDelegation(selector: string, settings: PopupSettings): void {
        this.cleanupEventDelegation(selector);

        let currentPopupRef: PopupRef | null = null;
        const subscriptions: Subscription[] = [];
        const elements = document.querySelectorAll(selector);

        elements.forEach(element => {
            if (!(element instanceof HTMLElement)) {
                return;
            }

            const pointerEnter$ = fromEvent<PointerEvent>(element, "pointerenter");
            const pointerLeave$ = fromEvent<PointerEvent>(element, "pointerleave");

            const subscription = pointerEnter$
                .pipe(
                    filter(() => !currentPopupRef),
                    tap(() => {
                        const elementSettings = { ...settings, anchor: element };
                        currentPopupRef = this.createSingleElementPopup(elementSettings);
                    }),
                    exhaustMap(() => pointerLeave$.pipe(take(1))),
                    tap(() => {
                        if (currentPopupRef) {
                            currentPopupRef.close();
                            currentPopupRef = null;
                        }
                    }),
                    takeUntilDestroyed(this.#destroyRef)
                )
                .subscribe();

            subscriptions.push(subscription);
        });
        this.#selectorSubscriptions.set(selector, subscriptions);
    }

    private setupMouseLeaveSubscription(settings: PopupSettings, popupReference: PopupReference): Subscription | null {
        if (typeof settings.anchor === "string") {
            return null;
        }

        const resolvedAnchor = this.resolveAnchor(settings.anchor);
        const anchorElement = this.getAnchorElement(resolvedAnchor);
        if (!anchorElement) {
            return null;
        }

        return fromEvent<PointerEvent>(anchorElement, "pointerleave")
            .pipe(takeUntil(popupReference.closed), takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => {
                const closeEvent = new PopupCloseEvent({
                    event,
                    originalEvent: event,
                    via: PopupCloseSource.MouseLeave
                });

                if (this.shouldPreventClose(settings.preventClose, closeEvent)) {
                    return;
                }

                popupReference.close(closeEvent);
            });
    }

    private setupOutsideClickSubscription(
        settings: PopupSettings,
        popupReference: PopupReference,
        overlayRef: OverlayRef
    ): Subscription {
        return overlayRef
            .outsidePointerEvents()
            .pipe(takeUntil(popupReference.closed), takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => {
                if (this.shouldIgnoreOutsideClick(settings, event)) {
                    return;
                }

                const closeEvent = new PopupCloseEvent({
                    event,
                    originalEvent: event,
                    via: PopupCloseSource.OutsideClick
                });

                if (this.shouldPreventClose(settings.preventClose, closeEvent)) {
                    return;
                }

                popupReference.close(closeEvent);
            });
    }

    private setupPositionChangeTracking(
        settings: PopupSettings,
        overlayRef: OverlayRef,
        popupReference: PopupReference
    ): void {
        if (settings.positionStrategy === "global") {
            return;
        }

        const positionStrategy = overlayRef.getConfig().positionStrategy as FlexibleConnectedPositionStrategy;
        if (positionStrategy && positionStrategy.positionChanges) {
            positionStrategy.positionChanges
                .pipe(takeUntil(popupReference.closed), takeUntilDestroyed(this.#destroyRef))
                .subscribe(change => popupReference.positionChanges$.next(change.connectionPair));
        }
    }

    private setupScrollTracking(settings: PopupSettings, overlayRef: OverlayRef, popupReference: PopupReference): void {
        if (!(settings.withScrollTracking ?? true) || settings.positionStrategy === "global") {
            return;
        }
        if (typeof settings.anchor === "string") {
            return;
        }

        const subscriptions: Subscription[] = [];
        const updatePosition = () => {
            if (overlayRef.hasAttached()) {
                overlayRef.updatePosition();
            }
        };

        const windowScrollSubscription = fromEvent(window, "scroll", { passive: true })
            .pipe(takeUntil(popupReference.closed), takeUntilDestroyed(this.#destroyRef))
            .subscribe(updatePosition);
        subscriptions.push(windowScrollSubscription);

        const resizeSubscription = fromEvent(window, "resize", { passive: true })
            .pipe(takeUntil(popupReference.closed), takeUntilDestroyed(this.#destroyRef))
            .subscribe(updatePosition);
        subscriptions.push(resizeSubscription);

        const resolvedAnchor = this.resolveAnchor(settings.anchor);
        if (resolvedAnchor instanceof HTMLElement) {
            const scrollableContainers = this.getScrollableContainers(resolvedAnchor);

            scrollableContainers.forEach(scrollable => {
                const containerScrollSubscription = scrollable
                    .elementScrolled()
                    .pipe(takeUntil(popupReference.closed), takeUntilDestroyed(this.#destroyRef))
                    .subscribe(updatePosition);
                subscriptions.push(containerScrollSubscription);
            });
        }
        popupReference.closed.pipe(take(1)).subscribe(() => {
            subscriptions.forEach(sub => sub.unsubscribe());
        });
    }

    private shouldIgnoreOutsideClick(settings: PopupSettings, event: Event): boolean {
        const eventTarget = event.target as HTMLElement;

        if (typeof settings.anchor === "string") {
            return !this.#outsideEventsToClose.includes(event.type);
        }

        const resolvedAnchor = this.resolveAnchor(settings.anchor);
        const anchorElement = this.getAnchorElement(resolvedAnchor);
        const isAnchorClick = anchorElement && anchorElement.contains(eventTarget);
        const isRelevantEventType = this.#outsideEventsToClose.includes(event.type);

        return isAnchorClick || !isRelevantEventType;
    }

    private shouldPreventClose(
        preventClose: ((event: PopupCloseEvent) => boolean) | undefined,
        event: PopupCloseEvent
    ): boolean {
        if (!preventClose) {
            return false;
        }
        return preventClose(event) || event.isDefaultPrevented();
    }
}
