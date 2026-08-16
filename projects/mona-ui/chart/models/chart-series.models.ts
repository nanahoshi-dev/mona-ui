export type ChartAreaFillMode = "gradient" | "solid";

export type ChartCurve = "linear" | "monotone-x" | "natural" | "step" | "step-after";

export type ChartSeriesType = "area" | "bar" | "line";

export interface ChartLegendItem {
    color: string;
    name: string;
    seriesId: string;
    seriesType: ChartSeriesType;
    visible: boolean;
}

export interface ChartLegendItemTemplateContext {
    $implicit: ChartLegendItem;
    color: string;
    name: string;
    series: ChartLegendItem;
    seriesId: string;
    seriesType: ChartSeriesType;
    visible: boolean;
}

