import type { ChartAnimationEasing } from "../../models/chart-animation.models";
import type { ChartRect } from "../../models/chart.models";
import type { ChartSeriesType } from "../../models/chart-series.models";
import type { ChartScene } from "../scene/chart-scene";
import type { NormalizedChartAnimationOptions } from "./chart-animation-options";

export type ChartAnimationTrigger = "data" | "initial" | "layout" | "none" | "visibility";

export type ChartTransitionMode = "crossfade" | "immediate" | "morph";

export type ChartAnimationCancelMode = "finish-target" | "keep-current";

export interface ChartAnimationComplexity {
    readonly markCount: number;
    readonly pathCount: number;
    readonly pointCount: number;
}

export interface ChartAnimationPlanningContext {
    readonly options: NormalizedChartAnimationOptions;
    readonly plotRect?: ChartRect;
    readonly trigger: ChartAnimationTrigger;
}

export interface ChartSeriesTransitionPlan<TScene = unknown> {
    readonly adapterType: ChartSeriesType;
    readonly fromSeries: TScene | null;
    readonly id: string;
    readonly sample: (progress: number) => TScene | null;
    readonly toSeries: TScene | null;
}

export interface ChartTransitionPlan {
    readonly complexity: ChartAnimationComplexity;
    readonly duration: number;
    readonly easing: ChartAnimationEasing;
    readonly fromScene: ChartScene | null;
    readonly mode: ChartTransitionMode;
    readonly seriesPlans: readonly ChartSeriesTransitionPlan[];
    readonly toScene: ChartScene;
    readonly trigger: ChartAnimationTrigger;
}

export interface ChartAnimationRenderFrame {
    readonly fromScene?: ChartScene | null;
    readonly mode: ChartTransitionMode;
    readonly progress: number;
    readonly scene: ChartScene;
    readonly toScene?: ChartScene;
}
