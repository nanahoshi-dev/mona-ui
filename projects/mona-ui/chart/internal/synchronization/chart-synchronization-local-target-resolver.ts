import type { ChartPoint } from "../../models/chart.models";
import type { SceneHitTarget } from "../scene/scene-geometry";
import type { CartesianXYChartScene } from "../scene/chart-scene";
import {
    findNearestInteractionBucketByX,
    findNearestInteractionBucketByY
} from "../interaction/chart-interaction-bucket-search";
import { ChartMarkIdentityResolver } from "../interaction/chart-mark-identity-resolver";
import {
    type InteractionGeometryDistanceResult,
    resolveInteractionGeometryDistance
} from "../interaction/cartesian-interaction-geometry-index";

export { resolveInteractionGeometryDistance, type InteractionGeometryDistanceResult };

export interface SyncCandidateTarget {
    readonly distance: number;
    readonly hit: SceneHitTarget;
    readonly isDense: boolean;
    readonly nearestAnchor: ChartPoint;
    readonly tieBreakSecondaryDistance: number;
}

export interface SyncLocalTargetResolution {
    readonly anchor: ChartPoint;
    readonly nearestAnchor: ChartPoint;
    readonly primaryHit: SceneHitTarget | null;
    readonly sharedHits: readonly SceneHitTarget[];
    readonly snapped: boolean;
    readonly xValue?: unknown;
    readonly yValue?: unknown;
}

export interface ResolveSyncLocalTargetOptions {
    readonly anchor: ChartPoint;
    readonly dimension: "x" | "y" | "xy";
    readonly mappedXAxisId?: string;
    readonly mappedYAxisId?: string;
    readonly scene: CartesianXYChartScene;
    readonly sharedTooltip?: boolean;
}

function keysMatch(a: unknown, b: unknown): boolean {
    if (a === b) {
        return true;
    }
    if (a === null || a === undefined || b === null || b === undefined) {
        return false;
    }
    if (a instanceof Date || b instanceof Date) {
        const tA = a instanceof Date ? a.getTime() : Number(a);
        const tB = b instanceof Date ? b.getTime() : Number(b);
        return Number.isFinite(tA) && Number.isFinite(tB) && tA === tB;
    }
    if (typeof a === "number" && typeof b === "number") {
        return a === b;
    }
    return String(a) === String(b);
}

/**
 * Resolves the globally nearest local datum across all dense providers and ordinary
 * scene targets for synchronized nearest-point and tooltip presentation (WP2 / SD4-R03, SD4-R04, SD4-R05, SD6-R13, SD6-R14, SD6-R15).
 */
export function resolveSynchronizationLocalTarget(
    options: ResolveSyncLocalTargetOptions
): SyncLocalTargetResolution | null {
    const { anchor, dimension, mappedXAxisId, mappedYAxisId, scene, sharedTooltip = false } = options;
    if (!scene) {
        return null;
    }

    const candidates: SyncCandidateTarget[] = [];

    // 1. Collect from all dense interaction providers
    if (scene.denseInteraction && scene.denseInteraction.size > 0) {
        for (const provider of scene.denseInteraction.values()) {
            if (mappedXAxisId && provider.xAxisId && provider.xAxisId !== mappedXAxisId) {
                continue;
            }
            if (mappedYAxisId && provider.yAxisId && provider.yAxisId !== mappedYAxisId) {
                continue;
            }
            const hits = provider.resolveNearest({
                dimension,
                pixel: anchor,
                xAxisId: mappedXAxisId,
                yAxisId: mappedYAxisId
            });
            for (const hit of hits) {
                const geom = resolveInteractionGeometryDistance(hit, anchor, dimension);
                candidates.push({
                    distance: geom.primaryDistance,
                    hit,
                    isDense: true,
                    nearestAnchor: geom.nearestPoint,
                    tieBreakSecondaryDistance: geom.secondaryDistance
                });
            }
        }
    }

    // 2. Collect from ordinary scene targets via exact geometry index (SD6-R13, SD6-R14)
    if (scene.interactionGeometryIndex) {
        const hits = scene.interactionGeometryIndex.resolveNearest({
            dimension,
            maxCandidates: 4,
            pixel: anchor,
            xAxisId: mappedXAxisId,
            yAxisId: mappedYAxisId
        });
        for (const hit of hits) {
            const geom = resolveInteractionGeometryDistance(hit, anchor, dimension);
            candidates.push({
                distance: geom.primaryDistance,
                hit,
                isDense: false,
                nearestAnchor: geom.nearestPoint,
                tieBreakSecondaryDistance: geom.secondaryDistance
            });
        }
    } else if (scene.hitTargets && scene.hitTargets.length > 0) {
        for (const hit of scene.hitTargets) {
            if (mappedXAxisId && hit.xAxisId && hit.xAxisId !== mappedXAxisId) {
                continue;
            }
            if (mappedYAxisId && hit.yAxisId && hit.yAxisId !== mappedYAxisId) {
                continue;
            }
            const geom = resolveInteractionGeometryDistance(hit, anchor, dimension);
            candidates.push({
                distance: geom.primaryDistance,
                hit,
                isDense: false,
                nearestAnchor: geom.nearestPoint,
                tieBreakSecondaryDistance: geom.secondaryDistance
            });
        }
    } else if (scene.interactionBuckets && scene.interactionBuckets.length > 0) {
        for (const bucket of scene.interactionBuckets) {
            for (const hit of bucket.hits) {
                if (mappedXAxisId && hit.xAxisId && hit.xAxisId !== mappedXAxisId) {
                    continue;
                }
                if (mappedYAxisId && hit.yAxisId && hit.yAxisId !== mappedYAxisId) {
                    continue;
                }
                const geom = resolveInteractionGeometryDistance(hit, anchor, dimension);
                candidates.push({
                    distance: geom.primaryDistance,
                    hit,
                    isDense: false,
                    nearestAnchor: geom.nearestPoint,
                    tieBreakSecondaryDistance: geom.secondaryDistance
                });
            }
        }
    }

    if (candidates.length === 0) {
        const buckets = scene.interactionBuckets;
        if (buckets && buckets.length > 0) {
            const nearestBucket =
                scene.interactionAxis === "y"
                    ? findNearestInteractionBucketByY(buckets, anchor.y)
                    : findNearestInteractionBucketByX(buckets, anchor.x);
            if (nearestBucket) {
                return {
                    anchor,
                    nearestAnchor: nearestBucket.anchor,
                    primaryHit: null,
                    sharedHits: [],
                    snapped: false
                };
            }
        }
        return null;
    }

    // 3. Stage 1: Sort deterministically: distance ASC, secondaryDistance ASC, seriesId ASC, index ASC
    candidates.sort((a, b) => {
        if (Math.abs(a.distance - b.distance) > 1e-6) {
            return a.distance - b.distance;
        }
        if (Math.abs(a.tieBreakSecondaryDistance - b.tieBreakSecondaryDistance) > 1e-6) {
            return a.tieBreakSecondaryDistance - b.tieBreakSecondaryDistance;
        }
        if (a.hit.seriesId !== b.hit.seriesId) {
            return a.hit.seriesId < b.hit.seriesId ? -1 : 1;
        }
        return (a.hit.index ?? 0) - (b.hit.index ?? 0);
    });

    const best = candidates[0];
    const bestHit = best.hit;
    const snappedPoint = best.nearestAnchor;

    // 4. Stage 2: Shared tooltip bucket filtering (SD4-R03, SD6-R15)
    let sharedHits: readonly SceneHitTarget[];
    if (!sharedTooltip) {
        sharedHits = [bestHit];
    } else {
        const interactionAxis = scene.interactionAxis ?? "x";
        const primaryAxisId = interactionAxis === "y" ? bestHit.yAxisId : bestHit.xAxisId;
        const primaryKey =
            interactionAxis === "y"
                ? bestHit.yValue !== undefined
                    ? bestHit.yValue
                    : bestHit.value
                : bestHit.xKey !== undefined
                  ? bestHit.xKey
                  : bestHit.xValue;

        const bucketMap = new Map<string, SceneHitTarget>();
        const addHit = (h: SceneHitTarget) => {
            const hAxisId = interactionAxis === "y" ? h.yAxisId : h.xAxisId;
            if (primaryAxisId && hAxisId && hAxisId !== primaryAxisId) {
                return;
            }
            const hKey =
                interactionAxis === "y"
                    ? h.yValue !== undefined
                        ? h.yValue
                        : h.value
                    : h.xKey !== undefined
                      ? h.xKey
                      : h.xValue;

            if (keysMatch(primaryKey, hKey)) {
                const markId = ChartMarkIdentityResolver.resolve(h);
                if (!bucketMap.has(markId)) {
                    bucketMap.set(markId, h);
                }
            }
        };

        // Add matching ordinary hits from direct bucket index if available, else scene hits
        let targetBucket: import("../scene/scene-geometry").ChartInteractionBucket | undefined;
        if (primaryAxisId && scene.interactionBucketsByAxisId?.has(primaryAxisId)) {
            targetBucket = scene.interactionBucketsByAxisId.get(primaryAxisId)?.get(primaryKey as never);
        }
        if (!targetBucket && scene.interactionBucketLookup) {
            targetBucket = scene.interactionBucketLookup.get(primaryKey as never);
        }
        if (targetBucket) {
            for (const h of targetBucket.hits) {
                addHit(h);
            }
        } else if (scene.hitTargets) {
            for (const h of scene.hitTargets) {
                addHit(h);
            }
        }

        // Query dense providers at primary semantic key (SD6-R15 / WP12)
        if (scene.denseInteraction && scene.denseInteraction.size > 0) {
            for (const provider of scene.denseInteraction.values()) {
                if (provider.resolveSemanticBucket) {
                    const matches = provider.resolveSemanticBucket({
                        axis: interactionAxis,
                        axisId: primaryAxisId,
                        key: primaryKey
                    });
                    for (const m of matches) {
                        addHit(m);
                    }
                }
            }
        }

        // Also add any already-collected candidates that match
        for (const c of candidates) {
            addHit(c.hit);
        }

        const list = Array.from(bucketMap.values());
        list.sort((a, b) => {
            if (a.seriesId !== b.seriesId) {
                return a.seriesId < b.seriesId ? -1 : 1;
            }
            return (a.index ?? 0) - (b.index ?? 0);
        });
        sharedHits = list.length > 0 ? list : [bestHit];
    }

    return {
        anchor,
        nearestAnchor: snappedPoint,
        primaryHit: bestHit,
        sharedHits,
        snapped: true,
        xValue: bestHit.xValue,
        yValue: bestHit.yValue
    };
}
