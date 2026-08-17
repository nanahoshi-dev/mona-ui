import type { ChartSeriesType } from "./chart-series.models";
import type { ChartStackMode } from "./chart-stack.models";

export interface ChartPointEvent<T = unknown> {
    category?: unknown;
    dataIndex: number;
    datum: T;
    percentage?: number;
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
    xValue: unknown;
    yValue: number;
}

export interface ChartPointFocusEvent<T = unknown> {
    category?: unknown;
    dataIndex: number;
    datum: T;
    percentage?: number;
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
    xValue: unknown;
    yValue: number;
}

export interface ChartSeriesVisibilityEvent {
    seriesId: string;
    seriesName: string;
    visible: boolean;
}
