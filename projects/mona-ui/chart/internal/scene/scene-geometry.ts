import type { ChartPoint, ChartRect } from "../../models/chart.models";
import type { ChartSeriesType } from "../../models/chart-series.models";

export type ChartInteractionXKey = number | string;

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
    datum: unknown;
    height: number;
    index: number;
    isPositive: boolean;
    radius: number;
    renderOpacity?: number;
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
    datum: unknown;
    formattedCategory?: string;
    formattedPercentage?: string;
    formattedSize?: string;
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
