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

export function findNearestInteractionBucketByX(
    buckets: readonly ChartInteractionBucket[],
    targetX: number
): ChartInteractionBucket | null {
    if (buckets.length === 0) {
        return null;
    }
    if (buckets.length === 1) {
        return buckets[0];
    }
    let low = 0;
    let high = buckets.length - 1;

    while (low <= high) {
        const mid = (low + high) >> 1;
        const midX = buckets[mid].anchor.x;
        if (midX === targetX) {
            return buckets[mid];
        }
        if (midX < targetX) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    const candidate1 = buckets[Math.min(low, buckets.length - 1)];
    const candidate2 = buckets[Math.max(0, low - 1)];
    const dist1 = Math.abs(targetX - candidate1.anchor.x);
    const dist2 = Math.abs(targetX - candidate2.anchor.x);
    return dist1 <= dist2 ? candidate1 : candidate2;
}

export function findNearestInteractionBucketByY(
    buckets: readonly ChartInteractionBucket[],
    targetY: number
): ChartInteractionBucket | null {
    if (buckets.length === 0) {
        return null;
    }
    if (buckets.length === 1) {
        return buckets[0];
    }
    let low = 0;
    let high = buckets.length - 1;

    while (low <= high) {
        const mid = (low + high) >> 1;
        const midY = buckets[mid].anchor.y;
        if (midY === targetY) {
            return buckets[mid];
        }
        if (midY < targetY) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    const candidate1 = buckets[Math.min(low, buckets.length - 1)];
    const candidate2 = buckets[Math.max(0, low - 1)];
    const dist1 = Math.abs(targetY - candidate1.anchor.y);
    const dist2 = Math.abs(targetY - candidate2.anchor.y);
    return dist1 <= dist2 ? candidate1 : candidate2;
}

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

