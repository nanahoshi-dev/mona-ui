export type ChartAreaFillMode = "gradient" | "solid";

export type ChartCurve = "linear" | "monotone-x" | "natural" | "step" | "step-after";

export type ChartSeriesType =
    | "area"
    | "bar"
    | "bubble"
    | "donut"
    | "heatmap"
    | "line"
    | "pie"
    | "polar"
    | "radar"
    | "rangeArea"
    | "rangeBar"
    | "scatter";

export type ChartSeriesFamily = "cartesian" | "heatmap" | "polar" | "radar" | "sector";

export function getChartSeriesFamily(type: ChartSeriesType): ChartSeriesFamily {
    switch (type) {
        case "line":
        case "area":
        case "bar":
        case "bubble":
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
    }
}

export function isCartesianCoordinateFamily(family: ChartSeriesFamily): boolean {
    return family === "cartesian" || family === "heatmap";
}

export function isPolarCoordinateFamily(family: ChartSeriesFamily): boolean {
    return family === "sector" || family === "radar" || family === "polar";
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
    series: ChartLegendItem;
    seriesId: string;
    seriesType: ChartSeriesType;
    value?: number;
    visible: boolean;
}
