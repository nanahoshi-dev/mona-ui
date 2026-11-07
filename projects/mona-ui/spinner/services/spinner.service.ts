import { LiveAnnouncer } from "@angular/cdk/a11y";
import {
    ApplicationRef,
    ComponentRef,
    createComponent,
    DOCUMENT,
    ElementRef,
    inject,
    Injectable,
    Injector,
    isDevMode,
    OnDestroy,
    OutputRefSubscription,
    RendererFactory2
} from "@angular/core";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { defer, finalize, Observable, Subject, takeUntil } from "rxjs";
import { v4 } from "uuid";
import { SpinnerOverlayComponent } from "../components/spinner-overlay/spinner-overlay.component";
import { SPINNER_DEFAULT_MESSAGES } from "../i18n/spinner.default-messages";
import type { SpinnerAppearance } from "../models/SpinnerAppearance";
import type { SpinnerOptions } from "../models/SpinnerOptions";
import type { SpinnerRef } from "../models/SpinnerRef";
import type { SpinnerSize } from "../models/SpinnerSize";
import type { SpinnerUpdate } from "../models/SpinnerUpdate";

/** The most often a request's changing text is read out, so a progress loop doesn't queue up behind itself. */
const ANNOUNCE_INTERVAL = 5000;

interface SpinnerRequestState {
    activatedAt: number;
    announceTimer: ReturnType<typeof setTimeout> | null;
    announcedAt: number | null;
    announcedText: string | null;
    appearance: SpinnerAppearance;
    readonly cancelText: string | undefined;
    readonly cancellable: boolean;
    cancellationHandled: boolean;
    readonly cancelledSubject: Subject<void>;
    delayTimer: ReturnType<typeof setTimeout> | null;
    readonly id: string;
    readonly onCancel?: () => void;
    readonly options: SpinnerOptions;
    readonly registeredAt: number;
    size: SpinnerSize;
    status: "PENDING" | "VISIBLE" | "CLOSED";
    readonly targets: HTMLElement[];
    text?: string;
}

interface SpinnerTargetState {
    readonly activeRequestIds: Set<string>;
    cancelSubscription: OutputRefSubscription | null;
    changedPosition: boolean;
    componentRef: ComponentRef<SpinnerOverlayComponent> | null;
    readonly isFullPage: boolean;
    minDurationTimer: ReturnType<typeof setTimeout> | null;
    minimumVisibleDuration: number;
    originalAriaBusy: string | null;
    originalInlinePosition: string;
    readonly pendingRequestIds: Set<string>;
    readonly target: HTMLElement;
    visibleSince?: number;
}

@Injectable({
    providedIn: "root"
})
export class SpinnerService implements OnDestroy {
    readonly #appRef = inject(ApplicationRef);
    readonly #document = inject(DOCUMENT);
    readonly #i18n = inject(MonaI18nService);
    readonly #injector = inject(Injector);
    readonly #liveAnnouncer = inject(LiveAnnouncer);
    readonly #messages = this.#i18n.componentMessages("spinner", SPINNER_DEFAULT_MESSAGES);
    readonly #renderer = inject(RendererFactory2).createRenderer(null, null);

    readonly #requests = new Map<string, SpinnerRequestState>();
    readonly #targetStates = new Set<SpinnerTargetState>();
    readonly #targets = new WeakMap<HTMLElement, SpinnerTargetState>();

    /**
     * Hides and destroys the spinner associated with the given `SpinnerRef` or string `id`.
     */
    public hide(refOrId: SpinnerRef | string): void {
        const id = typeof refOrId === "string" ? refOrId : refOrId.id;
        this.#closeRequest(id);
    }

    /**
     * Tears down every active/pending spinner request and physical overlay so
     * nothing is left behind if the service outlives its consumers.
     */
    public ngOnDestroy(): void {
        for (const request of this.#requests.values()) {
            this.#clearRequestTimers(request);
            if (!request.cancellationHandled) {
                request.cancelledSubject.complete();
            }
        }
        this.#requests.clear();

        for (const targetState of [...this.#targetStates]) {
            this.#teardownTarget(targetState);
        }
    }

    /**
     * Displays a spinner loading overlay according to the provided options.
     * Returns a `SpinnerRef` handle for lifecycle management and updates.
     */
    public show(options?: SpinnerOptions): SpinnerRef {
        const id = options?.id ?? `spinner-${v4()}`;

        // If an existing request with the same ID exists, close it cleanly first
        if (this.#requests.has(id)) {
            this.#closeRequest(id);
        }

        // Only leaving the key out means the whole page. A target that hasn't resolved yet, such as a viewChild before
        // its first render, must not cover the page instead of the panel it was meant for.
        const resolvedTargets =
            options && "target" in options ? this.#normalizeTargets(options.target) : [this.#document.body];

        const cancellableOpt = options?.cancellable;
        const isCancellable = !!cancellableOpt;
        const cancelText = typeof cancellableOpt === "object" && cancellableOpt.text ? cancellableOpt.text : undefined;
        const onCancel = typeof cancellableOpt === "object" ? cancellableOpt.onCancel : undefined;

        const cancelledSubject = new Subject<void>();

        const request: SpinnerRequestState = {
            activatedAt: Date.now(),
            announceTimer: null,
            announcedAt: null,
            announcedText: null,
            appearance: options?.appearance ?? "default",
            cancellationHandled: false,
            cancellable: isCancellable,
            cancelText,
            delayTimer: null,
            id,
            onCancel,
            options: options ?? {},
            registeredAt: Date.now(),
            size: options?.size ?? "medium",
            status: "PENDING",
            cancelledSubject,
            targets: resolvedTargets,
            text: options?.text
        };

        this.#requests.set(id, request);

        // Register request against all targets and set aria-busy. Targets that already
        // have a visible overlay activate immediately; idle targets respect `delay`.
        const immediateTargets: HTMLElement[] = [];
        const delayedTargets: HTMLElement[] = [];
        for (const target of resolvedTargets) {
            const targetState = this.#getOrCreateTargetState(target);
            targetState.pendingRequestIds.add(id);

            if (targetState.componentRef != null) {
                immediateTargets.push(target);
            } else {
                delayedTargets.push(target);
            }
        }

        if (immediateTargets.length > 0) {
            this.#activateRequestOnTargets(request, immediateTargets);
        }

        const delay = options?.delay ?? 0;
        if (delayedTargets.length > 0) {
            if (delay > 0) {
                request.delayTimer = setTimeout(() => {
                    request.delayTimer = null;
                    if (request.status !== "CLOSED") {
                        this.#activateRequestOnTargets(request, delayedTargets);
                    }
                }, delay);
            } else {
                this.#activateRequestOnTargets(request, delayedTargets);
            }
        }

        return {
            id,
            cancelled$: cancelledSubject.asObservable(),
            close: () => this.#closeRequest(id),
            update: update => this.#updateRequest(id, update)
        };
    }

    /**
     * Wraps an Observable operation with a Spinner lifecycle.
     * Shows the spinner on subscription and closes it when the observable completes, errors, or is unsubscribed.
     * Cancelling a `cancellable` spinner completes the returned observable and unsubscribes from the source, which also
     * aborts an HTTP request.
     */
    public track<T>(source: Observable<T>, options?: SpinnerOptions): Observable<T> {
        return defer(() => {
            const ref = this.show(options);
            return source.pipe(
                takeUntil(ref.cancelled$),
                finalize(() => ref.close())
            );
        });
    }

    #activateRequestOnTargets(request: SpinnerRequestState, targets: readonly HTMLElement[]): void {
        if (request.status === "CLOSED") {
            return;
        }

        request.status = "VISIBLE";
        request.activatedAt = Date.now();

        for (const target of targets) {
            const targetState = this.#getOrCreateTargetState(target);
            targetState.activeRequestIds.add(request.id);
            targetState.minimumVisibleDuration = Math.max(
                targetState.minimumVisibleDuration,
                request.options.minimumVisibleDuration ?? 0
            );
            this.#updateTargetOverlay(targetState);
        }

        if (request.announcedAt === null) {
            this.#announce(request);
        }
    }

    #announce(request: SpinnerRequestState): void {
        const text = request.text || this.#messages().loading;
        if (text !== request.announcedText) {
            request.announcedAt = Date.now();
            request.announcedText = text;
            void this.#liveAnnouncer.announce(text, "polite");
        }
    }

    #announceUpdate(request: SpinnerRequestState): void {
        if (request.announcedAt === null || request.announceTimer != null) {
            return;
        }
        const wait = request.announcedAt + ANNOUNCE_INTERVAL - Date.now();
        if (wait <= 0) {
            this.#announce(request);
        } else {
            request.announceTimer = setTimeout(() => {
                request.announceTimer = null;
                this.#announce(request);
            }, wait);
        }
    }

    #cancelRequest(requestId: string): void {
        const request = this.#requests.get(requestId);
        if (!request || request.cancellationHandled || request.status === "CLOSED") {
            return;
        }

        request.cancellationHandled = true;
        request.cancelledSubject.next();
        request.cancelledSubject.complete();

        try {
            if (request.onCancel) {
                request.onCancel();
            }
        } finally {
            this.#closeRequest(requestId);
        }
    }

    #clearRequestTimers(request: SpinnerRequestState): void {
        if (request.delayTimer != null) {
            clearTimeout(request.delayTimer);
            request.delayTimer = null;
        }
        if (request.announceTimer != null) {
            clearTimeout(request.announceTimer);
            request.announceTimer = null;
        }
    }

    #closeRequest(requestId: string): void {
        const request = this.#requests.get(requestId);
        if (!request || request.status === "CLOSED") {
            return;
        }

        request.status = "CLOSED";
        this.#clearRequestTimers(request);

        if (!request.cancellationHandled) {
            request.cancelledSubject.complete();
        }

        this.#requests.delete(requestId);

        for (const target of request.targets) {
            const targetState = this.#targets.get(target);
            if (!targetState) {
                continue;
            }

            targetState.pendingRequestIds.delete(requestId);
            targetState.activeRequestIds.delete(requestId);

            if (targetState.activeRequestIds.size > 0) {
                // Other active requests remain; recompute winning presentation
                this.#updateTargetOverlay(targetState);
            } else if (targetState.pendingRequestIds.size === 0) {
                // No active or pending requests remain on this target
                const minDuration = targetState.minimumVisibleDuration;
                if (minDuration > 0 && targetState.visibleSince != null && targetState.componentRef != null) {
                    const elapsed = Date.now() - targetState.visibleSince;
                    const remaining = minDuration - elapsed;

                    if (remaining > 0) {
                        if (targetState.minDurationTimer != null) {
                            clearTimeout(targetState.minDurationTimer);
                        }
                        // Nothing is left to cancel while the overlay is only being held.
                        targetState.componentRef.instance.returnFocus();
                        targetState.componentRef.setInput("cancellable", false);
                        targetState.componentRef.changeDetectorRef.detectChanges();
                        targetState.minDurationTimer = setTimeout(() => {
                            targetState.minDurationTimer = null;
                            if (targetState.activeRequestIds.size === 0 && targetState.pendingRequestIds.size === 0) {
                                this.#teardownTarget(targetState);
                            }
                        }, remaining);
                    } else {
                        this.#teardownTarget(targetState);
                    }
                } else {
                    this.#teardownTarget(targetState);
                }
            } else if (targetState.componentRef != null) {
                // Only requests still in their delay remain. A new request on a visible overlay shows at once, and
                // these get the same, rather than leaving the closed request's text and a dead Cancel on screen.
                for (const pendingId of targetState.pendingRequestIds) {
                    const pending = this.#requests.get(pendingId);
                    if (pending) {
                        this.#activateRequestOnTargets(pending, [target]);
                    }
                }
            }
        }
    }

    #getOrCreateTargetState(target: HTMLElement): SpinnerTargetState {
        const isFullPage = target === this.#document.body;
        let state = this.#targets.get(target);
        if (!state) {
            const originalAriaBusy = target.getAttribute("aria-busy");
            const originalInlinePosition = target.style.position;

            state = {
                activeRequestIds: new Set<string>(),
                cancelSubscription: null,
                changedPosition: false,
                componentRef: null,
                isFullPage,
                minDurationTimer: null,
                minimumVisibleDuration: 0,
                originalAriaBusy,
                originalInlinePosition,
                pendingRequestIds: new Set<string>(),
                target
            };
            this.#targets.set(target, state);
            this.#targetStates.add(state);
        }

        // Apply aria-busy immediately while logically busy. Not on the body: it would mark the whole page, this
        // overlay's own text and Cancel button included, as something assistive technology can skip until it clears.
        if (!isFullPage) {
            this.#renderer.setAttribute(target, "aria-busy", "true");
        }

        // If a delayed teardown was pending, cancel it since new activity arrived
        if (state.minDurationTimer != null) {
            clearTimeout(state.minDurationTimer);
            state.minDurationTimer = null;
        }

        return state;
    }

    #getWinningRequestForTarget(targetState: SpinnerTargetState): SpinnerRequestState | null {
        let winningRequest: SpinnerRequestState | null = null;
        for (const requestId of targetState.activeRequestIds) {
            const req = this.#requests.get(requestId);
            if (req && req.status === "VISIBLE") {
                if (!winningRequest || req.activatedAt >= winningRequest.activatedAt) {
                    winningRequest = req;
                }
            }
        }
        return winningRequest;
    }

    #normalizeTargets(
        target?: HTMLElement | ElementRef<HTMLElement> | readonly (HTMLElement | ElementRef<HTMLElement>)[]
    ): HTMLElement[] {
        const rawList: readonly unknown[] = Array.isArray(target) ? target : [target];
        const result: HTMLElement[] = [];

        for (const item of rawList) {
            const element = this.#toElement(item);
            if (element) {
                result.push(element);
            }
        }

        if (isDevMode() && (result.length === 0 || result.length !== rawList.length)) {
            console.error(
                "SpinnerService: a target didn't resolve to an element, so no overlay shows on it. " +
                    "Leave target out for a full-page spinner."
            );
        }

        return result;
    }

    #teardownTarget(targetState: SpinnerTargetState): void {
        if (targetState.minDurationTimer != null) {
            clearTimeout(targetState.minDurationTimer);
            targetState.minDurationTimer = null;
        }

        targetState.cancelSubscription?.unsubscribe();
        targetState.cancelSubscription = null;

        if (targetState.componentRef != null) {
            targetState.componentRef.instance.returnFocus();
            this.#appRef.detachView(targetState.componentRef.hostView);
            targetState.componentRef.destroy();
            targetState.componentRef = null;
        }

        // Forget the target, so it isn't kept alive and the next request reads its attributes afresh.
        this.#targets.delete(targetState.target);
        this.#targetStates.delete(targetState);

        if (!targetState.isFullPage) {
            // Restore aria-busy attribute exactly
            if (targetState.originalAriaBusy === null) {
                this.#renderer.removeAttribute(targetState.target, "aria-busy");
            } else {
                this.#renderer.setAttribute(targetState.target, "aria-busy", targetState.originalAriaBusy);
            }
        }

        // Restore target positioning safely
        if (targetState.changedPosition) {
            if (targetState.target.style.position === "relative") {
                this.#renderer.setStyle(
                    targetState.target,
                    "position",
                    targetState.originalInlinePosition || null
                );
            }
            targetState.changedPosition = false;
        }
    }

    #toElement(item: unknown): HTMLElement | null {
        const isElement = (value: unknown): value is HTMLElement => (value as Node | null | undefined)?.nodeType === 1;
        if (isElement(item)) {
            return item;
        }
        const nativeElement = (item as ElementRef<unknown> | null | undefined)?.nativeElement;
        return isElement(nativeElement) ? nativeElement : null;
    }

    #updateRequest(requestId: string, update: SpinnerUpdate): void {
        const request = this.#requests.get(requestId);
        if (!request || request.status === "CLOSED") {
            return;
        }

        if (update.appearance !== undefined) {
            request.appearance = update.appearance;
        }
        if (update.size !== undefined) {
            request.size = update.size;
        }
        if (update.text !== undefined) {
            request.text = update.text;
        }

        for (const target of request.targets) {
            const targetState = this.#targets.get(target);
            if (targetState) {
                this.#updateTargetOverlay(targetState);
            }
        }

        if (update.text !== undefined) {
            this.#announceUpdate(request);
        }
    }

    #updateOverlayInputs(
        componentRef: ComponentRef<SpinnerOverlayComponent>,
        winner: SpinnerRequestState,
        targetState: SpinnerTargetState
    ): void {
        componentRef.setInput("appearance", winner.appearance);
        componentRef.setInput("size", winner.size);
        componentRef.setInput("text", winner.text);
        componentRef.setInput("cancellable", winner.cancellable);
        componentRef.setInput("cancelText", winner.cancelText);
        componentRef.setInput("fullPage", targetState.isFullPage);
        componentRef.setInput("zIndex", winner.options.zIndex);
    }

    #updateTargetOverlay(targetState: SpinnerTargetState): void {
        const winner = this.#getWinningRequestForTarget(targetState);
        if (!winner) {
            return;
        }

        if (!targetState.componentRef) {
            // Need containing block for absolute local positioning
            if (!targetState.isFullPage) {
                const defaultView = this.#document.defaultView;
                const computedPosition = defaultView ? defaultView.getComputedStyle(targetState.target).position : "static";

                if (computedPosition === "static") {
                    this.#renderer.setStyle(targetState.target, "position", "relative");
                    targetState.changedPosition = true;
                }
            }

            const compRef = createComponent(SpinnerOverlayComponent, {
                environmentInjector: this.#appRef.injector,
                elementInjector: this.#injector
            });

            this.#updateOverlayInputs(compRef, winner, targetState);

            targetState.cancelSubscription = compRef.instance.cancel.subscribe(() => {
                const currentWinner = this.#getWinningRequestForTarget(targetState);
                if (currentWinner) {
                    this.#cancelRequest(currentWinner.id);
                }
            });

            this.#appRef.attachView(compRef.hostView);
            this.#renderer.appendChild(targetState.target, compRef.location.nativeElement);
            compRef.changeDetectorRef.detectChanges();

            targetState.componentRef = compRef;
            targetState.visibleSince = Date.now();
        } else {
            // Physical overlay already exists: update its inputs dynamically
            const compRef = targetState.componentRef;
            if (!winner.cancellable) {
                // The Cancel button goes away with this update, and focus mustn't go with it.
                compRef.instance.returnFocus();
            }
            this.#updateOverlayInputs(compRef, winner, targetState);
            compRef.changeDetectorRef.detectChanges();
        }
    }
}
