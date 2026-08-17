import type { ChartPoint, ChartRect } from "../../models/chart.models";
import type { ChartSeriesType } from "../../models/chart-series.models";
import type { ChartStackMode } from "../../models/chart-stack.models";
import type { ChartPointValueKind } from "../../models/chart-tooltip.models";

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

export interface SceneRangeBar {
    readonly animationKey?: string;
    readonly datum: unknown;
    readonly formattedFrom?: string;
    readonly formattedTo?: string;
    readonly fromValue: number;
    readonly height: number;
    readonly highValue: number;
    readonly index: number;
    readonly lowValue: number;
    readonly radius: number;
    readonly renderOpacity?: number;
    readonly toValue: number;
    readonly width: number;
    readonly x: number;
    readonly xValue: unknown;
    readonly y: number;
}

export interface SceneRangeHitValue {
    readonly formattedFrom: string;
    readonly formattedTo: string;
    readonly fromValue: number;
    readonly highValue: number;
    readonly lowValue: number;
    readonly toValue: number;
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
    formattedFrom?: string;
    formattedPercentage?: string;
    formattedSize?: string;
    formattedStackPercentage?: string;
    formattedStackTotal?: string;
    formattedTo?: string;
    formattedValue?: string;
    fromValue?: number;
    highPoint?: ChartPoint;
    highValue?: number;
    index: number;
    isPositive?: boolean;
    lowPoint?: ChartPoint;
    lowValue?: number;
    percentage?: number;
    point?: ChartPoint;
    radius?: number;
    range?: SceneRangeHitValue;
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
    toValue?: number;
    valueKind?: ChartPointValueKind;
    visualBounds?: ChartRect;
    visualRadius?: number;
    xKey: ChartInteractionXKey;
    xValue: unknown;
    yValue?: number;
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

export interface SceneRangeAreaPoint {
    readonly animationKey?: string;
    readonly datum: unknown;
    readonly defined: boolean;
    readonly formattedFrom?: string;
    readonly formattedTo?: string;
    readonly fromPoint?: ChartPoint;
    readonly fromValue?: number;
    readonly highPoint?: ChartPoint;
    readonly highValue?: number;
    readonly index: number;
    readonly lowPoint?: ChartPoint;
    readonly lowValue?: number;
    readonly renderOpacity?: number;
    readonly toPoint?: ChartPoint;
    readonly toValue?: number;
    readonly x: number;
    readonly xValue: unknown;
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
