import type { ChartPoint, ChartRect } from "../../models/chart.models";
import type {
    ChartNavigationAxisTarget,
    ChartViewportChangeEvent,
    ChartViewportConstraint,
    ChartViewportLinkGroup
} from "../../models/chart-viewport.models";
import type { ChartAxisScene } from "../scene/cartesian-scene";
import type { ResolvedChartCartesianAxisType } from "../scale/chart-scale";
import type { CartesianAxisCoordinateSpace } from "./cartesian-axis-coordinate-space";
import { CartesianViewportOperationCoordinator } from "./cartesian-viewport-operation-coordinator";
import {
    areInternalViewportStatesEqual,
    diffInternalViewportStates,
    toPublicViewportState,
    type InternalCartesianViewportState
} from "./cartesian-viewport-normalizer";
import {
    CartesianViewportTargetResolver,
    type CartesianNavigationProfile
} from "./cartesian-viewport-target-resolver";
import type { NormalizedChartNavigationOptions } from "./chart-navigation-options";
import type {
    ChartViewportDragSession,
    ChartViewportPinchSession,
    ChartViewportWheelSession,
    ViewportGestureCancelReason
} from "./chart-viewport-gesture-session";
import { clamp } from "../utils/number-utils";

const MIN_SAFE_WHEEL_EXPONENT = -10;
const MAX_SAFE_WHEEL_EXPONENT = 10;

export interface ChartViewportGestureContext {
    authorityToken?: object | number;
    axisScenes: readonly ChartAxisScene[];
    constraints?: readonly ChartViewportConstraint[];
    coordinateSpace?: CartesianAxisCoordinateSpace;
    currentViewport: InternalCartesianViewportState;
    linkGroups?: readonly ChartViewportLinkGroup[];
    navigationOptions: NormalizedChartNavigationOptions;
    navigationProfile?: CartesianNavigationProfile;
    orientation: "horizontal" | "vertical";
    plotRect: ChartRect;
    warnedDiagnosticSignatures?: Set<string>;
    onCursorChange(cursor: string | null): void;
    onViewportChange(nextState: InternalCartesianViewportState, event: ChartViewportChangeEvent): void;
    setPointerCapture?(pointerId: number, target?: Element | null): void;
    releasePointerCapture?(pointerId: number, target?: Element | null): void;
}

function createNavigationTransformPolicySignature(
    nav: NormalizedChartNavigationOptions,
    constraints?: readonly ChartViewportConstraint[],
    linkGroups?: readonly ChartViewportLinkGroup[]
): string {
    const effectiveConstraints = constraints ?? nav.constraints;
    const effectiveLinkGroups = linkGroups ?? nav.linkGroups;
    return JSON.stringify({
        clampToData: nav.clampToData,
        constraints: effectiveConstraints,
        dragPan: nav.dragPan,
        linkGroups: effectiveLinkGroups,
        minVisibleCategories: nav.minVisibleCategories,
        panAxes: nav.panAxes,
        pinchZoom: nav.pinchZoom,
        wheelSensitivity: nav.wheelSensitivity,
        wheelZoom: nav.wheelZoom,
        zoomAxes: nav.zoomAxes
    });
}

export class ChartViewportGestureController {
    readonly #activePointers = new Map<number, ChartPoint>();
    readonly #cancelFrame: (handle: number) => void;
    #context: ChartViewportGestureContext;
    #currentAuthorityToken: object | number | undefined;
    #currentPolicySignature: string;
    #dragSession: ChartViewportDragSession | null = null;
    #gestureFrameId: number | null = null;
    #isClickSuppressed = false;
    #pinchSession: ChartViewportPinchSession | null = null;
    readonly #requestFrame: (callback: () => void) => number;
    #targetElement: Element | null = null;
    #wheelSession: ChartViewportWheelSession | null = null;

    public constructor(
        context: ChartViewportGestureContext,
        requestFrame?: (callback: () => void) => number,
        cancelFrame?: (handle: number) => void
    ) {
        this.#context = context;
        this.#currentAuthorityToken = context.authorityToken;
        this.#currentPolicySignature = createNavigationTransformPolicySignature(
            context.navigationOptions,
            context.constraints,
            context.linkGroups
        );
        this.#requestFrame =
            requestFrame ??
            (typeof requestAnimationFrame === "function"
                ? requestAnimationFrame.bind(globalThis)
                : cb => setTimeout(cb, 16) as unknown as number);
        this.#cancelFrame =
            cancelFrame ??
            (typeof cancelAnimationFrame === "function"
                ? cancelAnimationFrame.bind(globalThis)
                : handle => clearTimeout(handle));
    }

    public get activePointersCount(): number {
        return this.#activePointers.size;
    }

    public updateContext(context: ChartViewportGestureContext): void {
        const tokenChanged =
            this.#currentAuthorityToken !== undefined &&
            context.authorityToken !== undefined &&
            this.#currentAuthorityToken !== context.authorityToken;

        const newPolicy = createNavigationTransformPolicySignature(
            context.navigationOptions,
            context.constraints,
            context.linkGroups
        );
        const policyChanged =
            this.#currentPolicySignature !== undefined &&
            this.#currentPolicySignature !== newPolicy;

        if (tokenChanged || policyChanged) {
            if (this.#dragSession || this.#pinchSession || this.#wheelSession) {
                if (this.#gestureFrameId !== null) {
                    this.#cancelFrame(this.#gestureFrameId);
                    this.#gestureFrameId = null;
                }
                this.#flushPendingGestureFrame();
                this.#finalizeWheel({ silent: false });
                this.#finalizePinch({ releaseCapture: true, silent: false });
                this.#finalizeDrag({
                    releaseCapture: true,
                    silent: this.#dragSession ? !this.#dragSession.isThresholdMet : false
                });
            }
            this.#activePointers.clear();
        }

        this.#context = context;
        this.#currentAuthorityToken = context.authorityToken;
        this.#currentPolicySignature = newPolicy;
    }

    public flushPendingFrame(): void {
        this.#flushPendingGestureFrame();
    }

    public get isClickSuppressed(): boolean {
        return this.#isClickSuppressed;
    }

    public consumeClickSuppression(): boolean {
        const suppressed = this.#isClickSuppressed;
        this.#isClickSuppressed = false;
        return suppressed;
    }

    public get isDragging(): boolean {
        return this.#dragSession !== null && this.#dragSession.isThresholdMet;
    }

    public get isPinching(): boolean {
        return this.#pinchSession !== null;
    }

    public handlePointerDown(event: PointerEvent, elementPoint: ChartPoint, targetElement?: Element | null): boolean {
        const nav = this.#context.navigationOptions;
        if (!nav.enabled) return false;

        // Mouse: only primary button (button === 0) is admitted
        if (event.pointerType === "mouse" && event.button !== 0) {
            return false;
        }

        // Pointers limit: at most 2 pointers supported
        if (this.#activePointers.size >= 2) {
            return false;
        }

        this.#targetElement = targetElement ?? (event.target as Element | null);

        // If 1 pointer already active, check if this 2nd pointer can start pinch zoom
        if (this.#activePointers.size === 1) {
            if (!nav.pinchZoom) {
                return false;
            }

            const entries = Array.from(this.#activePointers.entries());
            const p1 = entries[0][1];
            const p2 = elementPoint;
            const distance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            const centroid: ChartPoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

            const resolved = CartesianViewportTargetResolver.resolveTargets(
                centroid,
                this.#context.plotRect,
                this.#context.axisScenes,
                nav,
                this.#context.orientation,
                nav.zoomAxes,
                this.#context.navigationProfile
            );

            const validSourceAxes = resolved.targetAxes.filter(ref => {
                const snap = this.#context.coordinateSpace?.get(ref);
                return snap !== undefined && snap.valid !== false;
            });

            if (validSourceAxes.length === 0) {
                // Invalid second pinch pointer: do not retain, keep prior 1-pointer state intact
                return false;
            }

            // Commit second pointer
            this.#activePointers.set(event.pointerId, elementPoint);

            if (this.#dragSession) {
                this.#flushPendingGestureFrame();
                this.#finalizeDrag({ releaseCapture: false, silent: false });
            }

            this.#isClickSuppressed = true;

            const ptr1 = entries[0][0];
            const ptr2 = event.pointerId;
            this.#context.setPointerCapture?.(ptr1, this.#targetElement);
            this.#context.setPointerCapture?.(ptr2, this.#targetElement);

            this.#pinchSession = {
                changedAxes: [],
                hasChanged: false,
                initialDistance: distance > 0 ? distance : 1,
                initialViewport: this.#context.currentViewport,
                latestCentroid: centroid,
                latestDistance: distance,
                latestViewport: this.#context.currentViewport,
                pointer1Id: ptr1,
                pointer2Id: ptr2,
                sourceAxes: validSourceAxes,
                startCentroid: centroid
            };

            this.#dispatchChangeEvent(
                "pinch",
                "start",
                this.#context.currentViewport,
                this.#context.currentViewport,
                []
            );
            return true;
        }

        // 0 pointers active: first pointer arriving
        if (nav.dragPan) {
            const resolved = CartesianViewportTargetResolver.resolveTargets(
                elementPoint,
                this.#context.plotRect,
                this.#context.axisScenes,
                nav,
                this.#context.orientation,
                nav.panAxes,
                this.#context.navigationProfile
            );

            const validSourceAxes = resolved.targetAxes.filter(ref => {
                const snap = this.#context.coordinateSpace?.get(ref);
                return snap !== undefined && snap.valid !== false;
            });

            if (validSourceAxes.length > 0) {
                this.#activePointers.set(event.pointerId, elementPoint);
                this.#dragSession = {
                    captureOwned: false,
                    changedAxes: [],
                    hasChanged: false,
                    initialViewport: this.#context.currentViewport,
                    isThresholdMet: false,
                    latestPoint: elementPoint,
                    latestViewport: this.#context.currentViewport,
                    pointerId: event.pointerId,
                    sourceAxes: validSourceAxes,
                    startPoint: elementPoint
                };

                this.#isClickSuppressed = false;
                return true;
            }
        }

        // Drag cannot start: for touch pointer when pinch is enabled, retain as future pinch candidate
        if (nav.pinchZoom && event.pointerType === "touch") {
            this.#activePointers.set(event.pointerId, elementPoint);
            return false;
        }

        return false;
    }

    public handlePointerMove(event: PointerEvent, elementPoint: ChartPoint): boolean {
        if (this.#activePointers.has(event.pointerId)) {
            this.#activePointers.set(event.pointerId, elementPoint);
        }

        // Defensive check: if mouse buttons are 0 (e.g. missed pointerup outside canvas), clean up
        if (event.pointerType === "mouse" && event.buttons === 0) {
            if (this.#dragSession && this.#dragSession.pointerId === event.pointerId) {
                if (this.#dragSession.isThresholdMet) {
                    this.#flushPendingGestureFrame();
                    this.#activePointers.delete(event.pointerId);
                    this.#finalizeDrag({ releaseCapture: true });
                } else {
                    const captureOwned = this.#dragSession.captureOwned;
                    this.#dragSession = null;
                    this.#activePointers.delete(event.pointerId);
                    if (captureOwned) {
                        this.#context.releasePointerCapture?.(event.pointerId, this.#targetElement);
                    }
                    this.#context.onCursorChange(null);
                }
                return false;
            }
        }

        // Handle active pinch
        if (this.#pinchSession) {
            const p1 = this.#activePointers.get(this.#pinchSession.pointer1Id);
            const p2 = this.#activePointers.get(this.#pinchSession.pointer2Id);
            if (!p1 || !p2 || !this.#context.coordinateSpace) return false;

            const distance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            const centroid: ChartPoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

            this.#pinchSession.latestCentroid = centroid;
            this.#pinchSession.latestDistance = distance;
            this.#requestGestureFrame();
            return true;
        }

        // Handle active drag pan
        if (this.#dragSession && this.#dragSession.pointerId === event.pointerId) {
            if (!this.#dragSession.isThresholdMet) {
                const totalDist = Math.hypot(
                    elementPoint.x - this.#dragSession.startPoint.x,
                    elementPoint.y - this.#dragSession.startPoint.y
                );
                if (totalDist >= 4) {
                    this.#dragSession.isThresholdMet = true;
                    this.#dragSession.captureOwned = true;
                    this.#isClickSuppressed = true;
                    this.#context.onCursorChange("grabbing");
                    this.#context.setPointerCapture?.(event.pointerId, this.#targetElement);
                    this.#dispatchChangeEvent(
                        "drag",
                        "start",
                        this.#dragSession.initialViewport,
                        this.#dragSession.initialViewport,
                        []
                    );
                } else {
                    return false;
                }
            }

            if (!this.#context.coordinateSpace) return false;

            this.#dragSession.latestPoint = elementPoint;
            this.#requestGestureFrame();
            return true;
        }

        return false;
    }

    public handlePointerLeave(event: PointerEvent): void {
        // If captured drag (threshold met or inherited from pinch), pointer capture owns continued movement - do not cancel
        if (this.#dragSession && this.#dragSession.captureOwned && this.#dragSession.pointerId === event.pointerId) {
            return;
        }

        // If uncaptured pre-threshold drag candidate leaves without capture, remove silently
        if (this.#dragSession && !this.#dragSession.captureOwned && this.#dragSession.pointerId === event.pointerId) {
            this.#dragSession = null;
            this.#activePointers.delete(event.pointerId);
            this.#context.onCursorChange(null);
            return;
        }

        // If active pinch is ongoing, pinch pointers are captured - do not cancel
        if (this.#pinchSession) {
            if (event.pointerId === this.#pinchSession.pointer1Id || event.pointerId === this.#pinchSession.pointer2Id) {
                return;
            }
        }

        // Abandoned first pinch candidate or unclaimed pointer: remove from activePointers
        this.#activePointers.delete(event.pointerId);
    }

    public handlePointerUp(event: PointerEvent): boolean {
        this.#activePointers.delete(event.pointerId);

        if (this.#pinchSession) {
            if (event.pointerId === this.#pinchSession.pointer1Id || event.pointerId === this.#pinchSession.pointer2Id) {
                this.#flushPendingGestureFrame();
                const endedSessionLatestViewport = this.#pinchSession.latestViewport;
                this.#finalizePinch({ releaseCapture: false });
                this.#context.releasePointerCapture?.(event.pointerId, this.#targetElement);

                let transitionedToDrag = false;

                // 2 -> 1 Pointer Transition: check if remaining pointer can initiate drag seeded from latest pinch viewport
                if (this.#activePointers.size === 1 && this.#context.navigationOptions.dragPan) {
                    const [remainingPointerId, remainingPoint] = Array.from(this.#activePointers.entries())[0];
                    const resolved = CartesianViewportTargetResolver.resolveTargets(
                        remainingPoint,
                        this.#context.plotRect,
                        this.#context.axisScenes,
                        this.#context.navigationOptions,
                        this.#context.orientation,
                        this.#context.navigationOptions.panAxes,
                        this.#context.navigationProfile
                    );
                    const validSourceAxes = resolved.targetAxes.filter(ref => {
                        const snap = this.#context.coordinateSpace?.get(ref);
                        return snap !== undefined && snap.valid !== false;
                    });
                    if (validSourceAxes.length > 0) {
                        transitionedToDrag = true;
                        this.#dragSession = {
                            captureOwned: true,
                            changedAxes: [],
                            hasChanged: false,
                            initialViewport: endedSessionLatestViewport,
                            isThresholdMet: false,
                            latestPoint: remainingPoint,
                            latestViewport: endedSessionLatestViewport,
                            pointerId: remainingPointerId,
                            sourceAxes: validSourceAxes,
                            startPoint: remainingPoint
                        };
                    }
                }

                if (!transitionedToDrag) {
                    for (const [remainingPointerId] of this.#activePointers) {
                        this.#context.releasePointerCapture?.(remainingPointerId, this.#targetElement);
                    }
                }

                return true;
            }
        }

        if (this.#dragSession && this.#dragSession.pointerId === event.pointerId) {
            this.#flushPendingGestureFrame();
            this.#finalizeDrag({ releaseCapture: true });
            return true;
        }

        return false;
    }

    public handlePointerCancel(event: PointerEvent): boolean {
        this.#activePointers.delete(event.pointerId);

        if (this.#pinchSession) {
            if (event.pointerId === this.#pinchSession.pointer1Id || event.pointerId === this.#pinchSession.pointer2Id) {
                this.#flushPendingGestureFrame();
                this.#finalizePinch({ releaseCapture: true });
                return true;
            }
        }

        if (this.#dragSession && this.#dragSession.pointerId === event.pointerId) {
            this.#flushPendingGestureFrame();
            this.#finalizeDrag({ releaseCapture: true, silent: !this.#dragSession.isThresholdMet });
            return true;
        }

        return false;
    }

    public handleLostPointerCapture(event: PointerEvent): void {
        this.#activePointers.delete(event.pointerId);

        if (this.#pinchSession) {
            if (event.pointerId === this.#pinchSession.pointer1Id || event.pointerId === this.#pinchSession.pointer2Id) {
                this.#flushPendingGestureFrame();
                this.#finalizePinch({ releaseCapture: false });
            }
        }

        if (this.#dragSession && this.#dragSession.pointerId === event.pointerId) {
            this.#flushPendingGestureFrame();
            this.#finalizeDrag({ releaseCapture: false, silent: !this.#dragSession.isThresholdMet });
        }
    }

    #finalizeDrag(options: { releaseCapture?: boolean; silent?: boolean } = {}): void {
        const session = this.#dragSession;
        if (!session) return;

        this.#dragSession = null;

        if (session.isThresholdMet) {
            this.#isClickSuppressed = true;
        }

        const shouldEmitEnd = session.isThresholdMet && !options.silent;
        const finalViewport = session.latestViewport;

        if (options.releaseCapture && session.captureOwned) {
            this.#context.releasePointerCapture?.(session.pointerId, this.#targetElement);
        }

        if (shouldEmitEnd) {
            this.#dispatchChangeEvent(
                "drag",
                "end",
                finalViewport,
                finalViewport,
                []
            );
        }

        this.#context.onCursorChange(null);
    }

    #finalizePinch(options: { releaseCapture?: boolean; silent?: boolean } = {}): void {
        const session = this.#pinchSession;
        if (!session) return;

        this.#pinchSession = null;

        const shouldEmitEnd = !options.silent;
        const finalViewport = session.latestViewport;

        if (options.releaseCapture) {
            this.#context.releasePointerCapture?.(session.pointer1Id, this.#targetElement);
            this.#context.releasePointerCapture?.(session.pointer2Id, this.#targetElement);
        }

        if (shouldEmitEnd) {
            this.#dispatchChangeEvent(
                "pinch",
                "end",
                finalViewport,
                finalViewport,
                []
            );
        }
    }

    #finalizeWheel(options: { silent?: boolean } = {}): void {
        const session = this.#wheelSession;
        if (!session) return;

        if (session.endTimerId !== null) {
            clearTimeout(session.endTimerId);
            session.endTimerId = null;
        }

        this.#wheelSession = null;
        const finalViewport = session.latestViewport;

        if (!options.silent) {
            this.#dispatchChangeEvent(
                "wheel",
                "end",
                finalViewport,
                finalViewport,
                []
            );
        }
    }

    public abortForAuthorityChange(): void {
        if (this.#gestureFrameId !== null) {
            this.#cancelFrame(this.#gestureFrameId);
            this.#gestureFrameId = null;
        }

        const wasDragThresholdMet = this.#dragSession?.isThresholdMet ?? false;
        this.#activePointers.clear();
        this.#finalizeWheel({ silent: false });
        this.#finalizePinch({ releaseCapture: true, silent: false });
        this.#finalizeDrag({ releaseCapture: true, silent: !wasDragThresholdMet });
        if (wasDragThresholdMet) {
            this.#isClickSuppressed = true;
        }
    }

    public cancel(reason?: ViewportGestureCancelReason | string): void {
        if (reason === "authority-change") {
            this.abortForAuthorityChange();
            return;
        }

        if (this.#gestureFrameId !== null) {
            this.#cancelFrame(this.#gestureFrameId);
            this.#gestureFrameId = null;
        }

        const wasDragThresholdMet = this.#dragSession?.isThresholdMet ?? false;
        this.#activePointers.clear();

        if (reason === "destroy") {
            // Silent teardown
            this.#finalizeWheel({ silent: true });
            this.#finalizePinch({ releaseCapture: true, silent: true });
            this.#finalizeDrag({ releaseCapture: true, silent: true });
            this.#isClickSuppressed = false;
            return;
        }

        // Non-destroy cancel (e.g. "escape", "navigation-disabled"): balanced end
        this.#finalizeWheel({ silent: false });
        this.#finalizePinch({ releaseCapture: true, silent: false });
        this.#finalizeDrag({ releaseCapture: true, silent: !wasDragThresholdMet });
        if (wasDragThresholdMet) {
            this.#isClickSuppressed = true;
        }
    }

    public destroy(): void {
        this.cancel("destroy");
    }

    public handleWheel(event: WheelEvent, elementPoint: ChartPoint): boolean {
        const nav = this.#context.navigationOptions;
        if (!nav.enabled || !nav.wheelZoom || !this.#context.coordinateSpace) return false;

        const resolved = CartesianViewportTargetResolver.resolveTargets(
            elementPoint,
            this.#context.plotRect,
            this.#context.axisScenes,
            nav,
            this.#context.orientation,
            nav.zoomAxes,
            this.#context.navigationProfile
        );

        if (resolved.targetAxes.length === 0) return false;

        const validSourceAxes = resolved.targetAxes.filter(ref => {
            const snap = this.#context.coordinateSpace?.get(ref);
            return snap !== undefined && snap.valid !== false;
        });

        if (validSourceAxes.length === 0) return false;

        let rawDeltaY = event.deltaY;
        if (event.deltaMode === 1) {
            rawDeltaY *= 16;
        } else if (event.deltaMode === 2) {
            rawDeltaY *= this.#context.plotRect.height;
        }

        const sensitivity = nav.wheelSensitivity ?? 0.0015;
        const normalizedDelta = rawDeltaY * sensitivity;

        const isCtrlKey = event.ctrlKey === true;

        // Synchronous preflight check for first event
        if (!this.#wheelSession) {
            const exponent = clamp(-normalizedDelta, MIN_SAFE_WHEEL_EXPONENT, MAX_SAFE_WHEEL_EXPONENT);
            const factor = Math.exp(exponent);
            const preflight = CartesianViewportOperationCoordinator.previewTransform(
                this.#context.currentViewport,
                this.#context.coordinateSpace,
                validSourceAxes,
                {
                    anchor: elementPoint,
                    zoomFactor: factor
                },
                {
                    clampToData: nav.clampToData,
                    constraints: this.#context.constraints,
                    minVisibleCategories: nav.minVisibleCategories
                }
            );

            if (!preflight.accepted || (!preflight.changed && !isCtrlKey)) {
                // Hard boundary or cannot transform: browser owns ordinary wheel
                return false;
            }

            this.#wheelSession = {
                anchor: elementPoint,
                changedAxes: [],
                endTimerId: null,
                hasChanged: false,
                initialViewport: this.#context.currentViewport,
                latestAnchor: elementPoint,
                latestViewport: this.#context.currentViewport,
                sourceAxes: validSourceAxes,
                totalNormalizedDeltaY: 0
            };

            this.#dispatchChangeEvent(
                "wheel",
                "start",
                this.#context.currentViewport,
                this.#context.currentViewport,
                []
            );
        } else {
            // If pointer moved significantly (> 8px) during ongoing wheel, restart session anchor cleanly
            const distFromAnchor = Math.hypot(
                elementPoint.x - this.#wheelSession.anchor.x,
                elementPoint.y - this.#wheelSession.anchor.y
            );
            if (distFromAnchor > 8) {
                this.#rebaseWheelSession(elementPoint, validSourceAxes);
            }
        }

        this.#wheelSession.totalNormalizedDeltaY += normalizedDelta;
        this.#wheelSession.latestAnchor = elementPoint;

        if (this.#wheelSession.endTimerId !== null) {
            clearTimeout(this.#wheelSession.endTimerId);
        }

        this.#wheelSession.endTimerId = setTimeout(() => {
            if (this.#wheelSession) {
                this.#flushPendingGestureFrame();
                this.#finalizeWheel({ silent: false });
            }
        }, 150);

        this.#requestGestureFrame();
        return true;
    }

    #rebaseWheelSession(newAnchor: ChartPoint, sourceAxes: readonly import("../../models/chart-viewport.models").ChartViewportAxisRef[]): void {
        if (!this.#wheelSession) return;
        if (this.#wheelSession.endTimerId !== null) {
            clearTimeout(this.#wheelSession.endTimerId);
            this.#wheelSession.endTimerId = null;
        }
        this.#flushPendingGestureFrame();
        const prevProposal = this.#wheelSession.latestViewport;
        this.#wheelSession = {
            anchor: newAnchor,
            changedAxes: [],
            endTimerId: null,
            hasChanged: false,
            initialViewport: prevProposal,
            latestAnchor: newAnchor,
            latestViewport: prevProposal,
            sourceAxes,
            totalNormalizedDeltaY: 0
        };
    }

    #requestGestureFrame(): void {
        if (this.#gestureFrameId !== null) {
            return;
        }

        this.#gestureFrameId = this.#requestFrame(() => {
            this.#gestureFrameId = null;
            this.#flushPendingGestureFrame();
        });
    }

    #flushPendingGestureFrame(): void {
        if (this.#gestureFrameId !== null) {
            this.#cancelFrame(this.#gestureFrameId);
            this.#gestureFrameId = null;
        }

        if (!this.#context.coordinateSpace) {
            return;
        }

        const coordinatorOptions = {
            clampToData: this.#context.navigationOptions.clampToData,
            constraints: this.#context.constraints,
            linkGroups: this.#context.linkGroups,
            minVisibleCategories: this.#context.navigationOptions.minVisibleCategories,
            warnedSignatures: this.#context.warnedDiagnosticSignatures
        };

        // 1. Flush Drag
        if (this.#dragSession && this.#dragSession.isThresholdMet) {
            const totalDeltaX = this.#dragSession.latestPoint.x - this.#dragSession.startPoint.x;
            const totalDeltaY = this.#dragSession.latestPoint.y - this.#dragSession.startPoint.y;
            const res = CartesianViewportOperationCoordinator.transform(
                this.#dragSession.initialViewport,
                this.#context.coordinateSpace,
                this.#dragSession.sourceAxes,
                { panDeltaPx: { x: totalDeltaX, y: totalDeltaY } },
                coordinatorOptions
            );
            this.#publishProposal(this.#dragSession, res.viewport, "drag");
        }

        // 2. Flush Pinch
        if (this.#pinchSession) {
            const totalScaleFactor = this.#pinchSession.initialDistance > 0
                ? this.#pinchSession.latestDistance / this.#pinchSession.initialDistance
                : 1;
            const totalDeltaX = this.#pinchSession.latestCentroid.x - this.#pinchSession.startCentroid.x;
            const totalDeltaY = this.#pinchSession.latestCentroid.y - this.#pinchSession.startCentroid.y;
            const res = CartesianViewportOperationCoordinator.transform(
                this.#pinchSession.initialViewport,
                this.#context.coordinateSpace,
                this.#pinchSession.sourceAxes,
                {
                    anchor: this.#pinchSession.startCentroid,
                    panDeltaPx: { x: totalDeltaX, y: totalDeltaY },
                    zoomFactor: totalScaleFactor
                },
                coordinatorOptions
            );
            this.#publishProposal(this.#pinchSession, res.viewport, "pinch");
        }

        // 3. Flush Wheel
        if (this.#wheelSession) {
            const exponent = clamp(
                -this.#wheelSession.totalNormalizedDeltaY,
                MIN_SAFE_WHEEL_EXPONENT,
                MAX_SAFE_WHEEL_EXPONENT
            );
            const factor = Math.exp(exponent);

            const res = CartesianViewportOperationCoordinator.transform(
                this.#wheelSession.initialViewport,
                this.#context.coordinateSpace,
                this.#wheelSession.sourceAxes,
                {
                    anchor: this.#wheelSession.anchor,
                    zoomFactor: factor
                },
                coordinatorOptions
            );
            this.#publishProposal(this.#wheelSession, res.viewport, "wheel");
        }
    }

    #publishProposal(
        session: ChartViewportDragSession | ChartViewportPinchSession | ChartViewportWheelSession,
        proposal: InternalCartesianViewportState,
        source: import("../../models/chart-viewport.models").ChartViewportChangeSource
    ): void {
        const diff = diffInternalViewportStates(session.latestViewport, proposal);
        if (!diff.changed) {
            return;
        }
        const previous = session.latestViewport;
        session.latestViewport = proposal;
        session.changedAxes = diff.changedAxes;
        session.hasChanged = true;

        this.#dispatchChangeEvent(
            source,
            "update",
            proposal,
            previous,
            diff.changedAxes
        );
    }

    #dispatchChangeEvent(
        source: import("../../models/chart-viewport.models").ChartViewportChangeSource,
        phase: import("../../models/chart-viewport.models").ChartViewportChangePhase,
        nextState: InternalCartesianViewportState,
        previousState: InternalCartesianViewportState,
        changedAxes?: readonly import("../../models/chart-viewport.models").ChartViewportAxisRef[]
    ): void {
        const resolvedAxisMap = this.#context.coordinateSpace?.toResolvedAxisInfoMap() ?? {
            x: new Map<string, { baseDomain: readonly unknown[]; resolvedType: ResolvedChartCartesianAxisType }>(
                this.#context.axisScenes.filter(s => s.axis === "x").map(s => [s.axisId ?? "default-x", { baseDomain: [], resolvedType: s.scaleType as ResolvedChartCartesianAxisType }])
            ),
            y: new Map<string, { baseDomain: readonly unknown[]; resolvedType: ResolvedChartCartesianAxisType }>(
                this.#context.axisScenes.filter(s => s.axis === "y").map(s => [s.axisId ?? "default-y", { baseDomain: [], resolvedType: s.scaleType as ResolvedChartCartesianAxisType }])
            )
        };

        const publicState = toPublicViewportState(nextState, resolvedAxisMap);
        const prevPublicState = toPublicViewportState(previousState, resolvedAxisMap);
        const event: ChartViewportChangeEvent = {
            changedAxes: changedAxes ?? [],
            phase,
            previousViewport: prevPublicState,
            source,
            viewport: publicState
        };

        this.#context.onViewportChange(nextState, event);
    }
}
