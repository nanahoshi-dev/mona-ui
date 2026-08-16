import type { ChartSeriesType } from "./chart-series.models";

export interface ChartPointEvent<T = unknown> {
    dataIndex: number;
    datum: T;
    seriesId: string;
    seriesName: string;
    seriesType: ChartSeriesType;
    xValue: unknown;
    yValue: number;
}

export interface ChartPointFocusEvent<T = unknown> {
    dataIndex: number;
    datum: T;
    seriesId: string;
    seriesName: string;
    seriesType: ChartSeriesType;
    xValue: unknown;
    yValue: number;
}

export interface ChartSeriesVisibilityEvent {
    seriesId: string;
    seriesName: string;
    visible: boolean;
}
