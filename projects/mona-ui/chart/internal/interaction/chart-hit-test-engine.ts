import type { ChartPoint } from "../../models/chart.models";
import type { CartesianChartScene, ChartScene, PolarAxisChartScene, PolarSectorChartScene } from "../scene/chart-scene";
import type { ChartInteractionBucket, SceneHitTarget } from "../scene/scene-geometry";
import { distance, isPointInRect } from "../utils/geometry-utils";
import type { ChartInteractionState } from "./chart-interaction-state";
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

            // 2. Direct marker circle containment test
            const cartesianScene = scene as CartesianChartScene;
            const candidates = cartesianScene.markerSpatialIndex
                ? cartesianScene.markerSpatialIndex.query(pointer, maxHoverDistance)
                : hitTargets;

            let topContainedMarker: SceneHitTarget | null = null;
            let topRenderOrder = Number.NEGATIVE_INFINITY;

            for (const target of candidates) {
                if (target.point && (target.seriesType === "scatter" || target.seriesType === "bubble")) {
                    const effectiveRadius = target.radius ?? target.visualRadius ?? 10;
                    const d = distance(pointer.x, pointer.y, target.point.x, target.point.y);
                    if (d <= effectiveRadius) {
                        const order = target.renderOrder ?? 0;
                        if (order >= topRenderOrder) {
                            topRenderOrder = order;
                            topContainedMarker = target;
                        }
                    }
                }
            }

            if (topContainedMarker) {
                const bucket = interactionBuckets?.find(b => b.xKey === topContainedMarker?.xKey);
                const sameXHits = bucket?.hits ?? hitTargets.filter(t => t.xKey === topContainedMarker?.xKey);
                return {
                    activeHitTarget: topContainedMarker,
                    activeHits: sameXHits,
                    pointerPosition: pointer
                };
            }

            // 3. Nearest X bucket
            if (interactionBuckets && interactionBuckets.length > 0) {
                const nearestBucket = findNearestInteractionBucketByX(interactionBuckets, pointer.x);
                if (nearestBucket) {
                    const minBucketDist = Math.abs(pointer.x - nearestBucket.anchor.x);
                    if (minBucketDist <= maxHoverDistance) {
                        let nearestHit = nearestBucket.hits[0];
                        let minHitDist = Number.POSITIVE_INFINITY;
                        for (const hit of nearestBucket.hits) {
                            const hx =
                                hit.point?.x ??
                                (hit.bounds ? hit.bounds.x + hit.bounds.width / 2 : nearestBucket.anchor.x);
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

        // 2. Direct marker circle containment test (with top renderOrder selection for overlapping markers)
        const cartesianScene = scene as CartesianChartScene;
        const candidates = cartesianScene.markerSpatialIndex
            ? cartesianScene.markerSpatialIndex.query(pointer, maxHoverDistance)
            : hitTargets;

        let topContainedMarker: SceneHitTarget | null = null;
        let topRenderOrder = Number.NEGATIVE_INFINITY;

        for (const target of candidates) {
            if (target.point && (target.seriesType === "scatter" || target.seriesType === "bubble")) {
                const effectiveRadius = target.radius ?? target.visualRadius ?? 10;
                const d = distance(pointer.x, pointer.y, target.point.x, target.point.y);
                if (d <= effectiveRadius) {
                    const order = target.renderOrder ?? 0;
                    if (order >= topRenderOrder) {
                        topRenderOrder = order;
                        topContainedMarker = target;
                    }
                }
            }
        }

        if (topContainedMarker) {
            return {
                activeHitTarget: topContainedMarker,
                activeHits: [topContainedMarker],
                pointerPosition: pointer
            };
        }

        // 3. Line/area/marker nearest point fallback
        let nearestTarget: SceneHitTarget | null = null;
        let minDistance = Number.POSITIVE_INFINITY;

        for (const target of candidates) {
            if (target.point) {
                const dist = distance(pointer.x, pointer.y, target.point.x, target.point.y);
                const maxDist = target.radius ?? maxHoverDistance;
                if (dist < minDistance && dist <= maxDist) {
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
