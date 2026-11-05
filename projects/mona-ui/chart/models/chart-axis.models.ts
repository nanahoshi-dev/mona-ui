export type ChartXAxisPosition = "bottom" | "top";
/** The physical side a Y axis is drawn on. */
export type ChartYAxisSide = "left" | "right";
/** Where a Y axis goes: `start` and `end` follow the direction, `left` and `right` don't. */
export type ChartYAxisPosition = ChartYAxisSide | "end" | "start";
export type ChartAxisPosition = ChartXAxisPosition | ChartYAxisSide;

export type ChartNumericScaleType = "linear" | "log" | "symlog" | "pow" | "sqrt";

export type ChartXAxisType = "auto" | "category" | ChartNumericScaleType | "time" | "utc";
export type ChartYAxisType = "auto" | "category" | ChartNumericScaleType;

export type ChartAxisLabelRotation = "auto" | number;
/** How the title and subtitle align: `start` and `end` follow the direction, `left` and `right` don't. */
export type ChartHeaderAlignment = "center" | "end" | "left" | "right" | "start";

export type ChartAxisFormatter<T = unknown> = (value: T, index: number) => string;

export interface ChartAxisLabelTemplateContext<T = unknown> {
    $implicit: T;
    axis: "angular" | "radial" | "x" | "y";
    axisId?: string;
    index: number;
    position?: ChartAxisPosition;
    scaleType?: ChartXAxisType | string;
    value: T;
}

export interface ChartAxisTick<T = unknown> {
    coordinate: number;
    formattedValue: string;
    index: number;
    value: T;
}

export interface ChartTitleTemplateContext {
    readonly $implicit: string;
    readonly title: string;
}

export interface ChartSubtitleTemplateContext {
    readonly $implicit: string;
    readonly subtitle: string;
}
