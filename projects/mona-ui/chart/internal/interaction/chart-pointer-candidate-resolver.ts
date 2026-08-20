import type { ChartPoint } from "../../models/chart.models";
import type { CartesianXYChartScene, ChartScene } from "../scene/chart-scene";
import type { ChartInteractionBucket, ChartInteractionXKey, SceneHitTarget } from "../scene/scene-geometry";

export interface ChartPointerCandidates {
    readonly barTargets: readonly SceneHitTarget[];
    readonly financialHits: readonly SceneHitTarget[];
    readonly hitTargets: readonly SceneHitTarget[];
    readonly interactionBuckets?: readonly ChartInteractionBucket[];
    readonly interactionBucketsByAxisId?: ReadonlyMap<string, ReadonlyMap<ChartInteractionXKey, ChartInteractionBucket>>;
    readonly interactionBucketLookup?: ReadonlyMap<ChartInteractionXKey, ChartInteractionBucket>;
    readonly maxCandidateDistance: number;
    readonly plotRectBoundsValid: boolean;
    readonly pointCandidates: readonly SceneHitTarget[];
    readonly pointer: ChartPoint;
}

export class ChartPointerCandidateResolver {
    public static discoveryCount: number = 0;

    public static resetDiscoveryCount(): void {
        ChartPointerCandidateResolver.discoveryCount = 0;
    }

    public static discover(
        pointer: ChartPoint,
        scene: ChartScene,
        maxCandidateDistance: number = 32
    ): ChartPointerCandidates {
        ChartPointerCandidateResolver.discoveryCount++;

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
        const finHits = cartesianScene.financialIndex ? cartesianScene.financialIndex.query(pointer) : [];
        const pointSpatialIndex = cartesianScene.pointSpatialIndex ?? cartesianScene.markerSpatialIndex;
        const pointCandidates = pointSpatialIndex
            ? pointSpatialIndex.query(pointer, maxCandidateDistance)
            : hitTargets;

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
