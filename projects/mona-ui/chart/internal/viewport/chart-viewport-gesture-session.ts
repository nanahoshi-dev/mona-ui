import type { ChartPoint } from "../../models/chart.models";
import type { ChartViewportAxisRef } from "../../models/chart-viewport.models";
import type { InternalCartesianViewportState } from "./cartesian-viewport-normalizer";

export type ViewportGestureKind = "idle" | "drag-pan" | "pinch" | "wheel";

export interface ChartViewportDragSession {
    readonly initialViewport: InternalCartesianViewportState;
    isThresholdMet: boolean;
    lastPoint: ChartPoint;
    readonly pointerId: number;
    readonly startPoint: ChartPoint;
    readonly targetAxes: readonly ChartViewportAxisRef[];
}

export interface ChartViewportPinchSession {
    readonly initialDistance: number;
    readonly initialViewport: InternalCartesianViewportState;
    lastCentroid: ChartPoint;
    lastDistance: number;
    readonly pointer1Id: number;
    readonly pointer2Id: number;
    readonly startCentroid: ChartPoint;
    readonly targetAxes: readonly ChartViewportAxisRef[];
}

export interface ChartViewportWheelSession {
    endTimerId: ReturnType<typeof setTimeout> | null;
    readonly initialViewport: InternalCartesianViewportState;
    readonly targetAxes: readonly ChartViewportAxisRef[];
}
