import type { ChartPoint } from "../../models/chart.models";
import type { CartesianXYChartScene, ChartScene } from "../scene/chart-scene";
import type { ChartInteractionBucket, ChartInteractionXKey, SceneHitTarget } from "../scene/scene-geometry";

export interface ChartPointerCandidates {
    readonly barTargets: readonly SceneHitTarget[];
    readonly financialHits: readonly SceneHitTarget[];
    readonly hitTargets: readonly SceneHitTarget[];
    readonly interactionBucketLookup?: ReadonlyMap<ChartInteractionXKey, ChartInteractionBucket>;
    readonly interactionBuckets?: readonly ChartInteractionBucket[];
    readonly interactionBucketsByAxisId?: ReadonlyMap<string, ReadonlyMap<ChartInteractionXKey, ChartInteractionBucket>>;
    readonly maxCandidateDistance: number;
    readonly plotRectBoundsValid: boolean;
    readonly pointCandidates: readonly SceneHitTarget[];
    readonly pointer: ChartPoint;
}

export interface ChartPointerEvaluationInstrumentation {
    onBarContainmentCheck?(): void;
    onFinancialQuery?(): void;
    onNearestBucketSearch?(): void;
    onPointDistanceCheck?(): void;
    onSpatialQuery?(): void;
}

export class ChartPointerCandidateResolver {
    public static discover(
        pointer: ChartPoint,
        scene: ChartScene,
        maxCandidateDistance: number = 32,
        instrumentation?: ChartPointerEvaluationInstrumentation
    ): ChartPointerCandidates {
        const { hitTargets, plotRect } = scene;
        const plotRectBoundsValid = !(
            pointer.x < plotRect.x - 5 ||
            pointer.x > plotRect.x + plotRect.width + 5 ||
            pointer.y < plotRect.y - 5 ||
            pointer.y > plotRect.y + plotRect.height + 5
        );

        if (!plotRectBoundsValid || scene.coordinateSystem !== "cartesian" || scene.cartesianKind !== "xy") {
            return {
                barTargets: [],
                financialHits: [],
                hitTargets: hitTargets ?? [],
                maxCandidateDistance,
                plotRectBoundsValid,
                pointCandidates: [],
                pointer
            };
        }

        const cartesianScene = scene as CartesianXYChartScene;
        const barTargets =
            cartesianScene.barHitTargets ??
            hitTargets.filter(t => t.bounds && (t.seriesType === "bar" || t.seriesType === "rangeBar"));
        let finHits: readonly SceneHitTarget[] = [];
        if (cartesianScene.financialIndex) {
            instrumentation?.onFinancialQuery?.();
            finHits = cartesianScene.financialIndex.query(pointer);
        }
        const pointSpatialIndex = cartesianScene.pointSpatialIndex ?? cartesianScene.markerSpatialIndex;
        let pointCandidates: readonly SceneHitTarget[] = hitTargets;
        if (pointSpatialIndex) {
            instrumentation?.onSpatialQuery?.();
            pointCandidates = pointSpatialIndex.query(pointer, maxCandidateDistance);
        }

        // Merge exact raw dense candidates with ordinary scene candidates (§65).
        const denseProviders = cartesianScene.denseInteraction;
        if (denseProviders && denseProviders.size > 0) {
            const rawCandidates: SceneHitTarget[] = [];
            for (const provider of denseProviders.values()) {
                // Marker providers expose a bounded visual/hit-radius
                // neighborhood for direct containment. Keep the exact
                // center-nearest result as a separate fallback for nearest
                // point and crosshair semantics.
                for (const target of provider.resolvePointerCandidates?.({ pixel: pointer }) ?? []) {
                    rawCandidates.push(target);
                }
                for (const target of provider.resolveNearest({ pixel: pointer })) {
                    rawCandidates.push(target);
                }
            }
            if (rawCandidates.length > 0) {
                const seenIdentities = new Set(
                    pointCandidates.map(t => `${t.seriesId}:${t.index ?? t.dataIndex}`)
                );
                const merged: SceneHitTarget[] = [...pointCandidates];
                for (const raw of rawCandidates) {
                    const identity = `${raw.seriesId}:${raw.index ?? raw.dataIndex}`;
                    if (!seenIdentities.has(identity)) {
                        seenIdentities.add(identity);
                        merged.push(raw);
                    }
                }
                pointCandidates = merged;
            }
        }

        return {
            barTargets,
            financialHits: finHits,
            hitTargets,
            interactionBucketLookup: cartesianScene.interactionBucketLookup,
            interactionBuckets: cartesianScene.interactionBuckets,
            interactionBucketsByAxisId: cartesianScene.interactionBucketsByAxisId,
            maxCandidateDistance,
            plotRectBoundsValid: true,
            pointCandidates,
            pointer
        };
    }
}
