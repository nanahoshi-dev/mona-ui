import type { ChartPoint } from "../../models/chart.models";
import type { CartesianHeatmapChartScene, CartesianXYChartScene, ChartScene, PolarAxisChartScene, PolarSectorChartScene } from "../scene/chart-scene";
import type { ChartInteractionBucket, SceneHitTarget } from "../scene/scene-geometry";
import { distance, isPointInRect } from "../utils/geometry-utils";
import type { ChartInteractionState } from "./chart-interaction-state";
import {
    ChartPointerCandidateResolver,
    type ChartPointerCandidates
} from "./chart-pointer-candidate-resolver";
import { HeatmapHitTester } from "./heatmap-hit-tester";
import { PolarAxisHitTester } from "./polar-axis-hit-tester";
import { PolarSectorHitTester } from "./polar-sector-hit-tester";

export {
    findNearestInteractionBucketByX,
    findNearestInteractionBucketByY
} from "./chart-interaction-bucket-search";

import { ChartPointerCandidateEvaluator } from "./chart-pointer-candidate-evaluator";

export class ChartHitTestEngine {
    public static testHit(
        pointer: ChartPoint,
        scene: ChartScene,
        shared: boolean = false,
        maxHoverDistance: number = 32
    ): ChartInteractionState {
        const candidates = ChartPointerCandidateResolver.discover(pointer, scene, maxHoverDistance);
        return ChartHitTestEngine.evaluateCandidateHit(candidates, scene, shared, maxHoverDistance);
    }

    public static evaluateCandidateHit(
        candidateSet: ChartPointerCandidates,
        scene: ChartScene,
        shared: boolean = false,
        maxHoverDistance: number = 32
    ): ChartInteractionState {
        const evaluator = ChartPointerCandidateEvaluator.evaluate(candidateSet, scene);
        return evaluator.resolveHitState(shared, maxHoverDistance);
    }
}

