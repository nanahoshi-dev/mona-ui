import type { ChartPoint } from "../../models/chart.models";
import type {
    CartesianHeatmapChartScene,
    CartesianXYChartScene,
    ChartScene,
    PolarAxisChartScene,
    PolarSectorChartScene
} from "../scene/chart-scene";
import type {
    ChartInteractionBucket,
    SceneHitTarget
} from "../scene/scene-geometry";
import { distance, isPointInRect } from "../utils/geometry-utils";
import type { ChartInteractionState } from "./chart-interaction-state";
import type {
    ChartPointerCandidates,
    ChartPointerEvaluationInstrumentation
} from "./chart-pointer-candidate-resolver";
import {
    findNearestInteractionBucketByX,
    findNearestInteractionBucketByY
} from "./chart-interaction-bucket-search";
import { HeatmapHitTester } from "./heatmap-hit-tester";
import { PolarAxisHitTester } from "./polar-axis-hit-tester";
import { PolarSectorHitTester } from "./polar-sector-hit-tester";

export interface PointCandidateMetric {
    readonly distance: number;
    readonly hitRadius: number;
    readonly target: SceneHitTarget;
    readonly visualRadius: number;
}

export class ChartPointerCandidateEvaluator {
    public readonly pointer: ChartPoint;
    public readonly scene: ChartScene;
    public readonly candidates: ChartPointerCandidates;
    readonly #instrumentation?: ChartPointerEvaluationInstrumentation;

    // Evaluated facts cached for the pointer frame
    public readonly containedBarHits: readonly SceneHitTarget[];
    public readonly pointMetrics: readonly PointCandidateMetric[];
    public readonly financialHits: readonly SceneHitTarget[];
    public readonly topFinancialHit: SceneHitTarget | null;

    public constructor(
        candidates: ChartPointerCandidates,
        scene: ChartScene,
        instrumentation?: ChartPointerEvaluationInstrumentation
    ) {
        this.pointer = candidates.pointer;
        this.scene = scene;
        this.candidates = candidates;
        this.#instrumentation = instrumentation;

        const pointer = candidates.pointer;

        // 1. Evaluate Bar containment once
        if (candidates.barTargets && candidates.barTargets.length > 0) {
            const contained: SceneHitTarget[] = [];
            for (const target of candidates.barTargets) {
                instrumentation?.onBarContainmentCheck?.();
                const isHit =
                    (target.bounds !== undefined && isPointInRect(pointer, target.bounds)) ||
                    (target.visualBounds !== undefined && isPointInRect(pointer, target.visualBounds));
                if (isHit) {
                    contained.push(target);
                }
            }
            this.containedBarHits = contained;
        } else {
            this.containedBarHits = [];
        }

        // 2. Evaluate Point candidate distances once
        if (candidates.pointCandidates && candidates.pointCandidates.length > 0) {
            const metrics: PointCandidateMetric[] = [];
            for (const target of candidates.pointCandidates) {
                if (target.point) {
                    instrumentation?.onPointDistanceCheck?.();
                    const d = distance(pointer.x, pointer.y, target.point.x, target.point.y);
                    const visualRadius = target.visualRadius ?? target.radius ?? 4;
                    const hitRadius = target.radius ?? 10;
                    metrics.push({
                        distance: d,
                        hitRadius,
                        target,
                        visualRadius
                    });
                }
            }
            this.pointMetrics = metrics;
        } else {
            this.pointMetrics = [];
        }

        // 3. Financial hits
        this.financialHits = candidates.financialHits ?? [];
        if (this.financialHits.length > 0) {
            let topFin = this.financialHits[0];
            let maxOrder = topFin.renderOrder ?? 0;
            for (let i = 1; i < this.financialHits.length; i++) {
                const candidate = this.financialHits[i];
                const order = candidate.renderOrder ?? 0;
                if (order >= maxOrder) {
                    maxOrder = order;
                    topFin = candidate;
                }
            }
            this.topFinancialHit = topFin;
        } else {
            this.topFinancialHit = null;
        }
    }

    public static evaluate(
        candidates: ChartPointerCandidates,
        scene: ChartScene,
        instrumentation?: ChartPointerEvaluationInstrumentation
    ): ChartPointerCandidateEvaluator {
        return new ChartPointerCandidateEvaluator(candidates, scene, instrumentation);
    }

    public resolveHitState(
        shared: boolean = false,
        maxHoverDistance: number = 32
    ): ChartInteractionState {
        const pointer = this.pointer;
        const scene = this.scene;
        const candidateSet = this.candidates;
        const { hitTargets, interactionBuckets, plotRect } = scene;

        if (
            !candidateSet.plotRectBoundsValid ||
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

        // Hierarchical hit testing
        if (scene.coordinateSystem === "hierarchical") {
            if (scene.hierarchicalKind === "treemap") {
                const target = scene.hitIndex ? scene.hitIndex.query(pointer) : null;
                return {
                    activeHitTarget: target,
                    activeHits: target ? [target] : [],
                    pointerPosition: pointer
                };
            }
        }

        // Polar hit testing
        if (scene.coordinateSystem === "polar") {
            if (scene.polarKind === "sector") {
                return PolarSectorHitTester.testHit(pointer, scene as PolarSectorChartScene);
            }
            if (scene.polarKind === "arc") {
                const hits = scene.hitIndex ? scene.hitIndex.query(pointer) : [];
                return {
                    activeHitTarget: hits[0] ?? null,
                    activeHits: hits,
                    pointerPosition: pointer
                };
            }
            return PolarAxisHitTester.testHit(pointer, scene as PolarAxisChartScene, shared, maxHoverDistance);
        }

        if (scene.coordinateSystem === "cartesian") {
            if (scene.cartesianKind === "heatmap") {
                return HeatmapHitTester.testHit(pointer, scene as CartesianHeatmapChartScene);
            }
            if (scene.cartesianKind === "funnel") {
                const target = scene.hitIndex ? scene.hitIndex.query(pointer) : null;
                return {
                    activeHitTarget: target,
                    activeHits: target ? [target] : [],
                    pointerPosition: pointer
                };
            }
            if (scene.cartesianKind === "waterfall") {
                const target = scene.hitIndex ? scene.hitIndex.query(pointer) : null;
                return {
                    activeHitTarget: target,
                    activeHits: target ? [target] : [],
                    pointerPosition: pointer
                };
            }
        }

        const cartesianScene = scene as CartesianXYChartScene;

        const getBucketForHit = (target: SceneHitTarget): ChartInteractionBucket | undefined => {
            const axisId =
                cartesianScene.interactionAxis === "y"
                    ? target.yAxisId ?? cartesianScene.primaryYAxisId
                    : target.xAxisId ?? cartesianScene.primaryXAxisId;
            if (axisId && cartesianScene.interactionBucketsByAxisId) {
                const axisLookup = cartesianScene.interactionBucketsByAxisId.get(axisId);
                if (axisLookup?.has(target.xKey)) {
                    return axisLookup.get(target.xKey);
                }
            }
            const primaryId =
                cartesianScene.interactionAxis === "y"
                    ? cartesianScene.primaryYAxisId
                    : cartesianScene.primaryXAxisId;
            if (!axisId || axisId === primaryId || !cartesianScene.interactionBucketsByAxisId) {
                return (
                    cartesianScene.interactionBucketLookup?.get(target.xKey) ??
                    interactionBuckets?.find(b => b.xKey === target.xKey)
                );
            }
            return undefined;
        };

        // Cartesian shared mode
        if (shared) {
            // 1. Contained bar hits
            if (this.containedBarHits.length > 0) {
                const target = this.containedBarHits[0];
                const bucket = getBucketForHit(target);
                const sameXHits = bucket?.hits ?? hitTargets.filter(t => t.xKey === target.xKey);
                return {
                    activeHitTarget: target,
                    activeHits: sameXHits,
                    pointerPosition: pointer
                };
            }

            // 2. Financial indexed hit
            if (this.topFinancialHit) {
                const bucket = getBucketForHit(this.topFinancialHit);
                const sameXHits = bucket?.hits ?? hitTargets.filter(t => t.xKey === this.topFinancialHit?.xKey);
                return {
                    activeHitTarget: this.topFinancialHit,
                    activeHits: sameXHits,
                    pointerPosition: pointer
                };
            }

            // 3. Direct marker circle containment test (visual radius)
            let topContainedMarker: SceneHitTarget | null = null;
            let topRenderOrder = Number.NEGATIVE_INFINITY;

            for (const metric of this.pointMetrics) {
                const target = metric.target;
                if (target.seriesType === "scatter" || target.seriesType === "bubble") {
                    if (metric.distance <= metric.visualRadius) {
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
                for (const metric of this.pointMetrics) {
                    const target = metric.target;
                    if (target.seriesType === "scatter" || target.seriesType === "bubble") {
                        if (metric.distance <= metric.hitRadius) {
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
                const bucket = getBucketForHit(topContainedMarker);
                const sameXHits = bucket?.hits ?? hitTargets.filter(t => t.xKey === topContainedMarker?.xKey);
                return {
                    activeHitTarget: topContainedMarker,
                    activeHits: sameXHits,
                    pointerPosition: pointer
                };
            }

            // 4. Nearest category bucket
            const isAxisY = cartesianScene.interactionAxis === "y";
            if (cartesianScene.interactionBucketsByAxisId && cartesianScene.interactionBucketsByAxisId.size > 0) {
                let bestBucket: ChartInteractionBucket | null = null;
                let bestDistance = Number.POSITIVE_INFINITY;

                for (const [, axisBucketsMap] of cartesianScene.interactionBucketsByAxisId) {
                    const axisBuckets = Array.from(axisBucketsMap.values());
                    this.#instrumentation?.onNearestBucketSearch?.();
                    const nearest = isAxisY
                        ? findNearestInteractionBucketByY(axisBuckets, pointer.y)
                        : findNearestInteractionBucketByX(axisBuckets, pointer.x);
                    if (nearest) {
                        const dist = isAxisY
                            ? Math.abs(pointer.y - nearest.anchor.y)
                            : Math.abs(pointer.x - nearest.anchor.x);
                        if (dist < bestDistance) {
                            bestDistance = dist;
                            bestBucket = nearest;
                        }
                    }
                }

                if (bestBucket && bestDistance <= maxHoverDistance) {
                    let nearestHit = bestBucket.hits[0];
                    let minHitDist = Number.POSITIVE_INFINITY;
                    for (const hit of bestBucket.hits) {
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
                        hx = hx ?? bestBucket.anchor.x;
                        hy = hy ?? pointer.y;
                        const d = distance(pointer.x, pointer.y, hx, hy);
                        if (d < minHitDist) {
                            minHitDist = d;
                            nearestHit = hit;
                        }
                    }
                    return {
                        activeHitTarget: nearestHit ?? null,
                        activeHits: bestBucket.hits,
                        pointerPosition: pointer
                    };
                }
            } else if (interactionBuckets && interactionBuckets.length > 0) {
                this.#instrumentation?.onNearestBucketSearch?.();
                const nearestBucket = isAxisY
                    ? findNearestInteractionBucketByY(interactionBuckets, pointer.y)
                    : findNearestInteractionBucketByX(interactionBuckets, pointer.x);
                if (nearestBucket) {
                    const minBucketDist = isAxisY
                        ? Math.abs(pointer.y - nearestBucket.anchor.y)
                        : Math.abs(pointer.x - nearestBucket.anchor.x);
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
        // 1. Contained bar hits
        if (this.containedBarHits.length > 0) {
            const target = this.containedBarHits[0];
            return {
                activeHitTarget: target,
                activeHits: [target],
                pointerPosition: pointer
            };
        }

        // 2. Financial indexed hit
        if (this.topFinancialHit) {
            return {
                activeHitTarget: this.topFinancialHit,
                activeHits: [this.topFinancialHit],
                pointerPosition: pointer
            };
        }

        // 3. Direct marker circle containment test
        let topContainedMarker: SceneHitTarget | null = null;
        let topRenderOrder = Number.NEGATIVE_INFINITY;

        for (const metric of this.pointMetrics) {
            const target = metric.target;
            if (target.seriesType === "scatter" || target.seriesType === "bubble") {
                if (metric.distance <= metric.visualRadius) {
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

        // 4. Range Area band containment test
        if (interactionBuckets && interactionBuckets.length > 0) {
            this.#instrumentation?.onNearestBucketSearch?.();
            const nearestBucket = findNearestInteractionBucketByX(interactionBuckets, pointer.x);
            if (nearestBucket) {
                const minBucketDist = Math.abs(pointer.x - nearestBucket.anchor.x);
                if (minBucketDist <= maxHoverDistance) {
                    const rangeCandidates = nearestBucket.hits.filter(
                        (h: SceneHitTarget) => h.seriesType === "rangeArea" && h.rangeBand
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

        // 5. Line/area/marker nearest point fallback
        let nearestTarget: SceneHitTarget | null = null;
        let minDistance = Number.POSITIVE_INFINITY;

        for (const metric of this.pointMetrics) {
            const target = metric.target;
            const dist = metric.distance;
            const maxDist = Math.min(target.radius ?? maxHoverDistance, maxHoverDistance);
            if (dist < minDistance && dist <= maxDist) {
                minDistance = dist;
                nearestTarget = target;
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

    public resolveCrosshairCandidates(
        scene: ChartScene,
        crosshairDistance: number
    ): readonly SceneHitTarget[] {
        const candidateSet = new Set<SceneHitTarget>();

        // 1. Contained bars
        for (const bar of this.containedBarHits) {
            candidateSet.add(bar);
        }

        // 2. Financial hits
        for (const fin of this.financialHits) {
            candidateSet.add(fin);
        }

        // 3. Point candidates within crosshairDistance
        for (const metric of this.pointMetrics) {
            const maxAllowed = Math.min(metric.target.radius ?? crosshairDistance, crosshairDistance);
            if (metric.distance <= maxAllowed || metric.distance <= metric.visualRadius) {
                candidateSet.add(metric.target);
            }
        }

        return Array.from(candidateSet);
    }
}
