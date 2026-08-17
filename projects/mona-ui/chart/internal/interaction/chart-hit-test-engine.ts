import type { ChartPoint } from "../../models/chart.models";
import type { CartesianChartScene, ChartScene, PolarAxisChartScene, PolarSectorChartScene } from "../scene/chart-scene";
import type { SceneHitTarget } from "../scene/scene-geometry";
import { distance, isPointInRect } from "../utils/geometry-utils";
import type { ChartInteractionState } from "./chart-interaction-state";
import { PolarAxisHitTester } from "./polar-axis-hit-tester";
import { PolarSectorHitTester } from "./polar-sector-hit-tester";

export class ChartHitTestEngine {
    public static testHit(
        pointer: ChartPoint,
        scene: ChartScene,
        shared: boolean = false,
        maxHoverDistance: number = 32
    ): ChartInteractionState {
        const { hitTargets, interactionBuckets, plotRect } = scene;

        if (
            pointer.x < plotRect.x - 5 ||
            pointer.x > plotRect.x + plotRect.width + 5 ||
            pointer.y < plotRect.y - 5 ||
            pointer.y > plotRect.y + plotRect.height + 5
        ) {
            return {
                activeHitTarget: null,
                activeHits: [],
                pointerPosition: pointer
            };
        }

        // Polar hit testing
        if (scene.coordinateSystem === "polar") {
            if (scene.polarKind === "sector") {
                return PolarSectorHitTester.testHit(pointer, scene as PolarSectorChartScene);
            }
            return PolarAxisHitTester.testHit(pointer, scene as PolarAxisChartScene, shared, maxHoverDistance);
        }

        // Cartesian shared mode
        if (shared) {
            // 1. Direct bar hit test
            for (const target of hitTargets) {
                if (target.bounds && isPointInRect(pointer, target.bounds)) {
                    const bucket = interactionBuckets?.find(b => b.xKey === target.xKey);
                    const sameXHits = bucket?.hits ?? hitTargets.filter(t => t.xKey === target.xKey);
                    return {
                        activeHitTarget: target,
                        activeHits: sameXHits,
                        pointerPosition: pointer
                    };
                }
            }

            // 2. Nearest X bucket
            if (interactionBuckets && interactionBuckets.length > 0) {
                let nearestBucket = interactionBuckets[0];
                const getBucketX = (b: typeof nearestBucket) => b.anchor.x;
                let minBucketDist = Math.abs(pointer.x - getBucketX(nearestBucket));
                for (let i = 1; i < interactionBuckets.length; i++) {
                    const bucket = interactionBuckets[i];
                    const d = Math.abs(pointer.x - getBucketX(bucket));
                    if (d < minBucketDist) {
                        minBucketDist = d;
                        nearestBucket = bucket;
                    }
                }

                if (minBucketDist <= maxHoverDistance) {
                    let nearestHit = nearestBucket.hits[0];
                    let minHitDist = Number.POSITIVE_INFINITY;
                    for (const hit of nearestBucket.hits) {
                        const hx =
                            hit.point?.x ??
                            (hit.bounds ? hit.bounds.x + hit.bounds.width / 2 : getBucketX(nearestBucket));
                        const hy = hit.point?.y ?? (hit.bounds ? hit.bounds.y + hit.bounds.height / 2 : pointer.y);
                        const d = distance(pointer.x, pointer.y, hx, hy);
                        if (d < minHitDist) {
                            minHitDist = d;
                            nearestHit = hit;
                        }
                    }
                    return {
                        activeHitTarget: nearestHit ?? null,
                        activeHits: nearestBucket.hits,
                        pointerPosition: pointer
                    };
                }
            }

            return {
                activeHitTarget: null,
                activeHits: [],
                pointerPosition: pointer
            };
        }

        // Cartesian non-shared mode: single nearest target
        // 1. Direct bar hit test
        for (const target of hitTargets) {
            if (target.bounds && isPointInRect(pointer, target.bounds)) {
                return {
                    activeHitTarget: target,
                    activeHits: [target],
                    pointerPosition: pointer
                };
            }
        }

        // 2. Line/area nearest point
        let nearestTarget: SceneHitTarget | null = null;
        let minDistance = Number.POSITIVE_INFINITY;

        for (const target of hitTargets) {
            if (target.point) {
                const dist = distance(pointer.x, pointer.y, target.point.x, target.point.y);
                if (dist < minDistance && dist <= (target.radius ?? maxHoverDistance)) {
                    minDistance = dist;
                    nearestTarget = target;
                }
            }
        }

        if (nearestTarget) {
            return {
                activeHitTarget: nearestTarget,
                activeHits: [nearestTarget],
                pointerPosition: pointer
            };
        }

        return {
            activeHitTarget: null,
            activeHits: [],
            pointerPosition: pointer
        };
    }
}
