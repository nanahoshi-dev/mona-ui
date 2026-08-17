import type { ChartSeriesType } from "./chart-series.models";
import type { ChartStackMode } from "./chart-stack.models";

export interface ChartTooltipPointContext<T = unknown> {
    category?: unknown;
    color: string;
    dataIndex: number;
    datum: T;
    formattedCategory?: string;
    formattedPercentage?: string;
    formattedSize?: string;
    formattedStackPercentage?: string;
    formattedStackTotal?: string;
    formattedX: string;
    formattedY: string;
    markId: string;
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

export interface ChartTooltipTemplateContext<T = unknown> {
    $implicit: ChartTooltipPointContext<T>;
    point: ChartTooltipPointContext<T>;
    points: readonly ChartTooltipPointContext<T>[];
    series: readonly string[];
    shared: boolean;
}
