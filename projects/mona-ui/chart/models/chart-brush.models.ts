import type { ChartRect } from "./chart.models";
import type { ChartSelectedPoint } from "./chart-selection.models";

export type ChartBrushMode = "x" | "y" | "xy";

export type ChartBrushActivation = "drag" | "shift-drag";

export type ChartBrushLineStyle = "solid" | "dashed" | "dotted";

export type ChartBrushHitPolicy = "center" | "intersect";

export type ChartBrushSelectionBehavior =
    | "none"
    | "replace"
    | "add"
    | "remove"
    | "toggle";

export type ChartBrushPhase = "start" | "update" | "end" | "cancel";

export type ChartBrushCancelReason =
    | "authority-change"
    | "component-disabled"
    | "data-change"
    | "destroyed"
    | "disabled"
    | "escape"
    | "lost-pointer-capture"
    | "pointer-cancel"
    | "pointer-leave"
    | "viewport-change";

export interface ChartBrushCategoryRange {
    readonly axis: "x" | "y";
    readonly axisId: string;
    readonly fromIndex: number;
    readonly fromValue: unknown;
    readonly kind: "category";
    readonly toIndex: number;
    readonly toValue: unknown;
}

export interface ChartBrushContinuousRange {
    readonly axis: "x" | "y";
    readonly axisId: string;
    readonly from: number | Date;
    readonly kind: "continuous";
    readonly scaleType:
        | "linear"
        | "log"
        | "pow"
        | "sqrt"
        | "symlog"
        | "time"
        | "utc";
    readonly to: number | Date;
}

export type ChartBrushAxisRange =
    | ChartBrushCategoryRange
    | ChartBrushContinuousRange;

export interface ChartBrushChangeEvent<T = unknown> {
    readonly cancelReason?: ChartBrushCancelReason;
    readonly matchedMarkIds?: readonly string[];
    readonly matchedPoints?: readonly ChartSelectedPoint<T>[];
    readonly mode: ChartBrushMode;
    readonly phase: ChartBrushPhase;
    readonly pixelBounds: ChartRect | null;
    readonly xRange?: ChartBrushAxisRange;
    readonly yRange?: ChartBrushAxisRange;
}
