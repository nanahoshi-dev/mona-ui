import type { ChartPoint, ChartRect } from "../../models/chart.models";
import type { ChartSeriesType } from "../../models/chart-series.models";

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
    bounds?: ChartRect;
    datum: unknown;
    index: number;
    point?: ChartPoint;
    radius?: number;
    seriesId: string;
    seriesName: string;
    seriesType: ChartSeriesType;
    xValue: unknown;
    yValue: number;
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
