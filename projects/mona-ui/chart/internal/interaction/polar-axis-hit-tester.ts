import type { ChartPoint } from "../../models/chart.models";
import type { PolarAxisChartScene } from "../scene/chart-scene";
import type { ChartInteractionBucket, SceneHitTarget } from "../scene/scene-geometry";
import { circularAngleDistance, degreesToRadians, normalizeAngle, radiansToDegrees } from "../utils/angle-utils";
import { distance } from "../utils/geometry-utils";
import { clamp } from "../utils/number-utils";
import type { ChartInteractionState } from "./chart-interaction-state";

function findNearestPolarBucket(
    buckets: readonly ChartInteractionBucket[],
    targetDeg: number
): { bucket: ChartInteractionBucket; deltaRad: number; index: number } {
    let low = 0;
    let high = buckets.length - 1;
    while (low <= high) {
        const mid = (low + high) >> 1;
        if (buckets[mid].order < targetDeg) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    const n = buckets.length;
    const candidates = [
        (low - 1 + n) % n,
        low % n,
        (low + 1) % n,
        0,
        n - 1
    ];

    let bestIndex = 0;
    let bestDelta = Number.POSITIVE_INFINITY;
    const targetRad = degreesToRadians(targetDeg);

    for (const idx of candidates) {
        const b = buckets[idx];
        const bucketRad = degreesToRadians(b.order);
        const d = circularAngleDistance(targetRad, bucketRad);
        if (d < bestDelta) {
            bestDelta = d;
            bestIndex = idx;
        }
    }

    return { bucket: buckets[bestIndex], deltaRad: bestDelta, index: bestIndex };
}

export class PolarAxisHitTester {
    public static testHit(
        pointer: ChartPoint,
        scene: PolarAxisChartScene,
        shared: boolean = false,
        maxHoverDistance: number = 32
    ): ChartInteractionState {
        const { axisMode, center, hitTargets, interactionBuckets, outerRadius } = scene;
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

        // Outside interaction envelope or inside center dead zone
        const deadZone = Math.max(8, outerRadius * 0.05);
        if (radius > outerRadius + 32 || radius < deadZone) {
            return {
                activeHitTarget: null,
                activeHits: [],
                pointerPosition: pointer
            };
        }

        const rawAngle = Math.atan2(dx, -dy);
        const pointerAngle = normalizeAngle(rawAngle);
        const rotationRad = degreesToRadians(scene.angularAxis.rotation);

        if (shared && interactionBuckets.length > 0) {
            let nearestBucket: ChartInteractionBucket;
            let minAngularDelta: number;

            if (axisMode === "radar") {
                const categoryCount = interactionBuckets.length;
                const normalized = normalizeAngle(pointerAngle - rotationRad);
                const bucketIndex = Math.round((normalized / (2 * Math.PI)) * categoryCount) % categoryCount;
                nearestBucket = interactionBuckets[bucketIndex];
                const spokeAngle = normalizeAngle(rotationRad + (bucketIndex * 2 * Math.PI) / categoryCount);
                minAngularDelta = circularAngleDistance(pointerAngle, spokeAngle);
            } else {
                const relativeAngle = normalizeAngle(pointerAngle - rotationRad);
                const pointerDeg = radiansToDegrees(relativeAngle);
                const result = findNearestPolarBucket(interactionBuckets, pointerDeg);
                nearestBucket = result.bucket;
                minAngularDelta = result.deltaRad;

                // Shared polar proximity requirement
                const arcDistance = minAngularDelta * Math.max(radius, outerRadius * 0.5);
                if (arcDistance > maxHoverDistance) {
                    return {
                        activeHitTarget: null,
                        activeHits: [],
                        pointerPosition: pointer
                    };
                }
            }

            // Find nearest hit within nearest bucket to pointer position
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

        // Non-shared mode: fast indexed search in candidate neighborhood
        let nearestTarget: SceneHitTarget | null = null;
        let minDistance = Number.POSITIVE_INFINITY;

        let candidateTargets: readonly SceneHitTarget[];
        if (axisMode === "polar" && interactionBuckets.length > 100) {
            const relativeAngle = normalizeAngle(pointerAngle - rotationRad);
            const pointerDeg = radiansToDegrees(relativeAngle);
            const { index } = findNearestPolarBucket(interactionBuckets, pointerDeg);
            const n = interactionBuckets.length;
            const collected: SceneHitTarget[] = [];

            // Check neighborhood within ~30px arc distance
            const checkCount = Math.min(n, 20);
            for (let offset = -checkCount; offset <= checkCount; offset++) {
                const idx = (index + offset + n) % n;
                collected.push(...interactionBuckets[idx].hits);
            }
            candidateTargets = collected;
        } else {
            candidateTargets = hitTargets;
        }

        for (const target of candidateTargets) {
            if (target.point) {
                const dist = distance(pointer.x, pointer.y, target.point.x, target.point.y);
                const threshold = clamp((target.radius ?? 4) + 8, 10, 20);
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
