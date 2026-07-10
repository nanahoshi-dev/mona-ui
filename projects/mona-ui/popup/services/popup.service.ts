import { Directionality } from "@angular/cdk/bidi";
import {
    ComponentType,
    ConnectionPositionPair,
    FlexibleConnectedPositionStrategy,
    FlexibleConnectedPositionStrategyOrigin,
    Overlay,
    OverlayConfig,
    OverlayRef,
    PositionStrategy
} from "@angular/cdk/overlay";
import { ComponentPortal } from "@angular/cdk/portal";
import { ScrollDispatcher, type ScrollDispatcherTarget } from "@angular/cdk/scrolling";
import { DestroyRef, DOCUMENT, ElementRef, inject, Injectable, Injector, TemplateRef } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { exhaustMap, filter, fromEvent, merge, Subject, Subscription, take, takeUntil, tap } from "rxjs";
import { PopupWrapperComponent } from "../components/popup-wrapper/popup-wrapper.component";
import { PopupCloseEvent, PopupCloseSource } from "../models/PopupCloseEvent";
import { PopupDataInjectionToken, PopupSettingsInjectionToken } from "../models/PopupInjectionToken";
import { PopupRef } from "../models/PopupRef";
import { PopupReference } from "../models/PopupReference";
import { PopupReferenceInjectionToken } from "../models/PopupReferenceInjectionToken";
import { PopupAnchor, PopupSettings } from "../models/PopupSettings";
import { ConnectionPoint, connectionPosition } from "../utils/connectionPosition";

@Injectable({
    providedIn: "root"
})
export class PopupService {
    readonly #destroyRef = inject(DestroyRef);
    readonly #directionality = inject(Directionality, { optional: true });
    readonly #document = inject(DOCUMENT);
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

    private attachContent(
        settings: PopupSettings,
        popupReference: PopupReference,
        overlayRef: OverlayRef,
        injector: Injector
    ): HTMLElement {
        const portal = new ComponentPortal(PopupWrapperComponent, null, injector);
        const wrapperComponentRef = overlayRef.attach(portal);
        popupReference.wrapperComponentRef = wrapperComponentRef;
        wrapperComponentRef.changeDetectorRef.detectChanges();
        popupReference.componentRef =
            wrapperComponentRef.instance.attachContent(
                settings.content as TemplateRef<unknown> | ComponentType<unknown>,
                injector
            ) ?? undefined;
        wrapperComponentRef.changeDetectorRef.detectChanges();
        return wrapperComponentRef.location.nativeElement;
    }

    private buildPanelClass(popupClass?: string | string[]): string | string[] {
        if (!popupClass) {
            return "mona-popup-content";
        }
        return ["mona-popup-content"].concat(popupClass);
    }

    private captureOriginalFocus(settings: PopupSettings): HTMLElement | null {
        if (typeof settings.anchor === "string" || settings.restoreFocus === false) {
            return null;
        }

        const activeElement = this.#document.activeElement;
        if (!(activeElement instanceof HTMLElement)) {
            return null;
        }

        if (settings.restoreFocus === "auto") {
            const anchorElement = this.getAnchorElement(settings.anchor);
            return activeElement === anchorElement ? activeElement : null;
        }

        return this.getAnchorElement(settings.anchor);
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
                { provide: PopupReferenceInjectionToken, useValue: popupReference },
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

        // Set up the event delegation internally
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
        const direction = this.#directionality?.value;
        return this.#overlay.create(
            new OverlayConfig({
                positionStrategy,
                hasBackdrop: settings.hasBackdrop ?? false,
                height: settings.height,
                maxHeight: settings.maxHeight,
                maxWidth: settings.maxWidth,
                minHeight: settings.minHeight,
                minWidth: settings.minWidth,
                width: settings.width,
                panelClass,
                backdropClass: settings.backdropClass ?? "transparent",
                direction
            })
        );
    }

    private createPositionStrategy(settings: PopupSettings): PositionStrategy {
        if (settings.positionStrategy === "global") {
            return this.#overlay.position().global();
        }

        const resolvedAnchor = this.resolveAnchor(settings.anchor);
        const position = settings.positions?.length
            ? settings.positions
            : this.getPosition(settings.anchorConnectionPoint, settings.popupConnectionPoint);
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

    private createScrollDispatcherTarget(element: HTMLElement): ScrollDispatcherTarget {
        const elementRef = new ElementRef(element);
        return {
            elementScrolled: () => fromEvent<Event>(element, "scroll", { passive: true }),
            getElementRef: () => elementRef
        };
    }

    private createSingleElementPopup(settings: PopupSettings): PopupRef {
        const overlayRef = this.createOverlay(settings);
        const popupReference = new PopupReference(overlayRef, settings.preventClose);
        const originallyFocusedElement = this.captureOriginalFocus(settings);
        const injector = this.createInjector(settings, popupReference);

        popupReference.notifyOpen();

        this.attachContent(settings, popupReference, overlayRef, injector);

        const subscription = this.setupCloseSubscriptions(settings, popupReference, overlayRef);
        this.setupCleanupSubscription(popupReference, subscription, settings, originallyFocusedElement);
        if (settings.closeOnScroll) {
            this.setupScrollClosing(settings, popupReference, overlayRef);
        }
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

    private getPosition(
        anchorConnectionPoint?: ConnectionPoint | null,
        popupConnectionPoint?: ConnectionPoint | null
    ): ConnectionPositionPair[] {
        const anchorPoint = anchorConnectionPoint ?? "bottomleft";
        const popupPoint = popupConnectionPoint ?? "topleft";
        return connectionPosition(anchorPoint, popupPoint);
    }

    private getScrollableAncestorElements(anchorElement: HTMLElement): HTMLElement[] {
        const scrollables: HTMLElement[] = [];
        let element = anchorElement.parentElement;
        while (element) {
            if (this.isScrollableElement(element)) {
                scrollables.push(element);
            }
            element = element.parentElement;
        }
        return scrollables;
    }

    private getScrollableContainers(anchor: FlexibleConnectedPositionStrategyOrigin): ScrollDispatcherTarget[] {
        const anchorElement = this.getAnchorElement(anchor);
        if (!anchorElement) {
            return [];
        }

        const scrollablesByElement = new Map<HTMLElement, ScrollDispatcherTarget>();
        const addScrollable = (scrollable: ScrollDispatcherTarget): void => {
            scrollablesByElement.set(scrollable.getElementRef().nativeElement, scrollable);
        };

        this.#scrollDispatcher
            .getAncestorScrollContainers(anchorElement)
            .forEach(scrollable => addScrollable(scrollable));
        this.getScrollableAncestorElements(anchorElement)
            .map(element => this.createScrollDispatcherTarget(element))
            .forEach(scrollable => addScrollable(scrollable));

        return Array.from(scrollablesByElement.values());
    }

    private isScrollableElement(element: HTMLElement): boolean {
        const defaultView = this.#document.defaultView;
        if (!defaultView) {
            return false;
        }

        const style = defaultView.getComputedStyle(element);
        const canScrollVertically =
            (this.isScrollableOverflow(style.overflowY) || this.isScrollableOverflow(style.overflow)) &&
            element.scrollHeight > element.clientHeight;
        const canScrollHorizontally =
            (this.isScrollableOverflow(style.overflowX) || this.isScrollableOverflow(style.overflow)) &&
            element.scrollWidth > element.clientWidth;
        return canScrollVertically || canScrollHorizontally;
    }

    private isScrollableOverflow(value: string): boolean {
        return value === "auto" || value === "scroll" || value === "overlay";
    }

    private handleFocusRestoration(settings: PopupSettings, originallyFocusedElement?: HTMLElement | null): void {
        const restoreFocus = settings.restoreFocus ?? "auto";

        if (restoreFocus === false) {
            return;
        }

        if (restoreFocus === "auto") {
            if (originallyFocusedElement) {
                originallyFocusedElement.focus();
            }
            return;
        }
        this.restoreFocusToAnchor(settings.anchor);
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

                if (!popupReference.close(event)) {
                    return;
                }

                backdropSubject.next();
                backdropSubject.complete();
            });
    }

    private setupCleanupSubscription(
        popupReference: PopupReference,
        subscription: Subscription | null,
        settings: PopupSettings,
        originallyFocusedElement?: HTMLElement | null
    ): void {
        popupReference.closed.pipe(take(1)).subscribe(() => {
            subscription?.unsubscribe();
            this.handleFocusRestoration(settings, originallyFocusedElement);
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
            if (backdropSub) {
                subscriptions.push(backdropSub);
            }
        }

        if (settings.closeOnOutsideClick ?? true) {
            const outsideClickSub = this.setupOutsideClickSubscription(settings, popupReference, overlayRef);
            if (outsideClickSub) {
                subscriptions.push(outsideClickSub);
            }
        }

        if (settings.closeOnMouseLeave) {
            const mouseLeaveSubscription = this.setupMouseLeaveSubscription(settings, popupReference);
            if (mouseLeaveSubscription) {
                subscriptions.push(mouseLeaveSubscription);
            }
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

        fromEvent<KeyboardEvent>(this.#document, "keydown")
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
                popupReference.popupRef.close(closeEvent);
            });
    }

    private setupInternalEventDelegation(selector: string, settings: PopupSettings): void {
        this.cleanupEventDelegation(selector);

        let currentPopupRef: PopupRef | null = null;
        const subscriptions: Subscription[] = [];
        const elements = this.#document.querySelectorAll(selector);

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

    private setupScrollClosing(settings: PopupSettings, popupReference: PopupReference, overlayRef: OverlayRef): void {
        if (!settings.closeOnScroll) {
            return;
        }

        const scrollableContainers = this.getScrollableContainers(this.resolveAnchor(settings.anchor));
        const subscriptions: Subscription[] = [];

        const handleScrollClose = (originalEvent?: Event) => {
            if (!overlayRef.hasAttached()) {
                return;
            }

            const closeEvent = new PopupCloseEvent({
                event: originalEvent ?? new Event("scroll"),
                originalEvent: originalEvent ?? new Event("scroll"),
                via: PopupCloseSource.Scroll
            });
            popupReference.close(closeEvent, 0);
        };

        if (scrollableContainers.length === 0) {
            const win = this.#document.defaultView!;
            const globalScrollSubscription = merge(
                fromEvent(win, "scroll", { passive: true }),
                fromEvent(win, "resize", { passive: true }),
                fromEvent(this.#document, "scroll", { passive: true })
            )
                .pipe(takeUntil(popupReference.closed), takeUntilDestroyed(this.#destroyRef))
                .subscribe(event => handleScrollClose(event));

            subscriptions.push(globalScrollSubscription);
        } else {
            scrollableContainers.forEach(scrollable => {
                const containerScrollSubscription = scrollable
                    .elementScrolled()
                    .pipe(takeUntil(popupReference.closed), takeUntilDestroyed(this.#destroyRef))
                    .subscribe(() => handleScrollClose());
                subscriptions.push(containerScrollSubscription);
            });
        }
        popupReference.closed.pipe(take(1)).subscribe(() => {
            subscriptions.forEach(sub => sub.unsubscribe());
        });
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

        const win = this.#document.defaultView!;
        const windowScrollSubscription = fromEvent(win, "scroll", { passive: true })
            .pipe(takeUntil(popupReference.closed), takeUntilDestroyed(this.#destroyRef))
            .subscribe(updatePosition);
        subscriptions.push(windowScrollSubscription);

        const resizeSubscription = fromEvent(win, "resize", { passive: true })
            .pipe(takeUntil(popupReference.closed), takeUntilDestroyed(this.#destroyRef))
            .subscribe(updatePosition);
        subscriptions.push(resizeSubscription);

        this.getScrollableContainers(this.resolveAnchor(settings.anchor)).forEach(scrollable => {
            const containerScrollSubscription = scrollable
                .elementScrolled()
                .pipe(takeUntil(popupReference.closed), takeUntilDestroyed(this.#destroyRef))
                .subscribe(updatePosition);
            subscriptions.push(containerScrollSubscription);
        });
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
}
