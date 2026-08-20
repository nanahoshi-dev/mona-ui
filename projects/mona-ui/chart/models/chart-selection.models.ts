import type { ChartSeriesType } from "./chart-series.models";

export type ChartSelectionMode = "single" | "multiple";

export type ChartSelectionChangeSource =
    | "brush"
    | "click"
    | "keyboard"
    | "programmatic";

export interface ChartSelectedPoint<T = unknown> {
    readonly close?: number;
    readonly dataIndex: number;
    readonly datum: T;
    readonly fromValue?: number;
    readonly high?: number;
    readonly low?: number;
    readonly markId: string;
    readonly open?: number;
    readonly rawValue?: unknown;
    readonly seriesId: string;
    readonly seriesName: string;
    readonly seriesType: ChartSeriesType;
    readonly stackEnd?: number;
    readonly stackPercentage?: number;
    readonly stackStart?: number;
    readonly toValue?: number;
    readonly value?: unknown;
    readonly xValue?: unknown;
    readonly yValue?: unknown;
}

export interface ChartSelectionChangeEvent<T = unknown> {
    readonly addedMarkIds: readonly string[];
    readonly changedPoints: readonly ChartSelectedPoint<T>[];
    readonly previousSelectedMarkIds: readonly string[];
    readonly removedMarkIds: readonly string[];
    readonly selectedMarkIds: readonly string[];
    readonly source: ChartSelectionChangeSource;
    readonly visibleSelectedPoints: readonly ChartSelectedPoint<T>[];
}
