import type { ChartCoordinateSystem, ChartPoint, ChartRect } from "../../models/chart.models";
import type { ChartLegendItem } from "../../models/chart-series.models";
import type { ChartAxisScene, ChartSeriesScene } from "./cartesian-scene";
import type { ChartPolarSeriesScene } from "./polar-scene";
import type { ChartInteractionBucket, SceneHitTarget } from "./scene-geometry";

export interface ChartSceneBase {
    coordinateSystem: ChartCoordinateSystem;
    hasRenderableData: boolean;
    height: number;
    hitTargets: readonly SceneHitTarget[];
    interactionBuckets: readonly ChartInteractionBucket[];
    legendItems: readonly ChartLegendItem[];
    plotRect: ChartRect;
    width: number;
}

export interface CartesianChartScene extends ChartSceneBase {
    axes: readonly ChartAxisScene[];
    coordinateSystem: "cartesian";
    series: readonly ChartSeriesScene[];
}

export interface PolarChartScene extends ChartSceneBase {
    center: ChartPoint;
    coordinateSystem: "polar";
    series: readonly ChartPolarSeriesScene[];
}

export type ChartScene = CartesianChartScene | PolarChartScene;
