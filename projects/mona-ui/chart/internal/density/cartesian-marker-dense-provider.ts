import type { ChartPoint } from "../../models/chart.models";
import type { ChartContinuousPositionScale, ChartPositionScale } from "../scale/chart-scale";
import type { SceneHitTarget } from "../scene/scene-geometry";
import {
    type CartesianDenseInteractionProvider,
    type CartesianDenseMarkIdentityQuery,
    type CartesianDensePointerQuery,
    type CartesianDenseRangeQuery,
    type CartesianDenseSemanticBucketQuery,
    DenseMarkIdentityIndex
} from "./cartesian-dense-interaction-provider";
import type {
    CartesianSpatialDensityIndex,
    SpatialDistanceMetric,
    SpatialHierarchyNode
} from "./cartesian-spatial-density-index";
import { ChartDensityTracker } from "../layout/chart-density-instrumentation";
import { resolveMarkKeyPart } from "../animation/animation-identity";
import { areSemanticNumbersEqual, normalizeSemanticNumericKey } from "./cartesian-semantic-key";
import {
    cartesianBubbleMarkerHitPadding,
    cartesianMarkerHitEpsilon,
    resolveCartesianBubbleHitRadius
} from "./cartesian-marker-hit-materializer";

/**
 * Exact raw interaction for scatter/bubble via the normalized spatial
 * hierarchy: nearest-neighbor by increasing lower-bound distance (§64/§220)
 * and rectangular candidate discovery with exact final filtering (§221).
 */
import type { ChartSeriesMarkIdentityAuthority } from "../animation/chart-series-mark-identity-authority";

export class CartesianMarkerSpatialInteractionProvider implements CartesianDenseInteractionProvider {
    readonly #bubbleRadiusScale?: (size: number) => number;
    readonly #hierarchy: CartesianSpatialDensityIndex;
    readonly #identity?: ChartSeriesMarkIdentityAuthority;
    readonly #materialize: (sourceIndex: number) => SceneHitTarget | null;
    readonly #maxHitRadius: number;
    readonly #maxVisualRadius: number;
    readonly #onCandidateVisited?: () => void;
    readonly #onNodeVisited?: () => void;
    readonly #seriesType?: "bubble" | "scatter";
    readonly #sizes: Float64Array | null;
    readonly #sourceData?: readonly unknown[];
    readonly #xBaseDenormalize?: (normalized: number) => unknown;
    readonly #xBaseNormalize: (semanticValue: unknown) => number;
    readonly #xViewportScale: ChartContinuousPositionScale<number | Date>;
    readonly #yBaseDenormalize?: (normalized: number) => unknown;
    readonly #yBaseNormalize: (semanticValue: unknown) => number;
    readonly #yViewportScale: ChartPositionScale<unknown>;
    #identityIndex: DenseMarkIdentityIndex | null = null;
    public readonly seriesId?: string;
    public readonly xAxisId?: string;
    public readonly yAxisId?: string;

    public constructor(input: {
        readonly bubbleRadiusScale?: (size: number) => number;
        readonly hierarchy: CartesianSpatialDensityIndex;
        readonly identity?: ChartSeriesMarkIdentityAuthority;
        readonly materialize: (sourceIndex: number) => SceneHitTarget | null;
        readonly maxHitRadius?: number;
        readonly maxVisualRadius?: number;
        readonly onCandidateVisited?: () => void;
        readonly onNodeVisited?: () => void;
        readonly seriesId?: string;
        readonly seriesType?: "bubble" | "scatter";
        readonly sizes?: Float64Array | null;
        readonly sourceData?: readonly unknown[];
        readonly xAxisId?: string;
        readonly xBaseDenormalize?: (normalized: number) => unknown;
        readonly xBaseNormalize?: (semanticValue: unknown) => number;
        readonly xViewportScale: ChartContinuousPositionScale<number | Date>;
        readonly yAxisId?: string;
        readonly yBaseDenormalize?: (normalized: number) => unknown;
        readonly yBaseNormalize?: (semanticValue: unknown) => number;
        readonly yViewportScale: ChartPositionScale<unknown>;
    }) {
        this.#bubbleRadiusScale = input.bubbleRadiusScale;
        this.#hierarchy = input.hierarchy;
        this.#identity = input.identity;
        this.#materialize = input.materialize;
        this.#maxVisualRadius = input.maxVisualRadius ?? 16;
        this.#maxHitRadius = Math.max(input.maxHitRadius ?? this.#maxVisualRadius + 6, this.#maxVisualRadius, 10);
        this.#onCandidateVisited = input.onCandidateVisited;
        this.#onNodeVisited = input.onNodeVisited;
        this.#seriesType = input.seriesType;
        this.#sizes = input.sizes ?? null;
        this.#sourceData = input.sourceData;
        this.seriesId = input.seriesId;
        this.xAxisId = input.xAxisId;
        this.yAxisId = input.yAxisId;
        this.#xBaseDenormalize = input.xBaseDenormalize;
        this.#xBaseNormalize = input.xBaseNormalize ?? (v => (typeof v === "number" ? v : Number(v)));
        this.#yBaseDenormalize = input.yBaseDenormalize;
        this.#yBaseNormalize = input.yBaseNormalize ?? (v => (typeof v === "number" ? v : Number(v)));
        this.#xViewportScale = input.xViewportScale;
        this.#yViewportScale = input.yViewportScale;
    }

    public locateMarkIdentity(query: CartesianDenseMarkIdentityQuery): number | null {
        if (this.#identity) {
            return this.#identity.locate(query);
        }
        if (!this.#identityIndex) {
            const count = this.#sourceData?.length ?? this.#hierarchy.pointCount;
            this.#identityIndex = new DenseMarkIdentityIndex(
                count,
                (_datum, i) =>
                    resolveMarkKeyPart(this.#sourceData ? this.#sourceData[i] : undefined, undefined, i, i).part
            );
        }
        return this.#identityIndex.locate(query);
    }

    public materializeAt(sourceIndex: number): SceneHitTarget | null {
        return sourceIndex >= 0 ? this.#materialize(sourceIndex) : null;
    }

    public queryRange(query: CartesianDenseRangeQuery): readonly SceneHitTarget[] {
        const minPxX = Math.min(query.pixelA.x, query.pixelB.x);
        const maxPxX = Math.max(query.pixelA.x, query.pixelB.x);
        const minPxY = Math.min(query.pixelA.y, query.pixelB.y);
        const maxPxY = Math.max(query.pixelA.y, query.pixelB.y);

        const radiusPad = query.hitPolicy === "intersect" ? this.#maxVisualRadius : 0;
        const uA = this.toNormalizedU(minPxX - radiusPad);
        const uB = this.toNormalizedU(maxPxX + radiusPad);
        const vA = this.toNormalizedV(minPxY - radiusPad);
        const vB = this.toNormalizedV(maxPxY + radiusPad);
        if (uA === null || uB === null || vA === null || vB === null) {
            return [];
        }
        const window: [number, number, number, number] = [
            Math.min(uA, uB),
            Math.min(vA, vB),
            Math.abs(uB - uA),
            Math.abs(vB - vA)
        ];

        const matches: SceneHitTarget[] = [];
        this.#hierarchy.queryRangeNormalized(window, idx => {
            if (window[2] <= 0 || window[3] <= 0) {
                return;
            }
            ChartDensityTracker.current?.onDenseRawHitMaterialized?.();
            const target = this.#materialize(idx);
            if (!target || !target.point) {
                return;
            }

            const pt = target.point;
            const radius = target.visualRadius ?? target.radius ?? 4;
            let matchesFilter = false;
            if (query.hitPolicy === "intersect") {
                matchesFilter =
                    pt.x + radius >= minPxX &&
                    pt.x - radius <= maxPxX &&
                    pt.y + radius >= minPxY &&
                    pt.y - radius <= maxPxY;
            } else {
                matchesFilter = pt.x >= minPxX && pt.x <= maxPxX && pt.y >= minPxY && pt.y <= maxPxY;
            }

            if (matchesFilter) {
                matches.push(target);
            }
        });
        matches.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
        return matches;
    }

    public resolveSemanticBucket(query: CartesianDenseSemanticBucketQuery): readonly SceneHitTarget[] {
        if (query.axis !== "x") {
            return [];
        }
        if (query.axisId && this.xAxisId && query.axisId !== this.xAxisId) {
            return [];
        }
        const key = query.key;
        const semanticX = normalizeSemanticNumericKey(key);
        if (semanticX === null) {
            return [];
        }
        const u = this.#xBaseNormalize(key);
        if (!Number.isFinite(u)) {
            return [];
        }
        const rootBounds = this.#hierarchy.rootBounds;
        const window: [number, number, number, number] = [u - 1e-6, rootBounds[1], 2e-6, rootBounds[3]];
        const matches: SceneHitTarget[] = [];
        this.#hierarchy.queryRangeNormalized(window, idx => {
            const target = this.#materialize(idx);
            if (!target) return;
            const targetX = normalizeSemanticNumericKey(target.xKey ?? target.xValue);
            if (targetX !== null && areSemanticNumbersEqual(targetX, semanticX)) {
                matches.push(target);
            }
        });
        return matches;
    }

    /**
     * Discovers raw marker candidates in a pixel-radius neighborhood. Exact
     * visual and forgiving containment is evaluated from the materialized
     * current marker geometry. Source-order traversal stops at the first
     * qualifying mark, while degenerate bubble leaves use their threshold
     * index instead of scanning every identical source point.
     */
    public resolvePointerCandidates(query: CartesianDensePointerQuery): readonly SceneHitTarget[] {
        const radius = this.#maxHitRadius;
        const minPxX = query.pixel.x - radius;
        const maxPxX = query.pixel.x + radius;
        const minPxY = query.pixel.y - radius;
        const maxPxY = query.pixel.y + radius;
        const uA = this.toNormalizedU(minPxX);
        const uB = this.toNormalizedU(maxPxX);
        const vA = this.toNormalizedV(minPxY);
        const vB = this.toNormalizedV(maxPxY);
        if (uA === null || uB === null || vA === null || vB === null) {
            return [];
        }

        const window: [number, number, number, number] = [
            Math.min(uA, uB),
            Math.min(vA, vB),
            Math.abs(uB - uA),
            Math.abs(vB - vA)
        ];
        const resolveClass = (visual: boolean): SceneHitTarget | null => {
            const index = this.#hierarchy.resolveTopmostPointerCandidate(
                window,
                sourceIndex => {
                    const target = this.materializePointerCandidate(sourceIndex);
                    if (!target?.point) {
                        return false;
                    }
                    const visualRadius = Number.isFinite(target.visualRadius)
                        ? Math.max(0, target.visualRadius!)
                        : Math.max(0, target.radius ?? 0);
                    const hitRadius = Number.isFinite(target.radius)
                        ? Math.max(visualRadius, target.radius!)
                        : visualRadius;
                    const radiusToUse = visual ? visualRadius : hitRadius;
                    return (
                        Math.hypot(target.point.x - query.pixel.x, target.point.y - query.pixel.y) <= radiusToUse + cartesianMarkerHitEpsilon
                    );
                },
                () => this.#onNodeVisited?.(),
                undefined,
                (nodeIndex, node) => this.resolveDegeneratePointerCandidate(nodeIndex, node, query, visual)
            );
            return index === null ? null : this.#materialize(index);
        };

        const visual = resolveClass(true);
        if (visual) {
            return [visual];
        }
        const forgiving = resolveClass(false);
        return forgiving ? [forgiving] : [];
    }

    public resolveNearest(query: CartesianDensePointerQuery): readonly SceneHitTarget[] {
        const u = this.pointerToU(query.pixel);
        const v = this.pointerToV(query.pixel);
        if (u === null || v === null) {
            return [];
        }

        const dimension = query.dimension ?? "xy";
        const targetCache = new Map<number, SceneHitTarget | null>();
        const materializeNearestTarget = (sourceIndex: number): SceneHitTarget | null => {
            if (!targetCache.has(sourceIndex)) {
                targetCache.set(sourceIndex, this.materializePointerCandidate(sourceIndex));
            }
            return targetCache.get(sourceIndex) ?? null;
        };
        const metric: SpatialDistanceMetric = {
            distanceToPoint: (idx: number) => {
                const target = materializeNearestTarget(idx);
                if (!target || !target.point) {
                    return Number.POSITIVE_INFINITY;
                }
                const dx = target.point.x - query.pixel.x;
                const dy = target.point.y - query.pixel.y;
                if (dimension === "x") {
                    return Math.abs(dx);
                }
                if (dimension === "y") {
                    return Math.abs(dy);
                }
                return dx * dx + dy * dy;
            },
            lowerBoundDistanceToNode: (bounds: readonly [number, number, number, number]) => {
                const u0 = bounds[0];
                const u1 = bounds[0] + bounds[2];
                const v0 = bounds[1];
                const v1 = bounds[1] + bounds[3];
                const pxA = this.uToPixel(u0);
                const pxB = this.uToPixel(u1);
                const pyA = this.vToPixel(v0);
                const pyB = this.vToPixel(v1);
                if (pxA === null || pxB === null || pyA === null || pyB === null) {
                    return 0;
                }
                const minPxX = Math.min(pxA, pxB);
                const maxPxX = Math.max(pxA, pxB);
                const minPxY = Math.min(pyA, pyB);
                const maxPxY = Math.max(pyA, pyB);

                const dx = Math.max(minPxX - query.pixel.x, 0, query.pixel.x - maxPxX);
                const dy = Math.max(minPxY - query.pixel.y, 0, query.pixel.y - maxPxY);

                if (dimension === "x") {
                    return dx;
                }
                if (dimension === "y") {
                    return dy;
                }
                return dx * dx + dy * dy;
            },
            secondaryDistanceToPoint: (idx: number) => {
                const target = materializeNearestTarget(idx);
                if (!target || !target.point) {
                    return Number.POSITIVE_INFINITY;
                }
                const dx = target.point.x - query.pixel.x;
                const dy = target.point.y - query.pixel.y;
                if (dimension === "x") {
                    return Math.abs(dy);
                }
                if (dimension === "y") {
                    return Math.abs(dx);
                }
                return 0;
            },
            compareEqualDistanceIndices: (candidateIndex: number, currentBestIndex: number) =>
                candidateIndex - currentBestIndex
        };

        const best = this.#hierarchy.resolveNearestNormalized(u, v, () => this.#onNodeVisited?.(), metric);
        if (!best) {
            return [];
        }
        const target = materializeNearestTarget(best.index);
        return target ? [target] : [];
    }

    private materializePointerCandidate(sourceIndex: number): SceneHitTarget | null {
        this.#onCandidateVisited?.();
        ChartDensityTracker.current?.onDenseRawHitCandidateVisited?.();
        ChartDensityTracker.current?.onDenseRawHitMaterialized?.();
        return this.#materialize(sourceIndex);
    }

    private resolveDegeneratePointerCandidate(
        nodeIndex: number,
        node: SpatialHierarchyNode,
        query: CartesianDensePointerQuery,
        visual: boolean
    ): number | null | undefined {
        if (this.#seriesType === "bubble" && this.#sizes && this.#bubbleRadiusScale) {
            const representative = this.materializePointerCandidate(node.topmostIndex);
            if (!representative?.point) {
                return undefined;
            }
            const centerDistance = Math.hypot(
                representative.point.x - query.pixel.x,
                representative.point.y - query.pixel.y
            );
            const requiredRadius = visual
                ? centerDistance
                : Math.max(0, centerDistance - cartesianBubbleMarkerHitPadding);
            const candidate = this.#hierarchy.findTopmostIndexInDegenerateLeafProjectedAtLeast(
                nodeIndex,
                requiredRadius,
                size => this.#bubbleRadiusScale!(size),
                cartesianMarkerHitEpsilon
            );
            if (candidate !== null) {
                const target = this.materializePointerCandidate(candidate);
                if (!target?.point) {
                    return undefined;
                }
                const radius = visual
                    ? Math.max(0, target.visualRadius ?? target.radius ?? 0)
                    : resolveCartesianBubbleHitRadius(target.visualRadius ?? target.radius ?? 0);
                return Math.hypot(target.point.x - query.pixel.x, target.point.y - query.pixel.y) <= radius + cartesianMarkerHitEpsilon
                    ? candidate
                    : undefined;
            }
            return null;
        }

        if (this.#seriesType === "scatter") {
            const target = this.materializePointerCandidate(node.topmostIndex);
            if (!target?.point) {
                return undefined;
            }
            const visualRadius = Math.max(0, target.visualRadius ?? target.radius ?? 0);
            const radius = visual ? visualRadius : Math.max(visualRadius, target.radius ?? visualRadius);
            return Math.hypot(target.point.x - query.pixel.x, target.point.y - query.pixel.y) <= radius + cartesianMarkerHitEpsilon
                ? node.topmostIndex
                : null;
        }

        return undefined;
    }

    private pointerToU(pixel: ChartPoint): number | null {
        const semantic = this.#xViewportScale.invert?.(pixel.x);
        if (semantic === undefined) {
            return null;
        }
        const normalized = this.#xBaseNormalize(semantic);
        return Number.isFinite(normalized) ? normalized : null;
    }

    private pointerToV(pixel: ChartPoint): number | null {
        const semantic = (this.#yViewportScale as ChartContinuousPositionScale<number>).invert?.(pixel.y);
        const normalized = semantic !== undefined ? this.#yBaseNormalize(semantic) : Number.NaN;
        return Number.isFinite(normalized) ? normalized : null;
    }

    private toNormalizedU(pixel: number): number | null {
        return this.pointerToU({ x: pixel, y: 0 });
    }

    private toNormalizedV(pixel: number): number | null {
        const semantic = (this.#yViewportScale as ChartContinuousPositionScale<number>).invert?.(pixel);
        if (semantic === undefined) {
            return null;
        }
        const normalized = this.#yBaseNormalize(semantic);
        return Number.isFinite(normalized) ? normalized : null;
    }

    private uToPixel(u: number): number | null {
        if (this.#xBaseDenormalize) {
            const semantic = this.#xBaseDenormalize(u);
            if (semantic !== undefined) {
                const px = this.#xViewportScale.map(semantic as never);
                return px !== undefined && Number.isFinite(px) ? px : null;
            }
        }
        return null;
    }

    private vToPixel(v: number): number | null {
        if (this.#yBaseDenormalize) {
            const semantic = this.#yBaseDenormalize(v);
            if (semantic !== undefined) {
                const py = (this.#yViewportScale as ChartContinuousPositionScale<number>).map(semantic as never);
                return py !== undefined && Number.isFinite(py) ? py : null;
            }
        }
        return null;
    }
}
