import type { ChartPoint } from "../../models/chart.models";
import type { ChartViewportAxisRef } from "../../models/chart-viewport.models";
import type { InternalCartesianViewportState } from "./cartesian-viewport-normalizer";

export type ViewportGestureKind = "idle" | "drag-pan" | "pinch" | "wheel";

export type ViewportGestureCancelReason =
    | "escape"
    | "navigation-disabled"
    | "pointer-cancel"
    | "lost-pointer-capture"
    | "destroy";

export interface ChartViewportDragSession {
    changedAxes: readonly ChartViewportAxisRef[];
    hasChanged: boolean;
    readonly initialViewport: InternalCartesianViewportState;
    isThresholdMet: boolean;
    latestPoint: ChartPoint;
    latestViewport: InternalCartesianViewportState;
    readonly pointerId: number;
    readonly sourceAxes: readonly ChartViewportAxisRef[];
    readonly startPoint: ChartPoint;
}

export interface ChartViewportPinchSession {
    changedAxes: readonly ChartViewportAxisRef[];
    hasChanged: boolean;
    readonly initialDistance: number;
    readonly initialViewport: InternalCartesianViewportState;
    latestCentroid: ChartPoint;
    latestDistance: number;
    latestViewport: InternalCartesianViewportState;
    readonly pointer1Id: number;
    readonly pointer2Id: number;
    readonly sourceAxes: readonly ChartViewportAxisRef[];
    readonly startCentroid: ChartPoint;
}

export interface ChartViewportWheelSession {
    readonly anchor: ChartPoint;
    changedAxes: readonly ChartViewportAxisRef[];
    endTimerId: ReturnType<typeof setTimeout> | null;
    hasChanged: boolean;
    readonly initialViewport: InternalCartesianViewportState;
    latestAnchor: ChartPoint;
    latestViewport: InternalCartesianViewportState;
    readonly sourceAxes: readonly ChartViewportAxisRef[];
    totalNormalizedDeltaY: number;
}
