import type { ChartPoint, ChartRect } from "../../models/chart.models";
import type { ChartSeriesType } from "../../models/chart-series.models";
import type { ChartStackMode } from "../../models/chart-stack.models";

export type ChartInteractionXKey = number | string;

export interface ChartCornerRadii {
    readonly bottomLeft: number;
    readonly bottomRight: number;
    readonly topLeft: number;
    readonly topRight: number;
}

export interface SceneArcHitGeometry {
    center: ChartPoint;
    endAngle: number;
    innerRadius: number;
    outerRadius: number;
    padAngle: number;
    startAngle: number;
}

export interface SceneBar {
    animationKey?: string;
    cornerRadii?: ChartCornerRadii;
    datum: unknown;
    height: number;
    index: number;
    isPositive: boolean;
    radius: number;
    renderOpacity?: number;
    stackEndValue?: number;
    stackGroup?: string;
    stackMode?: ChartStackMode;
    stackPercentage?: number;
    stackPosition?: "inner" | "outer" | "single";
    stackStartValue?: number;
    stackTotal?: number;
    width: number;
    x: number;
    xValue: unknown;
    y: number;
    yValue: number;
}

export interface SceneHitTarget {
    angle?: number;
    animationKey?: string;
    arc?: SceneArcHitGeometry;
    borderRadius?: number;
    bounds?: ChartRect;
    category?: unknown;
    color?: string;
    cornerRadii?: ChartCornerRadii;
    datum: unknown;
    formattedCategory?: string;
    formattedPercentage?: string;
    formattedSize?: string;
    formattedStackPercentage?: string;
    formattedStackTotal?: string;
    formattedValue?: string;
    index: number;
    isPositive?: boolean;
    percentage?: number;
    point?: ChartPoint;
    radius?: number;
    renderOrder?: number;
    seriesId: string;
    seriesName: string;
    seriesType: ChartSeriesType;
    sizeValue?: number;
    sliceId?: string;
    stackEnd?: number;
    stackGroup?: string;
    stackMode?: ChartStackMode;
    stackPercentage?: number;
    stackPosition?: "inner" | "outer" | "single";
    stackStart?: number;
    stackTotal?: number;
    visualBounds?: ChartRect;
    visualRadius?: number;
    xKey: ChartInteractionXKey;
    xValue: unknown;
    yValue: number;
}

export interface ChartInteractionBucket {
    readonly anchor: ChartPoint;
    readonly hits: readonly SceneHitTarget[];
    readonly order: number;
    readonly xKey: ChartInteractionXKey;
    readonly xValue: unknown;
}

export interface ScenePoint {
    animationKey?: string;
    datum: unknown;
    defined: boolean;
    index: number;
    renderOpacity?: number;
    x: number;
    xValue: unknown;
    y: number;
    yValue: number;
}

export interface SceneAreaPoint extends ScenePoint {
    readonly baseY: number;
    readonly stackEndValue?: number;
    readonly stackPercentage?: number;
    readonly stackStartValue?: number;
    readonly stackTotal?: number;
    readonly synthetic?: boolean;
}

export interface SceneMarker {
    readonly animationKey: string;
    readonly datum: unknown;
    readonly formattedSize?: string;
    readonly index: number;
    readonly radius: number;
    readonly renderOpacity?: number;
    readonly sizeValue?: number;
    readonly x: number;
    readonly xValue: unknown;
    readonly y: number;
    readonly yValue: number;
}
