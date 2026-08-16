export type ChartAxisPosition = "bottom" | "left" | "right" | "top";

export type ChartXAxisType = "auto" | "category" | "linear" | "time" | "utc";

export type ChartAxisFormatter<T = unknown> = (value: T, index: number) => string;

export interface ChartAxisLabelTemplateContext<T = unknown> {
    $implicit: T;
    axis: "x" | "y";
    index: number;
    value: T;
}

export interface ChartAxisTick<T = unknown> {
    coordinate: number;
    formattedValue: string;
    index: number;
    value: T;
}
