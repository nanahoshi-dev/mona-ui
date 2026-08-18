import type { CartesianHeatmapChartScene, CartesianFunnelChartScene, CartesianWaterfallChartScene, ChartScene } from "../scene/chart-scene";
import type { ChartInteractionBucket, SceneHitTarget } from "../scene/scene-geometry";
import { clamp } from "../utils/number-utils";
import { FunnelKeyboardNavigation } from "./funnel-keyboard-navigation";
import { HeatmapKeyboardNavigation } from "./heatmap-keyboard-navigation";
import { TreemapKeyboardNavigation } from "./treemap-keyboard-navigation";
import { WaterfallKeyboardNavigation } from "./waterfall-keyboard-navigation";

export function getHitTargetKey(hit: SceneHitTarget): string {
    return hit.animationKey ?? hit.sliceId ?? `${hit.seriesId}:${hit.index}`;
}

export interface ChartKeyboardNavResult {
    bucketIndex: number;
    hitKey: string;
    seriesId: string;
}

export interface KeyboardNavigationResult {
    bucketIndex: number;
    hitKey: string | null;
    hitTarget: SceneHitTarget | null;
    seriesId: string | null;
}

export class ChartKeyboardNavigation {
    public static handleKeyDown(
        event: KeyboardEvent,
        scene: ChartScene,
        activeBucketIndex: number,
        activeSeriesId: string | null,
        activeHitKey?: string | null
    ): KeyboardNavigationResult | null {
        if (scene.coordinateSystem === "hierarchical" && scene.hierarchicalKind === "treemap") {
            const currentHit = activeHitKey ? scene.hitTargets.find(h => getHitTargetKey(h) === activeHitKey) ?? null : null;
            const currentId = currentHit?.hierarchy?.nodeId;
            const nextNodeId = TreemapKeyboardNavigation.navigate(currentId, event.key, scene.navigationIndex);
            if (!nextNodeId) {
                return null;
            }
            const nextHit = scene.hitTargets.find(h => h.hierarchy?.nodeId === nextNodeId) ?? null;
            if (!nextHit) {
                return null;
            }
            event.preventDefault();
            return {
                bucketIndex: 0,
                hitKey: getHitTargetKey(nextHit),
                hitTarget: nextHit,
                seriesId: nextHit.seriesId
            };
        }

        if (scene.coordinateSystem === "cartesian") {
            if (scene.cartesianKind === "heatmap") {
                const currentHit = activeHitKey ? scene.hitTargets.find(h => getHitTargetKey(h) === activeHitKey) ?? null : null;
                const nextHit = HeatmapKeyboardNavigation.handleKey(event, scene as CartesianHeatmapChartScene, currentHit);
                if (!nextHit) {
                    return null;
                }
                event.preventDefault();
                const bucketIdx = scene.interactionBuckets?.findIndex(b => b.xKey === nextHit.xKey) ?? 0;
                return {
                    bucketIndex: Math.max(0, bucketIdx),
                    hitKey: getHitTargetKey(nextHit),
                    hitTarget: nextHit,
                    seriesId: nextHit.seriesId
                };
            }

            if (scene.cartesianKind === "funnel") {
                const navRes = FunnelKeyboardNavigation.handleKeyDown(event, scene as CartesianFunnelChartScene, activeBucketIndex);
                if (!navRes) {
                    return null;
                }
                const hitTarget = scene.hitTargets[navRes.bucketIndex] ?? null;
                return {
                    bucketIndex: navRes.bucketIndex,
                    hitKey: navRes.hitKey,
                    hitTarget,
                    seriesId: navRes.seriesId
                };
            }

            if (scene.cartesianKind === "waterfall") {
                const navRes = WaterfallKeyboardNavigation.handleKeyDown(event, scene as CartesianWaterfallChartScene, activeBucketIndex);
                if (!navRes) {
                    return null;
                }
                const hitTarget = scene.hitTargets[navRes.bucketIndex] ?? null;
                return {
                    bucketIndex: navRes.bucketIndex,
                    hitKey: navRes.hitKey,
                    hitTarget,
                    seriesId: navRes.seriesId
                };
            }
        }

        const buckets = scene.interactionBuckets;
        if (!buckets || buckets.length === 0) {
            return null;
        }

        const isSector = scene.coordinateSystem === "polar" && scene.polarKind === "sector";
        const isPolarAxis = scene.coordinateSystem === "polar" && scene.polarKind === "axis";

        switch (event.key) {
            case "ArrowRight": {
                event.preventDefault();
                let nextIdx: number;
                if (isSector || isPolarAxis) {
                    nextIdx = activeBucketIndex < 0 ? 0 : (activeBucketIndex + 1) % buckets.length;
                } else {
                    nextIdx = activeBucketIndex < buckets.length - 1 ? activeBucketIndex + 1 : 0;
                }
                return this.#resolveSelection(buckets, nextIdx, activeSeriesId, activeHitKey);
            }

            case "ArrowLeft": {
                event.preventDefault();
                let prevIdx: number;
                if (isSector || isPolarAxis) {
                    prevIdx =
                        activeBucketIndex < 0
                            ? buckets.length - 1
                            : (activeBucketIndex - 1 + buckets.length) % buckets.length;
                } else {
                    prevIdx = activeBucketIndex > 0 ? activeBucketIndex - 1 : buckets.length - 1;
                }
                return this.#resolveSelection(buckets, prevIdx, activeSeriesId, activeHitKey);
            }

            case "ArrowDown": {
                event.preventDefault();
                if (isSector) {
                    // In sector charts, ArrowDown navigates clockwise same as ArrowRight
                    const nextIdx = activeBucketIndex < 0 ? 0 : (activeBucketIndex + 1) % buckets.length;
                    return this.#resolveSelection(buckets, nextIdx, activeSeriesId, activeHitKey);
                }

                // In Cartesian and Polar Axis charts, ArrowDown cycles to next hit at current spoke/bucket
                const currIdx = activeBucketIndex < 0 ? 0 : activeBucketIndex;
                const bucket = buckets[currIdx];
                if (!bucket || bucket.hits.length === 0) return null;

                let currentHitIdx = -1;
                if (activeHitKey) {
                    currentHitIdx = bucket.hits.findIndex(h => getHitTargetKey(h) === activeHitKey);
                }
                if (currentHitIdx < 0 && activeSeriesId) {
                    currentHitIdx = bucket.hits.findIndex(h => h.seriesId === activeSeriesId);
                }

                const nextHitIdx = currentHitIdx >= 0 ? (currentHitIdx + 1) % bucket.hits.length : 0;
                const hit = bucket.hits[nextHitIdx];
                return {
                    bucketIndex: currIdx,
                    hitKey: getHitTargetKey(hit),
                    hitTarget: hit,
                    seriesId: hit.seriesId
                };
            }

            case "ArrowUp": {
                event.preventDefault();
                if (isSector) {
                    // In sector charts, ArrowUp navigates counter-clockwise same as ArrowLeft
                    const prevIdx =
                        activeBucketIndex < 0
                            ? buckets.length - 1
                            : (activeBucketIndex - 1 + buckets.length) % buckets.length;
                    return this.#resolveSelection(buckets, prevIdx, activeSeriesId, activeHitKey);
                }

                // In Cartesian and Polar Axis charts, ArrowUp cycles to previous hit at current spoke/bucket
                const currIdx = activeBucketIndex < 0 ? 0 : activeBucketIndex;
                const bucket = buckets[currIdx];
                if (!bucket || bucket.hits.length === 0) return null;

                let currentHitIdx = -1;
                if (activeHitKey) {
                    currentHitIdx = bucket.hits.findIndex(h => getHitTargetKey(h) === activeHitKey);
                }
                if (currentHitIdx < 0 && activeSeriesId) {
                    currentHitIdx = bucket.hits.findIndex(h => h.seriesId === activeSeriesId);
                }

                const prevHitIdx =
                    currentHitIdx >= 0 ? (currentHitIdx - 1 + bucket.hits.length) % bucket.hits.length : 0;
                const hit = bucket.hits[prevHitIdx];
                return {
                    bucketIndex: currIdx,
                    hitKey: getHitTargetKey(hit),
                    hitTarget: hit,
                    seriesId: hit.seriesId
                };
            }

            case "Home": {
                event.preventDefault();
                return this.#resolveSelection(buckets, 0, activeSeriesId, activeHitKey);
            }

            case "End": {
                event.preventDefault();
                return this.#resolveSelection(buckets, buckets.length - 1, activeSeriesId, activeHitKey);
            }

            default:
                return null;
        }
    }

    static #resolveSelection(
        buckets: readonly ChartInteractionBucket[],
        bucketIndex: number,
        preferredSeriesId: string | null,
        preferredHitKey?: string | null
    ): KeyboardNavigationResult {
        const clampedIndex = clamp(bucketIndex, 0, buckets.length - 1);
        const bucket = buckets[clampedIndex];
        const hit =
            (preferredHitKey
                ? bucket?.hits.find((h: SceneHitTarget) => getHitTargetKey(h) === preferredHitKey)
                : undefined) ??
            bucket?.hits.find((h: SceneHitTarget) => h.seriesId === preferredSeriesId) ??
            bucket?.hits[0] ??
            null;
        return {
            bucketIndex: clampedIndex,
            hitKey: hit ? getHitTargetKey(hit) : null,
            hitTarget: hit,
            seriesId: hit ? hit.seriesId : preferredSeriesId
        };
    }
}
