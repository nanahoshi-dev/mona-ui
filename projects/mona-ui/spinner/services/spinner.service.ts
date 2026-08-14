import {
    ApplicationRef,
    ComponentRef,
    createComponent,
    DOCUMENT,
    ElementRef,
    inject,
    Injectable,
    Injector,
    OnDestroy,
    OutputRefSubscription,
    RendererFactory2
} from "@angular/core";
import { defer, finalize, Observable, Subject } from "rxjs";
import { v4 } from "uuid";
import { SpinnerOverlayComponent } from "../components/spinner-overlay/spinner-overlay.component";
import type { SpinnerAppearance } from "../models/SpinnerAppearance";
import type { SpinnerOptions } from "../models/SpinnerOptions";
import type { SpinnerRef } from "../models/SpinnerRef";
import type { SpinnerSize } from "../models/SpinnerSize";
import type { SpinnerUpdate } from "../models/SpinnerUpdate";

interface SpinnerRequestState {
    activatedAt: number;
    appearance: SpinnerAppearance;
    cancellationHandled: boolean;
    readonly cancellable: boolean;
    readonly cancelText: string;
    delayTimer: ReturnType<typeof setTimeout> | null;
    readonly id: string;
    readonly isFullPage: boolean;
    readonly onCancel?: () => void;
    readonly options: SpinnerOptions;
    readonly registeredAt: number;
    size: SpinnerSize;
    status: "PENDING" | "VISIBLE" | "CLOSED";
    readonly cancelledSubject: Subject<void>;
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
    readonly #injector = inject(Injector);
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
            if (request.delayTimer != null) {
                clearTimeout(request.delayTimer);
                request.delayTimer = null;
            }
            if (!request.cancellationHandled) {
                request.cancelledSubject.complete();
            }
        }
        this.#requests.clear();

        for (const targetState of this.#targetStates) {
            if (targetState.minDurationTimer != null) {
                clearTimeout(targetState.minDurationTimer);
                targetState.minDurationTimer = null;
            }

            targetState.cancelSubscription?.unsubscribe();
            targetState.cancelSubscription = null;

            if (targetState.componentRef != null) {
                this.#appRef.detachView(targetState.componentRef.hostView);
                targetState.componentRef.destroy();
                targetState.componentRef = null;
            }
        }
        this.#targetStates.clear();
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

        const targets = this.#normalizeTargets(options?.target);
        const isFullPage = !options?.target || targets.length === 0;
        const resolvedTargets = isFullPage ? [this.#document.body] : targets;

        const cancellableOpt = options?.cancellable;
        const isCancellable = !!cancellableOpt;
        const cancelText = typeof cancellableOpt === "object" && cancellableOpt.text ? cancellableOpt.text : "Cancel";
        const onCancel = typeof cancellableOpt === "object" ? cancellableOpt.onCancel : undefined;

        const cancelledSubject = new Subject<void>();

        const request: SpinnerRequestState = {
            activatedAt: Date.now(),
            appearance: options?.appearance ?? "default",
            cancellationHandled: false,
            cancellable: isCancellable,
            cancelText,
            delayTimer: null,
            id,
            isFullPage,
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
            const targetState = this.#getOrCreateTargetState(target, isFullPage);
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
     */
    public track<T>(source: Observable<T>, options?: SpinnerOptions): Observable<T> {
        return defer(() => {
            const ref = this.show(options);
            return source.pipe(finalize(() => ref.close()));
        });
    }

    #activateRequestOnTargets(request: SpinnerRequestState, targets: readonly HTMLElement[]): void {
        if (request.status === "CLOSED") {
            return;
        }

        request.status = "VISIBLE";
        request.activatedAt = Date.now();

        for (const target of targets) {
            const targetState = this.#getOrCreateTargetState(target, request.isFullPage);
            targetState.activeRequestIds.add(request.id);
            this.#updateTargetOverlay(targetState);
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

    #closeRequest(requestId: string): void {
        const request = this.#requests.get(requestId);
        if (!request || request.status === "CLOSED") {
            return;
        }

        request.status = "CLOSED";

        if (request.delayTimer != null) {
            clearTimeout(request.delayTimer);
            request.delayTimer = null;
        }

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
                const minDuration = request.options.minimumVisibleDuration ?? 0;
                if (minDuration > 0 && targetState.visibleSince != null && targetState.componentRef != null) {
                    const elapsed = Date.now() - targetState.visibleSince;
                    const remaining = minDuration - elapsed;

                    if (remaining > 0) {
                        if (targetState.minDurationTimer != null) {
                            clearTimeout(targetState.minDurationTimer);
                        }
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
            }
        }
    }

    #getOrCreateTargetState(target: HTMLElement, isFullPage: boolean): SpinnerTargetState {
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
                originalAriaBusy,
                originalInlinePosition,
                pendingRequestIds: new Set<string>(),
                target
            };
            this.#targets.set(target, state);
            this.#targetStates.add(state);
        }

        // Apply aria-busy immediately while logically busy
        this.#renderer.setAttribute(target, "aria-busy", "true");

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
        if (!target) {
            return [];
        }

        const rawList = Array.isArray(target) ? target : [target];
        const result: HTMLElement[] = [];

        for (const item of rawList) {
            if (item instanceof HTMLElement) {
                result.push(item);
            } else if (item && typeof item === "object" && "nativeElement" in item && item.nativeElement instanceof HTMLElement) {
                result.push(item.nativeElement);
            }
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
            this.#appRef.detachView(targetState.componentRef.hostView);
            targetState.componentRef.destroy();
            targetState.componentRef = null;
        }

        targetState.visibleSince = undefined;

        // Restore aria-busy attribute exactly
        if (targetState.originalAriaBusy === null) {
            this.#renderer.removeAttribute(targetState.target, "aria-busy");
        } else {
            this.#renderer.setAttribute(targetState.target, "aria-busy", targetState.originalAriaBusy);
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

            compRef.setInput("appearance", winner.appearance);
            compRef.setInput("size", winner.size);
            compRef.setInput("text", winner.text);
            compRef.setInput("cancellable", winner.cancellable);
            compRef.setInput("cancelText", winner.cancelText);
            compRef.setInput("fullPage", targetState.isFullPage);
            if (winner.options.zIndex !== undefined) {
                compRef.setInput("zIndex", winner.options.zIndex);
            }

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
            compRef.setInput("appearance", winner.appearance);
            compRef.setInput("size", winner.size);
            compRef.setInput("text", winner.text);
            compRef.setInput("cancellable", winner.cancellable);
            compRef.setInput("cancelText", winner.cancelText);
            compRef.setInput("fullPage", targetState.isFullPage);
            if (winner.options.zIndex !== undefined) {
                compRef.setInput("zIndex", winner.options.zIndex);
            }
            compRef.changeDetectorRef.detectChanges();
        }
    }
}
