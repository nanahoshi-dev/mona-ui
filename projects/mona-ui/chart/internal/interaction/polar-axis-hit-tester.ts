import type { ChartPoint } from "../../models/chart.models";
import type { PolarAxisChartScene } from "../scene/chart-scene";
import type { SceneHitTarget } from "../scene/scene-geometry";
import { circularAngleDistance, normalizeAngle } from "../utils/angle-utils";
import { distance } from "../utils/geometry-utils";
import type { ChartInteractionState } from "./chart-interaction-state";

export class PolarAxisHitTester {
    public static testHit(
        pointer: ChartPoint,
        scene: PolarAxisChartScene,
        shared: boolean = false,
        maxHoverDistance: number = 32
    ): ChartInteractionState {
        const { center, hitTargets, interactionBuckets, outerRadius } = scene;
        if (hitTargets.length === 0 || outerRadius <= 0) {
            return {
                activeHitTarget: null,
                activeHits: [],
                pointerPosition: pointer
            };
        }

        const dx = pointer.x - center.x;
        const dy = pointer.y - center.y;
        const radius = Math.hypot(dx, dy);

        // Outside interaction envelope
        if (radius > outerRadius + 32) {
            return {
                activeHitTarget: null,
                activeHits: [],
                pointerPosition: pointer
            };
        }

        const rawAngle = Math.atan2(dx, -dy);
        const pointerAngle = normalizeAngle(rawAngle);

        if (shared && interactionBuckets.length > 0) {
            // Find nearest angular bucket using circular distance
            let nearestBucket = interactionBuckets[0];
            let minAngularDelta = Number.POSITIVE_INFINITY;

            for (const bucket of interactionBuckets) {
                const anchorX = bucket.anchor ? bucket.anchor.x : (bucket.centerX ?? center.x);
                const anchorY = bucket.anchor ? bucket.anchor.y : center.y;
                const spokeAngle =
                    bucket.hits[0]?.angle ?? normalizeAngle(Math.atan2(anchorX - center.x, -(anchorY - center.y)));
                const delta = circularAngleDistance(pointerAngle, spokeAngle);
                if (delta < minAngularDelta) {
                    minAngularDelta = delta;
                    nearestBucket = bucket;
                }
            }

            // Find nearest hit within that bucket to pointer position
            let nearestHit = nearestBucket.hits[0];
            let minHitDist = Number.POSITIVE_INFINITY;
            for (const hit of nearestBucket.hits) {
                if (hit.point) {
                    const d = distance(pointer.x, pointer.y, hit.point.x, hit.point.y);
                    if (d < minHitDist) {
                        minHitDist = d;
                        nearestHit = hit;
                    }
                }
            }

            return {
                activeHitTarget: nearestHit ?? null,
                activeHits: nearestBucket.hits,
                pointerPosition: pointer
            };
        }

        // Non-shared mode: find nearest point within hit radius
        let nearestTarget: SceneHitTarget | null = null;
        let minDistance = Number.POSITIVE_INFINITY;

        for (const target of hitTargets) {
            if (target.point) {
                const dist = distance(pointer.x, pointer.y, target.point.x, target.point.y);
                const threshold = Math.max((target.radius ?? 4) + 8, maxHoverDistance);
                if (dist < minDistance && dist <= threshold) {
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
