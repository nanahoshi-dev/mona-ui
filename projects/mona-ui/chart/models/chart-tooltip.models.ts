import type { ChartSeriesType } from "./chart-series.models";
import type { ChartStackMode } from "./chart-stack.models";

export type ChartPointValueKind = "range" | "scalar";

export interface ChartTooltipPointContext<T = unknown> {
    category?: unknown;
    color: string;
    dataIndex: number;
    datum: T;
    formattedCategory?: string;
    formattedFrom?: string;
    formattedPercentage?: string;
    formattedSize?: string;
    formattedStackPercentage?: string;
    formattedStackTotal?: string;
    formattedTo?: string;
    formattedX: string;
    formattedY: string;
    fromValue?: number;
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
    toValue?: number;
    valueKind?: ChartPointValueKind;
    xValue: unknown;
    yValue?: number;
}

export interface ChartTooltipTemplateContext<T = unknown> {
    $implicit: ChartTooltipPointContext<T>;
    point: ChartTooltipPointContext<T>;
    points: readonly ChartTooltipPointContext<T>[];
    series: readonly string[];
    shared: boolean;
}
