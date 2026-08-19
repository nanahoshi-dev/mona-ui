import type { ChartPoint } from "../../models/chart.models";
import type { ChartViewportAxisRef } from "../../models/chart-viewport.models";
import type { InternalCartesianViewportState } from "./cartesian-viewport-normalizer";

export type ViewportGestureKind = "idle" | "drag-pan" | "pinch" | "wheel";

export interface ChartViewportDragSession {
    readonly initialViewport: InternalCartesianViewportState;
    isThresholdMet: boolean;
    latestPoint: ChartPoint;
    readonly pointerId: number;
    readonly sourceAxes: readonly ChartViewportAxisRef[];
    readonly startPoint: ChartPoint;
}

export interface ChartViewportPinchSession {
    readonly initialDistance: number;
    readonly initialViewport: InternalCartesianViewportState;
    latestCentroid: ChartPoint;
    latestDistance: number;
    readonly pointer1Id: number;
    readonly pointer2Id: number;
    readonly sourceAxes: readonly ChartViewportAxisRef[];
    readonly startCentroid: ChartPoint;
}

export interface ChartViewportWheelSession {
    accumulatedDeltaY: number;
    endTimerId: ReturnType<typeof setTimeout> | null;
    readonly initialViewport: InternalCartesianViewportState;
    latestAnchor: ChartPoint;
    readonly sourceAxes: readonly ChartViewportAxisRef[];
}
