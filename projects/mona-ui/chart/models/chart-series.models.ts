export type ChartAreaFillMode = "gradient" | "solid";

export type ChartCurve = "linear" | "monotone-x" | "natural" | "step" | "step-after";

export type ChartSeriesType =
    | "area"
    | "bar"
    | "bubble"
    | "candlestick"
    | "donut"
    | "gauge"
    | "heatmap"
    | "line"
    | "ohlc"
    | "pie"
    | "polar"
    | "radar"
    | "radialBar"
    | "rangeArea"
    | "rangeBar"
    | "rose"
    | "scatter"
    | "treemap";

export type ChartSeriesFamily = "cartesian" | "heatmap" | "hierarchy" | "polar" | "radar" | "radialArc" | "sector";

export function getChartSeriesFamily(type: ChartSeriesType): ChartSeriesFamily {
    switch (type) {
        case "line":
        case "area":
        case "bar":
        case "bubble":
        case "candlestick":
        case "ohlc":
        case "rangeArea":
        case "rangeBar":
        case "scatter":
            return "cartesian";
        case "heatmap":
            return "heatmap";
        case "pie":
        case "donut":
            return "sector";
        case "radar":
            return "radar";
        case "polar":
            return "polar";
        case "radialBar":
        case "rose":
        case "gauge":
            return "radialArc";
        case "treemap":
            return "hierarchy";
    }
}

export function isCartesianCoordinateFamily(family: ChartSeriesFamily): boolean {
    return family === "cartesian" || family === "heatmap";
}

export function isPolarCoordinateFamily(family: ChartSeriesFamily): boolean {
    return family === "sector" || family === "radar" || family === "polar" || family === "radialArc";
}

export function isHierarchicalCoordinateFamily(family: ChartSeriesFamily): boolean {
    return family === "hierarchy";
}


export type ChartLegendItemKind = "datum" | "series";

export interface ChartLegendItem {
    color: string;
    dataIndex?: number;
    datum?: unknown;
    itemId: string;
    kind?: ChartLegendItemKind;
    name: string;
    percentage?: number;
    secondaryColor?: string;
    seriesId: string;
    seriesType: ChartSeriesType;
    value?: number;
    visible: boolean;
}

export interface ChartLegendItemTemplateContext {
    $implicit: ChartLegendItem;
    color: string;
    dataIndex?: number;
    datum?: unknown;
    itemId: string;
    kind?: ChartLegendItemKind;
    name: string;
    percentage?: number;
    secondaryColor?: string;
    series: ChartLegendItem;
    seriesId: string;
    seriesType: ChartSeriesType;
    value?: number;
    visible: boolean;
}
