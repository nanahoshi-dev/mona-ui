import type { ChartPoint, ChartRect } from "../../models/chart.models";
import type { ChartSeriesType } from "../../models/chart-series.models";

export type ChartInteractionXKey = string | number;

export interface SceneBar {
    datum: unknown;
    height: number;
    index: number;
    isPositive: boolean;
    radius: number;
    width: number;
    x: number;
    xValue: unknown;
    y: number;
    yValue: number;
}

export interface SceneHitTarget {
    borderRadius?: number;
    bounds?: ChartRect;
    datum: unknown;
    index: number;
    isPositive?: boolean;
    point?: ChartPoint;
    radius?: number;
    seriesId: string;
    seriesName: string;
    seriesType: ChartSeriesType;
    visualBounds?: ChartRect;
    xKey: ChartInteractionXKey;
    xValue: unknown;
    yValue: number;
}

export interface ChartInteractionBucket {
    readonly centerX: number;
    readonly hits: readonly SceneHitTarget[];
    readonly xKey: ChartInteractionXKey;
    readonly xValue: unknown;
}

export interface ScenePoint {
    datum: unknown;
    defined: boolean;
    index: number;
    x: number;
    xValue: unknown;
    y: number;
    yValue: number;
}

