import type { CartesianFunnelChartScene, CartesianHeatmapChartScene, CartesianWaterfallChartScene, CartesianXYChartScene, ChartScene } from "../scene/chart-scene";
import type { ChartInteractionBucket, SceneHitTarget } from "../scene/scene-geometry";
import { clamp } from "../utils/number-utils";
import { FunnelKeyboardNavigation } from "./funnel-keyboard-navigation";
import { HeatmapKeyboardNavigation } from "./heatmap-keyboard-navigation";
import { TreemapKeyboardNavigation } from "./treemap-keyboard-navigation";
import { WaterfallKeyboardNavigation } from "./waterfall-keyboard-navigation";

export function getHitTargetKey(hit: SceneHitTarget): string {
    return hit.animationKey ?? hit.sliceId ?? `${hit.seriesId}:${hit.index}`;
}

export interface ChartKeyboardAxisNamespace {
    readonly axis: "x" | "y";
    readonly axisId: string;
}

export interface ChartKeyboardSelectionState {
    readonly bucketIndex: number;
    readonly hitKey: string | null;
    readonly namespace: ChartKeyboardAxisNamespace;
    readonly seriesId: string | null;
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
    namespace?: ChartKeyboardAxisNamespace;
    seriesId: string | null;
}

export function getAvailableAxisNamespaces(scene: ChartScene): readonly ChartKeyboardAxisNamespace[] {
    if (scene.coordinateSystem !== "cartesian" || scene.cartesianKind !== "xy") {
        return [{ axis: "x", axisId: "default" }];
    }
    const cartesianScene = scene as CartesianXYChartScene;
    const dimension: "x" | "y" = cartesianScene.interactionAxis === "y" ? "y" : "x";

    const axisIds: string[] = [];
    if (cartesianScene.interactionBucketsByAxisId && cartesianScene.interactionBucketsByAxisId.size > 0) {
        if (cartesianScene.axes) {
            for (const axisScene of cartesianScene.axes) {
                if (
                    axisScene.axis === dimension &&
                    axisScene.axisId &&
                    cartesianScene.interactionBucketsByAxisId.has(axisScene.axisId)
                ) {
                    if (!axisIds.includes(axisScene.axisId)) {
                        axisIds.push(axisScene.axisId);
                    }
                }
            }
        }
        for (const id of cartesianScene.interactionBucketsByAxisId.keys()) {
            if (!axisIds.includes(id)) {
                axisIds.push(id);
            }
        }
    }

    if (axisIds.length === 0) {
        const primaryId =
            dimension === "y"
                ? (cartesianScene.primaryYAxisId ?? "default")
                : (cartesianScene.primaryXAxisId ?? "default");
        axisIds.push(primaryId);
    }
    return axisIds.map(axisId => ({ axis: dimension, axisId }));
}

export function resolveInteractionBuckets(
    scene: ChartScene,
    namespace?: ChartKeyboardAxisNamespace | null
): readonly ChartInteractionBucket[] {
    if (scene.coordinateSystem !== "cartesian" || scene.cartesianKind !== "xy") {
        return scene.interactionBuckets ?? [];
    }
    const cartesianScene = scene as CartesianXYChartScene;
    const dimension: "x" | "y" = cartesianScene.interactionAxis === "y" ? "y" : "x";
    const primaryId =
        dimension === "y"
            ? (cartesianScene.primaryYAxisId ?? "")
            : (cartesianScene.primaryXAxisId ?? "");

    const targetNamespace = namespace ?? {
        axis: dimension,
        axisId: primaryId
    };

    if (cartesianScene.interactionBucketsByAxisId && targetNamespace.axisId) {
        const map = cartesianScene.interactionBucketsByAxisId.get(targetNamespace.axisId);
        if (map && map.size > 0) {
            return Array.from(map.values());
        }
    }

    if (!targetNamespace.axisId || targetNamespace.axisId === primaryId || !cartesianScene.interactionBucketsByAxisId) {
        return scene.interactionBuckets ?? [];
    }

    return [];
}

export class ChartKeyboardNavigation {
    static #resolveSelection(
        buckets: readonly ChartInteractionBucket[],
        bucketIndex: number,
        preferredSeriesId: string | null,
        preferredHitKey?: string | null,
        namespace?: ChartKeyboardAxisNamespace
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
            seriesId: hit ? hit.seriesId : preferredSeriesId,
            namespace
        };
    }

    public static handleKeyDown(
        event: KeyboardEvent,
        scene: ChartScene,
        activeBucketIndex: number,
        activeSeriesId: string | null,
        activeHitKey?: string | null,
        activeNamespace?: ChartKeyboardAxisNamespace | null
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

        const isCartesianXY = scene.coordinateSystem === "cartesian" && scene.cartesianKind === "xy";
        const availableNamespaces = getAvailableAxisNamespaces(scene);
        const resolvedNamespace: ChartKeyboardAxisNamespace =
            activeNamespace && availableNamespaces.some(ns => ns.axis === activeNamespace.axis && ns.axisId === activeNamespace.axisId)
                ? activeNamespace
                : availableNamespaces[0];

        // PageUp / PageDown namespace cycling for multi-axis Cartesian charts
        if (isCartesianXY && (event.key === "PageDown" || event.key === "PageUp")) {
            if (availableNamespaces.length > 1) {
                event.preventDefault();
                const currentIdx = availableNamespaces.findIndex(
                    ns => ns.axis === resolvedNamespace.axis && ns.axisId === resolvedNamespace.axisId
                );
                const baseIdx = currentIdx >= 0 ? currentIdx : 0;
                const nextIdx =
                    event.key === "PageDown"
                        ? (baseIdx + 1) % availableNamespaces.length
                        : (baseIdx - 1 + availableNamespaces.length) % availableNamespaces.length;
                const nextNamespace = availableNamespaces[nextIdx];
                const nextBuckets = resolveInteractionBuckets(scene, nextNamespace);
                if (nextBuckets.length > 0) {
                    const currentHit = activeHitKey
                        ? scene.hitTargets.find(h => getHitTargetKey(h) === activeHitKey)
                        : undefined;
                    let targetBucketIndex = -1;
                    if (currentHit) {
                        targetBucketIndex = nextBuckets.findIndex(b => b.xKey === currentHit.xKey);
                    }
                    if (targetBucketIndex < 0) {
                        targetBucketIndex = clamp(activeBucketIndex < 0 ? 0 : activeBucketIndex, 0, nextBuckets.length - 1);
                    }
                    return this.#resolveSelection(
                        nextBuckets,
                        targetBucketIndex,
                        activeSeriesId,
                        activeHitKey,
                        nextNamespace
                    );
                }
            }
            return null;
        }

        const buckets = resolveInteractionBuckets(scene, resolvedNamespace);
        if (!buckets || buckets.length === 0) {
            return null;
        }

        const isSector = scene.coordinateSystem === "polar" && scene.polarKind === "sector";
        const isPolarAxis = scene.coordinateSystem === "polar" && scene.polarKind === "axis";
        const isHorizontal = (scene as CartesianXYChartScene).interactionAxis === "y";

        switch (event.key) {
            case "ArrowRight": {
                event.preventDefault();
                if (isHorizontal) {
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
                        seriesId: hit.seriesId,
                        namespace: resolvedNamespace
                    };
                }

                let nextIdx: number;
                if (isSector || isPolarAxis) {
                    nextIdx = activeBucketIndex < 0 ? 0 : (activeBucketIndex + 1) % buckets.length;
                } else {
                    nextIdx = activeBucketIndex < buckets.length - 1 ? activeBucketIndex + 1 : 0;
                }
                return this.#resolveSelection(buckets, nextIdx, activeSeriesId, activeHitKey, resolvedNamespace);
            }

            case "ArrowLeft": {
                event.preventDefault();
                if (isHorizontal) {
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
                        seriesId: hit.seriesId,
                        namespace: resolvedNamespace
                    };
                }

                let prevIdx: number;
                if (isSector || isPolarAxis) {
                    prevIdx =
                        activeBucketIndex < 0
                            ? buckets.length - 1
                            : (activeBucketIndex - 1 + buckets.length) % buckets.length;
                } else {
                    prevIdx = activeBucketIndex > 0 ? activeBucketIndex - 1 : buckets.length - 1;
                }
                return this.#resolveSelection(buckets, prevIdx, activeSeriesId, activeHitKey, resolvedNamespace);
            }

            case "ArrowDown": {
                event.preventDefault();
                if (isHorizontal) {
                    const nextIdx = activeBucketIndex < buckets.length - 1 ? activeBucketIndex + 1 : 0;
                    return this.#resolveSelection(buckets, nextIdx, activeSeriesId, activeHitKey, resolvedNamespace);
                }

                if (isSector) {
                    const nextIdx = activeBucketIndex < 0 ? 0 : (activeBucketIndex + 1) % buckets.length;
                    return this.#resolveSelection(buckets, nextIdx, activeSeriesId, activeHitKey, resolvedNamespace);
                }

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
                    seriesId: hit.seriesId,
                    namespace: resolvedNamespace
                };
            }

            case "ArrowUp": {
                event.preventDefault();
                if (isHorizontal) {
                    const prevIdx = activeBucketIndex > 0 ? activeBucketIndex - 1 : buckets.length - 1;
                    return this.#resolveSelection(buckets, prevIdx, activeSeriesId, activeHitKey, resolvedNamespace);
                }

                if (isSector) {
                    const prevIdx =
                        activeBucketIndex < 0
                            ? buckets.length - 1
                            : (activeBucketIndex - 1 + buckets.length) % buckets.length;
                    return this.#resolveSelection(buckets, prevIdx, activeSeriesId, activeHitKey, resolvedNamespace);
                }

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
                    seriesId: hit.seriesId,
                    namespace: resolvedNamespace
                };
            }

            case "Home": {
                event.preventDefault();
                return this.#resolveSelection(buckets, 0, activeSeriesId, activeHitKey, resolvedNamespace);
            }

            case "End": {
                event.preventDefault();
                return this.#resolveSelection(buckets, buckets.length - 1, activeSeriesId, activeHitKey, resolvedNamespace);
            }

            default:
                return null;
        }
    }
}

