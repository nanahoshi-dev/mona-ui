export type ChartAreaFillMode = "gradient" | "solid";

export type ChartCurve = "linear" | "monotone-x" | "natural" | "step" | "step-after";

export type ChartSeriesType = "area" | "bar" | "bubble" | "donut" | "line" | "pie" | "polar" | "radar" | "scatter";

export type ChartSeriesFamily = "cartesian" | "polar" | "radar" | "sector";

export function getChartSeriesFamily(type: ChartSeriesType): ChartSeriesFamily {
    switch (type) {
        case "line":
        case "area":
        case "bar":
        case "bubble":
        case "scatter":
            return "cartesian";
        case "pie":
        case "donut":
            return "sector";
        case "radar":
            return "radar";
        case "polar":
            return "polar";
    }
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
