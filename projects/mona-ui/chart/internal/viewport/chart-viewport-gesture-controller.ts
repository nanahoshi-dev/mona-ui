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
import { CartesianViewportController } from "./cartesian-viewport-controller";
import { CartesianViewportLinker } from "./cartesian-viewport-linker";
import {
    areInternalViewportStatesEqual,
    toPublicViewportState,
    type InternalCartesianViewportState
} from "./cartesian-viewport-normalizer";
import { CartesianViewportTargetResolver } from "./cartesian-viewport-target-resolver";
import type { NormalizedChartNavigationOptions } from "./chart-navigation-options";
import type {
    ChartViewportDragSession,
    ChartViewportPinchSession,
    ChartViewportWheelSession
} from "./chart-viewport-gesture-session";

export interface ChartViewportGestureContext {
    axisScenes: readonly ChartAxisScene[];
    constraints?: readonly ChartViewportConstraint[];
    coordinateSpace?: CartesianAxisCoordinateSpace;
    currentViewport: InternalCartesianViewportState;
    linkGroups?: readonly ChartViewportLinkGroup[];
    navigationOptions: NormalizedChartNavigationOptions;
    orientation: "horizontal" | "vertical";
    plotRect: ChartRect;
    onCursorChange(cursor: string | null): void;
    onViewportChange(nextState: InternalCartesianViewportState, event: ChartViewportChangeEvent): void;
}

export class ChartViewportGestureController {
    #activePointers = new Map<number, ChartPoint>();
    #context: ChartViewportGestureContext;
    #dragSession: ChartViewportDragSession | null = null;
    #pinchSession: ChartViewportPinchSession | null = null;
    #wheelSession: ChartViewportWheelSession | null = null;
    #isClickSuppressed = false;

    public constructor(context: ChartViewportGestureContext) {
        this.#context = context;
    }

    public updateContext(context: ChartViewportGestureContext): void {
        this.#context = context;
    }

    public get isClickSuppressed(): boolean {
        return this.#isClickSuppressed;
    }

    public get isDragging(): boolean {
        return this.#dragSession !== null && this.#dragSession.isThresholdMet;
    }

    public get isPinching(): boolean {
        return this.#pinchSession !== null;
    }

    public handlePointerDown(event: PointerEvent, elementPoint: ChartPoint): boolean {
        const nav = this.#context.navigationOptions;
        if (!nav.enabled) return false;

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
                nav.zoomAxes
            );

            const targetAxes = CartesianViewportLinker.expandTargetAxesWithLinks(
                resolved.targetAxes,
                this.#context.linkGroups
            );

            this.#dragSession = null;
            this.#pinchSession = {
                initialDistance: distance,
                initialViewport: this.#context.currentViewport,
                lastCentroid: centroid,
                lastDistance: distance,
                pointer1Id: entries[0][0],
                pointer2Id: entries[1][0],
                startCentroid: centroid,
                targetAxes
            };

            this.#dispatchChangeEvent("pinch", "start", this.#context.currentViewport, this.#context.currentViewport, targetAxes);
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
            nav.panAxes
        );

        if (resolved.targetAxes.length === 0) return false;

        const targetAxes = CartesianViewportLinker.expandTargetAxesWithLinks(
            resolved.targetAxes,
            this.#context.linkGroups
        );

        this.#dragSession = {
            initialViewport: this.#context.currentViewport,
            isThresholdMet: false,
            lastPoint: elementPoint,
            pointerId: event.pointerId,
            startPoint: elementPoint,
            targetAxes
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

            const scaleFactor = this.#pinchSession.lastDistance > 0
                ? distance / this.#pinchSession.lastDistance
                : 1;

            const deltaX = centroid.x - this.#pinchSession.lastCentroid.x;
            const deltaY = centroid.y - this.#pinchSession.lastCentroid.y;

            let updated = {
                changed: false,
                changedAxes: [] as readonly import("../../models/chart-viewport.models").ChartViewportAxisRef[],
                viewport: this.#context.currentViewport
            };

            const options = {
                clampToData: this.#context.navigationOptions.clampToData,
                constraints: this.#context.constraints,
                minVisibleCategories: this.#context.navigationOptions.minVisibleCategories
            };

            if (Math.abs(scaleFactor - 1) > 0.001) {
                updated = CartesianViewportController.zoom(
                    updated.viewport,
                    this.#context.coordinateSpace,
                    this.#pinchSession.targetAxes,
                    scaleFactor,
                    centroid,
                    options
                );
            }

            if (Math.abs(deltaX) > 0.5 || Math.abs(deltaY) > 0.5) {
                updated = CartesianViewportController.pan(
                    updated.viewport,
                    this.#context.coordinateSpace,
                    this.#pinchSession.targetAxes,
                    { x: deltaX, y: deltaY },
                    options
                );
            }

            this.#pinchSession.lastCentroid = centroid;
            this.#pinchSession.lastDistance = distance;

            if (updated.changed) {
                this.#dispatchChangeEvent("pinch", "update", updated.viewport, this.#context.currentViewport, updated.changedAxes);
            }
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
                    this.#dispatchChangeEvent("drag", "start", this.#context.currentViewport, this.#context.currentViewport, this.#dragSession.targetAxes);
                } else {
                    return false;
                }
            }

            if (!this.#context.coordinateSpace) return false;

            const deltaX = elementPoint.x - this.#dragSession.lastPoint.x;
            const deltaY = elementPoint.y - this.#dragSession.lastPoint.y;

            this.#dragSession.lastPoint = elementPoint;

            const res = CartesianViewportController.pan(
                this.#context.currentViewport,
                this.#context.coordinateSpace,
                this.#dragSession.targetAxes,
                { x: deltaX, y: deltaY },
                {
                    clampToData: this.#context.navigationOptions.clampToData,
                    constraints: this.#context.constraints,
                    minVisibleCategories: this.#context.navigationOptions.minVisibleCategories
                }
            );

            if (res.changed) {
                this.#dispatchChangeEvent("drag", "update", res.viewport, this.#context.currentViewport, res.changedAxes);
            }
            return true;
        }

        return false;
    }

    public handlePointerUp(event: PointerEvent): boolean {
        this.#activePointers.delete(event.pointerId);

        if (this.#pinchSession) {
            if (event.pointerId === this.#pinchSession.pointer1Id || event.pointerId === this.#pinchSession.pointer2Id) {
                this.#dispatchChangeEvent("pinch", "end", this.#context.currentViewport, this.#pinchSession.initialViewport, this.#pinchSession.targetAxes);
                this.#pinchSession = null;
                return true;
            }
        }

        if (this.#dragSession && this.#dragSession.pointerId === event.pointerId) {
            if (this.#dragSession.isThresholdMet) {
                this.#dispatchChangeEvent("drag", "end", this.#context.currentViewport, this.#dragSession.initialViewport, this.#dragSession.targetAxes);
            }
            this.#dragSession = null;
            this.#context.onCursorChange(null);
            return true;
        }

        return false;
    }

    public handlePointerCancel(event: PointerEvent): boolean {
        this.#activePointers.delete(event.pointerId);

        if (this.#pinchSession) {
            if (event.pointerId === this.#pinchSession.pointer1Id || event.pointerId === this.#pinchSession.pointer2Id) {
                this.#dispatchChangeEvent("pinch", "end", this.#context.currentViewport, this.#pinchSession.initialViewport, this.#pinchSession.targetAxes);
                this.#pinchSession = null;
                return true;
            }
        }

        if (this.#dragSession && this.#dragSession.pointerId === event.pointerId) {
            if (this.#dragSession.isThresholdMet) {
                this.#dispatchChangeEvent("drag", "end", this.#context.currentViewport, this.#dragSession.initialViewport, this.#dragSession.targetAxes);
            }
            this.#dragSession = null;
            this.#context.onCursorChange(null);
            return true;
        }

        return false;
    }

    public cancel(reason?: string): void {
        this.#activePointers.clear();
        if (this.#wheelSession) {
            if (this.#wheelSession.endTimerId !== null) {
                clearTimeout(this.#wheelSession.endTimerId);
            }
            this.#dispatchChangeEvent("wheel", "end", this.#context.currentViewport, this.#wheelSession.initialViewport, this.#wheelSession.targetAxes);
            this.#wheelSession = null;
        }
        if (this.#pinchSession) {
            this.#dispatchChangeEvent("pinch", "end", this.#context.currentViewport, this.#pinchSession.initialViewport, this.#pinchSession.targetAxes);
            this.#pinchSession = null;
        }
        if (this.#dragSession) {
            if (this.#dragSession.isThresholdMet) {
                this.#dispatchChangeEvent("drag", "end", this.#context.currentViewport, this.#dragSession.initialViewport, this.#dragSession.targetAxes);
            }
            this.#dragSession = null;
        }
        this.#isClickSuppressed = false;
        this.#context.onCursorChange(null);
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
            nav.zoomAxes
        );

        if (resolved.targetAxes.length === 0) return false;

        const targetAxes = CartesianViewportLinker.expandTargetAxesWithLinks(
            resolved.targetAxes,
            this.#context.linkGroups
        );

        let deltaY = event.deltaY;
        if (event.deltaMode === 1) {
            deltaY *= 16;
        } else if (event.deltaMode === 2) {
            deltaY *= this.#context.plotRect.height;
        }

        const sensitivity = nav.wheelSensitivity ?? 0.0015;
        const normalizedDelta = deltaY * sensitivity;
        const factor = Math.exp(-normalizedDelta);

        if (!this.#wheelSession) {
            this.#wheelSession = {
                endTimerId: null,
                initialViewport: this.#context.currentViewport,
                targetAxes
            };
            this.#dispatchChangeEvent("wheel", "start", this.#context.currentViewport, this.#context.currentViewport, targetAxes);
        }

        if (this.#wheelSession.endTimerId !== null) {
            clearTimeout(this.#wheelSession.endTimerId);
        }

        this.#wheelSession.endTimerId = setTimeout(() => {
            if (this.#wheelSession) {
                this.#dispatchChangeEvent("wheel", "end", this.#context.currentViewport, this.#wheelSession.initialViewport, this.#wheelSession.targetAxes);
                this.#wheelSession = null;
            }
        }, 150);

        const res = CartesianViewportController.zoom(
            this.#context.currentViewport,
            this.#context.coordinateSpace,
            targetAxes,
            factor,
            elementPoint,
            {
                clampToData: nav.clampToData,
                constraints: this.#context.constraints,
                minVisibleCategories: nav.minVisibleCategories
            }
        );

        if (res.changed) {
            this.#dispatchChangeEvent("wheel", "update", res.viewport, this.#context.currentViewport, res.changedAxes);
            return true;
        }

        return false;
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
