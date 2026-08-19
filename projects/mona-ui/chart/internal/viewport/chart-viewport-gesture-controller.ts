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

export interface ChartViewportGestureContext {
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

export class ChartViewportGestureController {
    readonly #activePointers = new Map<number, ChartPoint>();
    readonly #cancelFrame: (handle: number) => void;
    #context: ChartViewportGestureContext;
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

    public updateContext(context: ChartViewportGestureContext): void {
        this.#context = context;
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

        this.#targetElement = targetElement ?? (event.target as Element | null);
        this.#activePointers.set(event.pointerId, elementPoint);

        // Check for pinch zoom start (2 pointers)
        if (this.#activePointers.size === 2 && nav.pinchZoom) {
            const entries = Array.from(this.#activePointers.entries());
            const p1 = entries[0][1];
            const p2 = entries[1][1];
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
                return false;
            }

            if (this.#dragSession) {
                this.#flushPendingGestureFrame();
                if (this.#dragSession.isThresholdMet) {
                    this.#dispatchChangeEvent(
                        "drag",
                        "end",
                        this.#dragSession.latestViewport,
                        this.#dragSession.latestViewport,
                        []
                    );
                }
                this.#dragSession = null;
            }

            this.#isClickSuppressed = true;

            const ptr1 = entries[0][0];
            const ptr2 = entries[1][0];
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

        // Single pointer drag pan
        if (event.button !== 0 || !nav.dragPan || this.#activePointers.size > 1) {
            return false;
        }

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

        if (validSourceAxes.length === 0) return false;

        this.#dragSession = {
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

    public handlePointerMove(event: PointerEvent, elementPoint: ChartPoint): boolean {
        if (this.#activePointers.has(event.pointerId)) {
            this.#activePointers.set(event.pointerId, elementPoint);
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

    public handlePointerUp(event: PointerEvent): boolean {
        this.#activePointers.delete(event.pointerId);
        this.#context.releasePointerCapture?.(event.pointerId, this.#targetElement);

        if (this.#pinchSession) {
            if (event.pointerId === this.#pinchSession.pointer1Id || event.pointerId === this.#pinchSession.pointer2Id) {
                this.#flushPendingGestureFrame();
                const endedSession = this.#pinchSession;
                this.#pinchSession = null;

                const ptr1 = endedSession.pointer1Id;
                const ptr2 = endedSession.pointer2Id;
                this.#context.releasePointerCapture?.(ptr1, this.#targetElement);
                this.#context.releasePointerCapture?.(ptr2, this.#targetElement);

                this.#dispatchChangeEvent(
                    "pinch",
                    "end",
                    endedSession.latestViewport,
                    endedSession.latestViewport,
                    []
                );

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
                        this.#dragSession = {
                            changedAxes: [],
                            hasChanged: false,
                            initialViewport: endedSession.latestViewport,
                            isThresholdMet: false,
                            latestPoint: remainingPoint,
                            latestViewport: endedSession.latestViewport,
                            pointerId: remainingPointerId,
                            sourceAxes: validSourceAxes,
                            startPoint: remainingPoint
                        };
                    }
                }

                return true;
            }
        }

        if (this.#dragSession && this.#dragSession.pointerId === event.pointerId) {
            if (this.#dragSession.isThresholdMet) {
                this.#flushPendingGestureFrame();
                const finalViewport = this.#dragSession.latestViewport;
                this.#dispatchChangeEvent(
                    "drag",
                    "end",
                    finalViewport,
                    finalViewport,
                    []
                );
            }
            this.#dragSession = null;
            this.#context.onCursorChange(null);
            return true;
        }

        return false;
    }

    public handlePointerCancel(event: PointerEvent): boolean {
        this.#activePointers.delete(event.pointerId);
        this.#context.releasePointerCapture?.(event.pointerId, this.#targetElement);

        if (this.#pinchSession) {
            if (event.pointerId === this.#pinchSession.pointer1Id || event.pointerId === this.#pinchSession.pointer2Id) {
                this.#flushPendingGestureFrame();
                const endedSession = this.#pinchSession;
                this.#pinchSession = null;

                const ptr1 = endedSession.pointer1Id;
                const ptr2 = endedSession.pointer2Id;
                this.#context.releasePointerCapture?.(ptr1, this.#targetElement);
                this.#context.releasePointerCapture?.(ptr2, this.#targetElement);

                this.#dispatchChangeEvent(
                    "pinch",
                    "end",
                    endedSession.latestViewport,
                    endedSession.latestViewport,
                    []
                );
                return true;
            }
        }

        if (this.#dragSession && this.#dragSession.pointerId === event.pointerId) {
            if (this.#dragSession.isThresholdMet) {
                this.#flushPendingGestureFrame();
                const finalViewport = this.#dragSession.latestViewport;
                this.#dispatchChangeEvent(
                    "drag",
                    "end",
                    finalViewport,
                    finalViewport,
                    []
                );
            }
            this.#dragSession = null;
            this.#context.onCursorChange(null);
            return true;
        }

        return false;
    }

    public handleLostPointerCapture(event: PointerEvent): void {
        this.#activePointers.delete(event.pointerId);

        if (this.#pinchSession) {
            if (event.pointerId === this.#pinchSession.pointer1Id || event.pointerId === this.#pinchSession.pointer2Id) {
                this.#flushPendingGestureFrame();
                const endedSession = this.#pinchSession;
                this.#pinchSession = null;
                this.#dispatchChangeEvent(
                    "pinch",
                    "end",
                    endedSession.latestViewport,
                    endedSession.latestViewport,
                    []
                );
            }
        }

        if (this.#dragSession && this.#dragSession.pointerId === event.pointerId) {
            if (this.#dragSession.isThresholdMet) {
                this.#flushPendingGestureFrame();
                const finalViewport = this.#dragSession.latestViewport;
                this.#dispatchChangeEvent(
                    "drag",
                    "end",
                    finalViewport,
                    finalViewport,
                    []
                );
            }
            this.#dragSession = null;
            this.#context.onCursorChange(null);
        }
    }

    public cancel(reason?: ViewportGestureCancelReason | string): void {
        if (this.#gestureFrameId !== null) {
            this.#cancelFrame(this.#gestureFrameId);
            this.#gestureFrameId = null;
        }

        this.#activePointers.clear();

        if (reason === "destroy") {
            // Silent teardown: do not emit user-facing viewportChange lifecycle output
            if (this.#wheelSession && this.#wheelSession.endTimerId !== null) {
                clearTimeout(this.#wheelSession.endTimerId);
            }
            if (this.#dragSession && this.#dragSession.isThresholdMet) {
                this.#context.releasePointerCapture?.(this.#dragSession.pointerId, this.#targetElement);
            }
            if (this.#pinchSession) {
                this.#context.releasePointerCapture?.(this.#pinchSession.pointer1Id, this.#targetElement);
                this.#context.releasePointerCapture?.(this.#pinchSession.pointer2Id, this.#targetElement);
            }
            this.#wheelSession = null;
            this.#pinchSession = null;
            this.#dragSession = null;
            this.#isClickSuppressed = false;
            this.#context.onCursorChange(null);
            return;
        }

        if (this.#wheelSession) {
            if (this.#wheelSession.endTimerId !== null) {
                clearTimeout(this.#wheelSession.endTimerId);
            }
            const finalViewport = this.#wheelSession.latestViewport;
            this.#dispatchChangeEvent(
                "wheel",
                "end",
                finalViewport,
                finalViewport,
                []
            );
            this.#wheelSession = null;
        }
        if (this.#pinchSession) {
            this.#context.releasePointerCapture?.(this.#pinchSession.pointer1Id, this.#targetElement);
            this.#context.releasePointerCapture?.(this.#pinchSession.pointer2Id, this.#targetElement);
            const finalViewport = this.#pinchSession.latestViewport;
            this.#dispatchChangeEvent(
                "pinch",
                "end",
                finalViewport,
                finalViewport,
                []
            );
            this.#pinchSession = null;
        }
        if (this.#dragSession) {
            if (this.#dragSession.isThresholdMet) {
                this.#context.releasePointerCapture?.(this.#dragSession.pointerId, this.#targetElement);
                const finalViewport = this.#dragSession.latestViewport;
                this.#dispatchChangeEvent(
                    "drag",
                    "end",
                    finalViewport,
                    finalViewport,
                    []
                );
            }
            this.#dragSession = null;
        }

        this.#context.onCursorChange(null);
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
            const rawFactor = Math.exp(-normalizedDelta);
            const factor = clamp(rawFactor, 0.5, 2.0);
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
                this.#flushPendingGestureFrame();
                const prevProposal = this.#wheelSession.latestViewport;
                this.#wheelSession = {
                    anchor: elementPoint,
                    changedAxes: [],
                    endTimerId: null,
                    hasChanged: false,
                    initialViewport: prevProposal,
                    latestAnchor: elementPoint,
                    latestViewport: prevProposal,
                    sourceAxes: validSourceAxes,
                    totalNormalizedDeltaY: 0
                };
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
                const endedSession = this.#wheelSession;
                this.#wheelSession = null;
                this.#dispatchChangeEvent(
                    "wheel",
                    "end",
                    endedSession.latestViewport,
                    endedSession.latestViewport,
                    []
                );
            }
        }, 150);

        this.#requestGestureFrame();
        return true;
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
            if (res.changed) {
                const prevProposal = this.#dragSession.latestViewport;
                this.#dragSession.latestViewport = res.viewport;
                this.#dragSession.changedAxes = res.changedAxes;
                this.#dragSession.hasChanged = true;
                this.#dispatchChangeEvent(
                    "drag",
                    "update",
                    res.viewport,
                    prevProposal,
                    res.changedAxes
                );
            }
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
            if (res.changed) {
                const prevProposal = this.#pinchSession.latestViewport;
                this.#pinchSession.latestViewport = res.viewport;
                this.#pinchSession.changedAxes = res.changedAxes;
                this.#pinchSession.hasChanged = true;
                this.#dispatchChangeEvent(
                    "pinch",
                    "update",
                    res.viewport,
                    prevProposal,
                    res.changedAxes
                );
            }
        }

        // 3. Flush Wheel
        if (this.#wheelSession && this.#wheelSession.totalNormalizedDeltaY !== 0) {
            const rawFactor = Math.exp(-this.#wheelSession.totalNormalizedDeltaY);
            const factor = clamp(rawFactor, 0.5, 2.0);

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
            if (res.changed) {
                const prevProposal = this.#wheelSession.latestViewport;
                this.#wheelSession.latestViewport = res.viewport;
                this.#wheelSession.changedAxes = res.changedAxes;
                this.#wheelSession.hasChanged = true;
                this.#dispatchChangeEvent(
                    "wheel",
                    "update",
                    res.viewport,
                    prevProposal,
                    res.changedAxes
                );
            }
        }
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
