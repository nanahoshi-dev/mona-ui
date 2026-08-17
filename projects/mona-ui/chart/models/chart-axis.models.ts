export type ChartXAxisPosition = "bottom" | "top";
export type ChartYAxisPosition = "left" | "right";
export type ChartAxisPosition = ChartXAxisPosition | ChartYAxisPosition;

export type ChartXAxisType = "auto" | "category" | "linear" | "time" | "utc";
export type ChartYAxisType = "auto" | "category" | "linear";

export type ChartAxisFormatter<T = unknown> = (value: T, index: number) => string;

export interface ChartAxisLabelTemplateContext<T = unknown> {
    $implicit: T;
    axis: "angular" | "radial" | "x" | "y";
    index: number;
    value: T;
}

export interface ChartAxisTick<T = unknown> {
    coordinate: number;
    formattedValue: string;
    index: number;
    value: T;
}

