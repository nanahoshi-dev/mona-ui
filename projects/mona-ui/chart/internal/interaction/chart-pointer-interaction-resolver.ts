import type { ChartPoint } from "../../models/chart.models";
import type { CartesianXYChartScene, ChartScene } from "../scene/chart-scene";
import type { SceneHitTarget } from "../scene/scene-geometry";
import {
    ChartHitTestEngine,
    findNearestInteractionBucketByX,
    findNearestInteractionBucketByY
} from "./chart-hit-test-engine";
import type { ChartInteractionState } from "./chart-interaction-state";

export interface ChartPointerResolution {
    readonly bucketHits: readonly SceneHitTarget[];
    readonly hitState: ChartInteractionState;
    readonly nearestAnchor: ChartPoint | null;
    readonly pointer: ChartPoint;
    readonly primaryHit: SceneHitTarget | null;
    readonly snappedAnchor: ChartPoint | null;
}

export interface ChartPointerInteractionDemand {
    readonly maxDistance?: number;
    readonly needHitTest?: boolean;
}

export class ChartPointerInteractionResolver {
    public static resolve(
        pointer: ChartPoint,
        scene: ChartScene,
        sharedTooltip: boolean,
        maxDistanceOrDemand: number | ChartPointerInteractionDemand = 32
    ): ChartPointerResolution {
        const demand = typeof maxDistanceOrDemand === "number"
            ? { maxDistance: maxDistanceOrDemand, needHitTest: true }
            : { maxDistance: 32, needHitTest: true, ...maxDistanceOrDemand };

        const effectiveMaxDistance = Number.isFinite(demand.maxDistance) && demand.maxDistance! >= 0
            ? demand.maxDistance!
            : 32;

        if (demand.needHitTest === false) {
            const emptyHitState: ChartInteractionState = {
                activeHitTarget: null,
                activeHits: [],
                pointerPosition: pointer
            };
            return {
                bucketHits: [],
                hitState: emptyHitState,
                nearestAnchor: null,
                pointer,
                primaryHit: null,
                snappedAnchor: null
            };
        }

        const hitState = ChartHitTestEngine.testHit(pointer, scene, sharedTooltip, effectiveMaxDistance);
        const primaryHit = hitState.activeHitTarget ?? hitState.activeHits[0] ?? null;
        const bucketHits = hitState.activeHits;

        let snappedAnchor: ChartPoint | null = null;
        if (primaryHit) {
            if (primaryHit.point) {
                snappedAnchor = primaryHit.point;
            } else if (primaryHit.bounds) {
                snappedAnchor = {
                    x: primaryHit.bounds.x + primaryHit.bounds.width / 2,
                    y: primaryHit.bounds.y + primaryHit.bounds.height / 2
                };
            }
        }

        let nearestAnchor: ChartPoint | null = snappedAnchor;
        if (scene.coordinateSystem === "cartesian" && scene.cartesianKind === "xy") {
            const cartesianScene = scene as CartesianXYChartScene;
            const buckets = cartesianScene.interactionBuckets;
            if (buckets && buckets.length > 0) {
                const nearestBucket =
                    cartesianScene.interactionAxis === "y"
                        ? findNearestInteractionBucketByY(buckets, pointer.y)
                        : findNearestInteractionBucketByX(buckets, pointer.x);
                if (nearestBucket) {
                    nearestAnchor = nearestBucket.anchor;
                }
            }
        }

        return {
            bucketHits,
            hitState,
            nearestAnchor,
            pointer,
            primaryHit,
            snappedAnchor
        };
    }
}
