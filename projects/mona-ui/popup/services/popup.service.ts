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
import { MonaI18nService, observeComponentDirection, resolveComponentDirection } from "@nanahoshi/mona-ui/i18n";
import { focusCanReturn } from "@nanahoshi/mona-ui/internal";
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
    readonly #i18n = inject(MonaI18nService, { optional: true });
    readonly #injector = inject(Injector);
    /** Open popups in the order they were opened; the last one is on top. */
    readonly #openPopups: OpenPopup[] = [];
    readonly #outsideEventsToClose = ["click", "mousedown", "dblclick", "contextmenu", "auxclick"];
    readonly #overlay = inject(Overlay);
    readonly #scrollDispatcher = inject(ScrollDispatcher);
    readonly #selectorSubscriptions = new Map<string, Subscription[]>();
    #escapeSubscription: Subscription | null = null;
    #escapeTarget: { event: KeyboardEvent; popup: OpenPopup | null } | null = null;

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
        const anchorElement =
            settings.anchor instanceof ElementRef
                ? settings.anchor.nativeElement
                : settings.anchor instanceof HTMLElement
                  ? settings.anchor
                  : null;
        const direction = resolveComponentDirection(anchorElement, this.#directionality);
        const overlayRef = this.#overlay.create(
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
                direction,
                scrollStrategy: settings.blockScroll ? this.#overlay.scrollStrategies.block() : undefined
            })
        );
        const lang = resolvePopupLanguage(anchorElement, this.#i18n?.localeId());
        if (lang) {
            overlayRef.overlayElement.setAttribute("lang", lang);
        }
        return overlayRef;
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
        this.setupBackdropFadeOut(settings, popupReference, overlayRef);
        if (settings.closeOnScroll) {
            this.setupScrollClosing(settings, popupReference, overlayRef);
        }
        this.setupScrollTracking(settings, overlayRef, popupReference);
        this.registerOpenPopup(settings, popupReference);
        this.setupPositionChangeTracking(settings, overlayRef, popupReference);
        this.setupDirectionTracking(settings, overlayRef, popupReference);

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

    private getTopmostOpenPopup(): OpenPopup | null {
        for (let index = this.#openPopups.length - 1; index >= 0; index--) {
            const popup = this.#openPopups[index];
            if (popup.reference.overlayRef.hasAttached()) {
                return popup;
            }
        }
        return null;
    }

    /**
     * Escape goes to the topmost open popup only, so closing a dropdown inside a dialog leaves the dialog
     * open. The topmost popup consumes the key even when it doesn't close on Escape, so a modal that can't
     * be dismissed doesn't let it reach the popup underneath. An Escape that ends an IME composition is left
     * alone. `preventDefault()` doesn't keep the popup open, because controls call it on every navigation key;
     * a control that handles Escape itself stops its propagation instead.
     */
    private handleEscapeKey(event: KeyboardEvent): void {
        const escapeTarget = this.#escapeTarget;
        this.#escapeTarget = null;
        if (event.key !== "Escape" || event.isComposing) {
            return;
        }

        // The popup on top when the key was pressed, before handlers further down could close it.
        const popup = escapeTarget?.event === event ? escapeTarget.popup : this.getTopmostOpenPopup();
        if (!popup?.closeOnEscape) {
            return;
        }
        popup.reference.popupRef.close(
            new PopupCloseEvent({
                event,
                originalEvent: event,
                via: PopupCloseSource.Escape
            })
        );
    }

    private handleFocusRestoration(
        settings: PopupSettings,
        overlayRef: OverlayRef,
        originallyFocusedElement?: HTMLElement | null
    ): void {
        const restoreFocus = settings.restoreFocus ?? "auto";
        if (restoreFocus === false) {
            return;
        }

        const target = restoreFocus === "auto" ? originallyFocusedElement : this.getAnchorElement(settings.anchor);
        if (target && focusCanReturn(this.#document, target, overlayRef.overlayElement)) {
            target.focus();
        }
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

    /**
     * One pair of `document` listeners serves every open popup. The capturing one notes which popup is on
     * top before the key reaches any control; the bubbling one closes it if nothing handled the key.
     */
    private listenForEscape(): void {
        if (this.#escapeSubscription) {
            return;
        }
        const subscription = new Subscription();
        subscription.add(
            fromEvent<KeyboardEvent>(this.#document, "keydown", { capture: true }).subscribe(event => {
                this.#escapeTarget = event.key === "Escape" ? { event, popup: this.getTopmostOpenPopup() } : null;
            })
        );
        subscription.add(
            fromEvent<KeyboardEvent>(this.#document, "keydown").subscribe(event => this.handleEscapeKey(event))
        );
        this.#escapeSubscription = subscription;
    }

    /**
     * A popup leaves the stack as soon as it starts closing, so a second Escape during its leave animation
     * goes to the popup underneath.
     */
    private registerOpenPopup(settings: PopupSettings, popupReference: PopupReference): void {
        const popup: OpenPopup = { closeOnEscape: settings.closeOnEscape ?? true, reference: popupReference };
        this.#openPopups.push(popup);
        this.listenForEscape();
        merge(popupReference.closeStart, popupReference.closed)
            .pipe(take(1))
            .subscribe(() => this.unregisterOpenPopup(popup));
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

    /**
     * Starts the backdrop fade-out as soon as the close begins, so it runs alongside the popup's leave
     * animation. Without it the backdrop stays fully opaque until `dispose()` removes it in one frame.
     */
    private setupBackdropFadeOut(
        settings: PopupSettings,
        popupReference: PopupReference,
        overlayRef: OverlayRef
    ): void {
        if (!settings.hasBackdrop) {
            return;
        }
        popupReference.closeStart.pipe(take(1)).subscribe(() => overlayRef.detachBackdrop());
    }

    private setupCleanupSubscription(
        popupReference: PopupReference,
        subscription: Subscription | null,
        settings: PopupSettings,
        originallyFocusedElement?: HTMLElement | null
    ): void {
        popupReference.closed.pipe(take(1)).subscribe(() => {
            subscription?.unsubscribe();
            this.handleFocusRestoration(settings, popupReference.overlayRef, originallyFocusedElement);
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

    private setupDirectionTracking(
        settings: PopupSettings,
        overlayRef: OverlayRef,
        popupReference: PopupReference
    ): void {
        const resolvedAnchor = this.resolveAnchor(settings.anchor);
        const anchorElement = this.getAnchorElement(resolvedAnchor);
        const cleanup = observeComponentDirection(anchorElement, this.#directionality, nextDir => {
            overlayRef.setDirection(nextDir);
            overlayRef.updatePosition();
            popupReference.componentRef?.changeDetectorRef.markForCheck();
        });

        popupReference.closed.pipe(take(1)).subscribe(() => {
            cleanup();
        });
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

    private unregisterOpenPopup(popup: OpenPopup): void {
        const index = this.#openPopups.indexOf(popup);
        if (index !== -1) {
            this.#openPopups.splice(index, 1);
        }
        if (this.#openPopups.length === 0) {
            this.#escapeSubscription?.unsubscribe();
            this.#escapeSubscription = null;
            this.#escapeTarget = null;
        }
    }
}

interface OpenPopup {
    readonly closeOnEscape: boolean;
    readonly reference: PopupReference;
}

/**
 * Language of the popup content. The overlay container sits outside the app root, so a `lang` set on the root
 * (or near the anchor) would not reach the popup and screen readers could read it with the wrong voice
 * (WCAG 3.1.2). The nearest `lang` above the anchor wins; without one, the active Mona locale is used.
 */
function resolvePopupLanguage(anchorElement: HTMLElement | null, localeId: string | undefined): string | null {
    const inherited = anchorElement?.closest("[lang]")?.getAttribute("lang")?.trim();
    return inherited || localeId || null;
}
