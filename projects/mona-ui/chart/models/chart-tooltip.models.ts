import type { ChartFinancialDirection } from "./chart-financial.models";
import type { ChartOhlcPointValue, ChartPointValueKind } from "./chart-point-value.models";
import type { ChartSeriesType } from "./chart-series.models";
import type { ChartStackMode } from "./chart-stack.models";

export type { ChartPointValueKind } from "./chart-point-value.models";

export interface ChartTooltipPointContext<T = unknown> {
    category?: unknown;
    categoryX?: string;
    categoryY?: string;
    change?: number;
    changePercentage?: number;
    close?: number;
    color: string;
    dataIndex: number;
    datum: T;
    financial?: ChartOhlcPointValue;
    financialDirection?: ChartFinancialDirection;
    formattedCategory?: string;
    formattedChange?: string;
    formattedChangePercentage?: string;
    formattedClose?: string;
    formattedFrom?: string;
    formattedHigh?: string;
    formattedLow?: string;
    formattedOpen?: string;
    formattedPercentage?: string;
    formattedSize?: string;
    formattedStackPercentage?: string;
    formattedStackTotal?: string;
    formattedTo?: string;
    formattedX: string;
    formattedXValue?: string;
    formattedY: string;
    formattedYCategory?: string;
    fromValue?: number;
    high?: number;
    low?: number;
    markId: string;
    open?: number;
    percentage?: number;
    rawValue?: unknown;
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
    yCategory?: unknown;
    yValue?: number;
}

export interface ChartTooltipTemplateContext<T = unknown> {
    $implicit: ChartTooltipPointContext<T>;
    point: ChartTooltipPointContext<T>;
    points: readonly ChartTooltipPointContext<T>[];
    series: readonly string[];
    shared: boolean;
}
