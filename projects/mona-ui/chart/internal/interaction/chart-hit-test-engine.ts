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

        const cartesianScene = scene as CartesianChartScene;
        const barTargets = cartesianScene.barHitTargets ?? hitTargets;
        const pointSpatialIndex = cartesianScene.pointSpatialIndex ?? cartesianScene.markerSpatialIndex;
        const candidates = pointSpatialIndex
            ? pointSpatialIndex.query(pointer, maxHoverDistance)
            : hitTargets;

        // Cartesian shared mode
        if (shared) {
            // 1. Direct bar hit test
            for (const target of barTargets) {
                if (target.bounds && isPointInRect(pointer, target.bounds)) {
                    const bucket = cartesianScene.interactionBucketLookup?.get(target.xKey) ??
                        interactionBuckets?.find(b => b.xKey === target.xKey);
                    const sameXHits = bucket?.hits ?? hitTargets.filter(t => t.xKey === target.xKey);
                    return {
                        activeHitTarget: target,
                        activeHits: sameXHits,
                        pointerPosition: pointer
                    };
                }
            }

            // 2. Direct marker circle containment test (visual radius)
            let topContainedMarker: SceneHitTarget | null = null;
            let topRenderOrder = Number.NEGATIVE_INFINITY;

            for (const target of candidates) {
                if (target.point && (target.seriesType === "scatter" || target.seriesType === "bubble")) {
                    const visualRadius = target.visualRadius ?? target.radius ?? 4;
                    const d = distance(pointer.x, pointer.y, target.point.x, target.point.y);
                    if (d <= visualRadius) {
                        const order = target.renderOrder ?? 0;
                        if (order >= topRenderOrder) {
                            topRenderOrder = order;
                            topContainedMarker = target;
                        }
                    }
                }
            }

            if (!topContainedMarker) {
                // Forgiving proximity containment
                for (const target of candidates) {
                    if (target.point && (target.seriesType === "scatter" || target.seriesType === "bubble")) {
                        const hitRadius = target.radius ?? 10;
                        const d = distance(pointer.x, pointer.y, target.point.x, target.point.y);
                        if (d <= hitRadius) {
                            const order = target.renderOrder ?? 0;
                            if (order >= topRenderOrder) {
                                topRenderOrder = order;
                                topContainedMarker = target;
                            }
                        }
                    }
                }
            }

            if (topContainedMarker) {
                const bucket = cartesianScene.interactionBucketLookup?.get(topContainedMarker.xKey) ??
                    interactionBuckets?.find(b => b.xKey === topContainedMarker?.xKey);
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
                            let hx = hit.point?.x;
                            let hy = hit.point?.y;
                            if (hit.seriesType === "rangeArea" && hit.rangeBand) {
                                hx = hit.rangeBand.fromPoint.x;
                                const minY = Math.min(hit.rangeBand.fromPoint.y, hit.rangeBand.toPoint.y);
                                const maxY = Math.max(hit.rangeBand.fromPoint.y, hit.rangeBand.toPoint.y);
                                hy = Math.max(minY, Math.min(maxY, pointer.y));
                            } else if (hit.bounds) {
                                hx = hit.bounds.x + hit.bounds.width / 2;
                                hy = hit.bounds.y + hit.bounds.height / 2;
                            }
                            hx = hx ?? nearestBucket.anchor.x;
                            hy = hy ?? pointer.y;
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
        for (const target of barTargets) {
            if (target.bounds && isPointInRect(pointer, target.bounds)) {
                return {
                    activeHitTarget: target,
                    activeHits: [target],
                    pointerPosition: pointer
                };
            }
        }

        // 2. Direct marker circle containment test (with top renderOrder selection for overlapping markers)
        let topContainedMarker: SceneHitTarget | null = null;
        let topRenderOrder = Number.NEGATIVE_INFINITY;

        for (const target of candidates) {
            if (target.point && (target.seriesType === "scatter" || target.seriesType === "bubble")) {
                const visualRadius = target.visualRadius ?? target.radius ?? 4;
                const d = distance(pointer.x, pointer.y, target.point.x, target.point.y);
                if (d <= visualRadius) {
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

        // 3. Range Area band containment test
        if (interactionBuckets && interactionBuckets.length > 0) {
            const nearestBucket = findNearestInteractionBucketByX(interactionBuckets, pointer.x);
            if (nearestBucket) {
                const minBucketDist = Math.abs(pointer.x - nearestBucket.anchor.x);
                if (minBucketDist <= maxHoverDistance) {
                    const rangeCandidates = nearestBucket.hits.filter(
                        h => h.seriesType === "rangeArea" && h.rangeBand
                    );
                    let selectedRangeHit: SceneHitTarget | null = null;
                    let selectedRenderOrder = Number.NEGATIVE_INFINITY;

                    for (const hit of rangeCandidates) {
                        const band = hit.rangeBand!;
                        const minY = Math.min(band.fromPoint.y, band.toPoint.y);
                        const maxY = Math.max(band.fromPoint.y, band.toPoint.y);
                        const tolerance = Math.max(6, hit.radius ?? 6);

                        if (pointer.y >= minY - tolerance && pointer.y <= maxY + tolerance) {
                            const order = hit.renderOrder ?? 0;
                            if (order >= selectedRenderOrder) {
                                selectedRenderOrder = order;
                                selectedRangeHit = hit;
                            }
                        }
                    }

                    if (selectedRangeHit) {
                        return {
                            activeHitTarget: selectedRangeHit,
                            activeHits: [selectedRangeHit],
                            pointerPosition: pointer
                        };
                    }
                }
            }
        }

        // 4. Line/area/marker nearest point fallback
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
