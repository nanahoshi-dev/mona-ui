export type ChartRadialArcFillMode = "gradient" | "solid";

export type ChartRoseScaleMode = "area" | "radius";

export type ChartGaugeIndicator = "arc" | "both" | "needle";

export interface ChartRadialDatumVisibilityEvent {
    readonly category: unknown;
    readonly dataIndex: number;
    readonly datum: unknown;
    readonly itemId: string;
    readonly seriesId: string;
    readonly seriesName: string;
    readonly seriesType: "radialBar" | "rose";
    readonly visible: boolean;
}

export interface ChartGaugeCenterTemplateContext {
    readonly $implicit: number;
    readonly formattedMax: string;
    readonly formattedMin: string;
    readonly formattedValue: string;
    readonly isClamped: boolean;
    readonly max: number;
    readonly min: number;
    readonly ratio: number;
    readonly seriesId: string;
    readonly seriesName: string;
    readonly value: number;
}
