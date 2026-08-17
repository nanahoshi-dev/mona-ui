import type { ChartCoordinateSystem, ChartPoint, ChartRect } from "../../models/chart.models";
import type { ChartLegendItem } from "../../models/chart-series.models";
import type { ChartAxisScene, ChartSeriesScene } from "./cartesian-scene";
import type { ChartAngularAxisScene, ChartRadialAxisScene, ChartRadialSeriesScene } from "./polar-axis-scene";
import type { ChartSectorSeriesScene } from "./polar-scene";
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

export interface PolarSceneBase extends ChartSceneBase {
    center: ChartPoint;
    coordinateSystem: "polar";
}

export interface PolarSectorChartScene extends PolarSceneBase {
    polarKind: "sector";
    series: readonly ChartSectorSeriesScene[];
}

export interface PolarAxisChartScene extends PolarSceneBase {
    angularAxis: ChartAngularAxisScene;
    axisMode: "polar" | "radar";
    outerRadius: number;
    polarKind: "axis";
    radialAxis: ChartRadialAxisScene;
    series: readonly ChartRadialSeriesScene[];
}

export type PolarChartScene = PolarAxisChartScene | PolarSectorChartScene;

export type ChartScene = CartesianChartScene | PolarChartScene;
