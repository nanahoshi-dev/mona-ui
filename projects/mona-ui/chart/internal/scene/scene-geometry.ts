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
    formattedValue?: string;
    index: number;
    isPositive?: boolean;
    percentage?: number;
    point?: ChartPoint;
    radius?: number;
    seriesId: string;
    seriesName: string;
    seriesType: ChartSeriesType;
    sliceId?: string;
    visualBounds?: ChartRect;
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
