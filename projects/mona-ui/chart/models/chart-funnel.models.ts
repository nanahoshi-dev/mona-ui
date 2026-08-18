import type { ChartRect } from "./chart.models";

export type ChartFunnelOrientation = "horizontal" | "vertical";

export type ChartFunnelLabelContent =
    | "category"
    | "category-value"
    | "category-value-conversion"
    | "value";

export interface ChartFunnelPointMetadata {
    readonly category: unknown;
    readonly conversionRate?: number;
    readonly dropOff?: number;
    readonly formattedCategory: string;
    readonly formattedConversionRate?: string;
    readonly formattedOverallConversionRate?: string;
    readonly formattedValue: string;
    readonly overallConversionRate?: number;
    readonly previousValue?: number;
    readonly stageId: string;
    readonly stageIndex: number;
    readonly value: number;
}

export interface ChartFunnelStageVisibilityEvent<T = unknown> {
    readonly category: unknown;
    readonly dataIndex: number;
    readonly datum: T;
    readonly formattedCategory: string;
    readonly seriesId: string;
    readonly seriesName: string;
    readonly seriesType: "funnel";
    readonly stageId: string;
    readonly visible: boolean;
}

export interface ChartFunnelStageContext<T = unknown> {
    readonly bounds: ChartRect;
    readonly category: unknown;
    readonly color: string;
    readonly conversionRate?: number;
    readonly dataIndex: number;
    readonly datum: T;
    readonly dropOff?: number;
    readonly formattedCategory: string;
    readonly formattedConversionRate?: string;
    readonly formattedOverallConversionRate?: string;
    readonly formattedValue: string;
    readonly overallConversionRate?: number;
    readonly previousValue?: number;
    readonly stageId: string;
    readonly stageIndex: number;
    readonly textColor?: string;
    readonly value: number;
}

export interface ChartFunnelLabelTemplateContext<T = unknown> {
    readonly $implicit: ChartFunnelStageContext<T>;
    readonly bounds: ChartRect;
    readonly category: unknown;
    readonly color: string;
    readonly conversionRate?: number;
    readonly dataIndex: number;
    readonly datum: T;
    readonly dropOff?: number;
    readonly formattedCategory: string;
    readonly formattedConversionRate?: string;
    readonly formattedOverallConversionRate?: string;
    readonly formattedValue: string;
    readonly overallConversionRate?: number;
    readonly previousValue?: number;
    readonly stage: ChartFunnelStageContext<T>;
    readonly stageId: string;
    readonly stageIndex: number;
    readonly textColor?: string;
    readonly value: number;
}
