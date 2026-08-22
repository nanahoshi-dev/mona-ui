import type { ChartNavigationAxisTarget, ChartViewportAxisRef } from "./chart-viewport.models";

export type ChartSynchronizationMode = "domain" | "relative";

export interface ChartSynchronizationAxisMapping {
    readonly source: ChartViewportAxisRef;
    readonly target: ChartViewportAxisRef;
}

export interface ChartViewportSynchronizationOptions {
    readonly axes?: ChartNavigationAxisTarget;
    readonly enabled?: boolean;
    readonly mode?: ChartSynchronizationMode;
    readonly phase?: "continuous" | "end";
}

export interface ChartCrosshairSynchronizationOptions {
    readonly axes?: "auto" | "x" | "xy" | "y";
    readonly clearOnLeave?: boolean;
    readonly enabled?: boolean;
    readonly match?: "axis-value" | "nearest-point";
    readonly mode?: ChartSynchronizationMode;
    readonly showTooltip?: boolean;
}

export interface ChartSynchronizationOptions {
    readonly axisMappings?: readonly ChartSynchronizationAxisMapping[];
    readonly crosshair?: boolean | ChartCrosshairSynchronizationOptions;
    readonly group: string;
    readonly viewport?: boolean | ChartViewportSynchronizationOptions;
}

export type ChartSynchronizationInput = false | string | ChartSynchronizationOptions;
