export type ChartPolarLabelPosition = "inside" | "outside";

export type ChartPolarLabelSide = "left" | "right";

export type ChartPolarLabelContent = "category" | "category-percentage" | "percentage" | "value";

export type ChartValueFormatter<T = unknown> = (value: T, index: number) => string;

export interface ChartLabelMeasurement {
    height: number;
    width: number;
}

export interface ChartSliceContext {
    category: unknown;
    color: string;
    dataIndex: number;
    datum: unknown;
    formattedCategory: string;
    formattedPercentage: string;
    formattedValue: string;
    percentage: number;
    seriesId: string;
    seriesName: string;
    seriesType: "donut" | "pie";
    value: number;
}

export interface ChartSliceLabelTemplateContext {
    $implicit: ChartSliceContext;
    category: unknown;
    color: string;
    dataIndex: number;
    datum: unknown;
    formattedCategory: string;
    formattedPercentage: string;
    formattedValue: string;
    percentage: number;
    seriesId: string;
    seriesName: string;
    seriesType: "donut" | "pie";
    slice: ChartSliceContext;
    value: number;
}

export interface ChartCenterTemplateContext {
    $implicit: number;
    formattedTotal: string;
    seriesId: string;
    seriesName: string;
    total: number;
    visibleSliceCount: number;
}

export interface ChartSliceVisibilityEvent {
    category: unknown;
    dataIndex: number;
    datum: unknown;
    seriesId: string;
    seriesName: string;
    seriesType: "donut" | "pie";
    visible: boolean;
}
