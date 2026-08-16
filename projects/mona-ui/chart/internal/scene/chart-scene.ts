import type { ChartCoordinateSystem, ChartRect } from "../../models/chart.models";
import type { ChartAxisScene, ChartSeriesScene } from "./cartesian-scene";
import type { ChartInteractionBucket, SceneHitTarget } from "./scene-geometry";

export interface ChartScene {
    axes: readonly ChartAxisScene[];
    coordinateSystem: ChartCoordinateSystem;
    height: number;
    hitTargets: readonly SceneHitTarget[];
    interactionBuckets: readonly ChartInteractionBucket[];
    plotRect: ChartRect;
    series: readonly ChartSeriesScene[];
    width: number;
}

