import type { ChartSeriesType } from "./chart-series.models";

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
    xValue: unknown;
    yValue: number;
}

export interface ChartSeriesVisibilityEvent {
    seriesId: string;
    seriesName: string;
    visible: boolean;
}
