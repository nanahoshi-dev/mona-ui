export type ChartCrosshairMode = "auto" | "x" | "xy" | "y";

export type ChartCrosshairSnapMode = "nearest" | "pointer";

export type ChartCrosshairLineStyle = "dashed" | "dotted" | "solid";

export interface ChartCrosshairAxisLabelContext<T = unknown> {
    readonly $implicit: T;
    readonly axis: "x" | "y";
    readonly axisId: string;
    readonly coordinate: number;
    readonly formattedValue: string;
    readonly snapped: boolean;
    readonly source: "keyboard" | "pointer";
    readonly value: T;
}

export interface ChartCrosshairResolvedAxisValue<T = unknown> {
    readonly axis: "x" | "y";
    readonly axisId: string;
    readonly coordinate: number;
    readonly formattedValue: string;
    readonly value: T;
}
