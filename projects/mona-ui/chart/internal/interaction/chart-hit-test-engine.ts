import type { ChartPoint } from "../../models/chart.models";
import type { ChartScene } from "../scene/chart-scene";
import type { SceneHitTarget } from "../scene/scene-geometry";
import { distance, isPointInRect } from "../utils/geometry-utils";
import type { ChartInteractionState } from "./chart-interaction-state";

export class ChartHitTestEngine {
    public static testHit(
        pointer: ChartPoint,
        scene: ChartScene,
        shared: boolean = false,
        maxHoverDistance: number = 32
    ): ChartInteractionState {
        const { hitTargets, plotRect } = scene;

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

        // 1. Direct bar hit test
        for (const target of hitTargets) {
            if (target.bounds && isPointInRect(pointer, target.bounds)) {
                const sameIndexHits = shared
                    ? hitTargets.filter(t => t.index === target.index)
                    : [target];
                return {
                    activeHitTarget: target,
                    activeHits: sameIndexHits,
                    pointerPosition: pointer
                };
            }
        }

        // 2. Line/area nearest X or nearest Euclidean point
        let nearestTarget: SceneHitTarget | null = null;
        let minDistance = Number.POSITIVE_INFINITY;
        let minXDistance = Number.POSITIVE_INFINITY;
        let bestIndex = -1;

        for (const target of hitTargets) {
            if (target.point) {
                const dist = distance(pointer.x, pointer.y, target.point.x, target.point.y);
                const xDist = Math.abs(pointer.x - target.point.x);

                if (dist < minDistance && dist <= (target.radius ?? maxHoverDistance)) {
                    minDistance = dist;
                    nearestTarget = target;
                }

                if (xDist < minXDistance) {
                    minXDistance = xDist;
                    bestIndex = target.index;
                }
            }
        }

        if (shared && bestIndex !== -1 && minXDistance <= maxHoverDistance) {
            const indexHits = hitTargets.filter(t => t.index === bestIndex);
            return {
                activeHitTarget: nearestTarget ?? indexHits[0] ?? null,
                activeHits: indexHits,
                pointerPosition: pointer
            };
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
