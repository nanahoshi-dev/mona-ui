import type { ChartSeriesType } from "./chart-series.models";

export interface ChartTooltipPointContext<T = unknown> {
    color: string;
    dataIndex: number;
    datum: T;
    formattedX: string;
    formattedY: string;
    seriesId: string;
    seriesName: string;
    seriesType: ChartSeriesType;
    xValue: unknown;
    yValue: number;
}

export interface ChartTooltipTemplateContext<T = unknown> {
    $implicit: ChartTooltipPointContext<T>;
    point: ChartTooltipPointContext<T>;
    points: readonly ChartTooltipPointContext<T>[];
    series: readonly string[];
    shared: boolean;
}
