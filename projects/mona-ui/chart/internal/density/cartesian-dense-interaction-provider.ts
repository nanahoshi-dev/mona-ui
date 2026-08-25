import type { ChartPoint } from "../../models/chart.models";
import type { ChartContinuousPositionScale } from "../scale/chart-scale";
import type { SceneHitTarget } from "../scene/scene-geometry";
import type { CartesianScalarDensityData } from "./cartesian-density-preparer";
import {
    lowerBoundAscending,
    lowerBoundDescending,
    upperBoundAscending,
    upperBoundDescending
} from "./cartesian-minmax-block-index";
import { ChartDensityTracker } from "../layout/chart-density-instrumentation";
import { normalizeSemanticNumericKey, resolveSemanticNumericRun } from "./cartesian-semantic-key";

export type CartesianDenseNearestDimension = "x" | "y" | "xy";

export interface CartesianDensePointerQuery {
    readonly dimension?: CartesianDenseNearestDimension;
    readonly pixel: ChartPoint;
    readonly xAxisId?: string;
    readonly yAxisId?: string;
}

export interface CartesianDenseRangeQuery {
    readonly hitPolicy?: string;
    readonly pixelA: ChartPoint;
    readonly pixelB: ChartPoint;
}

export interface CartesianDenseMarkIdentityQuery {
    readonly occurrenceRank: number;
    readonly partType: "b" | "d" | "i" | "n" | "s";
    readonly seriesPrefix: string;
    readonly value: boolean | number | string;
}

export interface CartesianDenseSemanticBucketQuery {
    readonly axis: "x" | "y";
    readonly axisId?: string;
    readonly key: unknown;
}

import { DensePointGeometryIndex } from "./cartesian-dense-geometry-index";
import { resolveMarkKeyPart } from "../animation/animation-identity";

export class DenseMarkIdentityIndex {
    readonly #entries = new Map<string, number[]>();

    public constructor(
        sourceCountOrData: number | readonly unknown[],
        resolveKey: (
            datumOrIndex: unknown,
            index: number
        ) => { type: "b" | "d" | "i" | "n" | "s"; value: boolean | number | string } | null,
        resolveSourceIndex?: (index: number) => number
    ) {
        const count = typeof sourceCountOrData === "number" ? sourceCountOrData : sourceCountOrData.length;
        for (let i = 0; i < count; i++) {
            const datum = typeof sourceCountOrData === "number" ? i : sourceCountOrData[i];
            if (datum === undefined) continue;
            const res = resolveKey(datum, i) ?? { type: "i", value: i };
            const k = `${res.type}:${res.value}`;
            let list = this.#entries.get(k);
            if (!list) {
                list = [];
                this.#entries.set(k, list);
            }
            const srcIdx = resolveSourceIndex ? resolveSourceIndex(i) : i;
            list.push(srcIdx);
        }
    }

    public locate(query: CartesianDenseMarkIdentityQuery): number | null {
        if (query.partType === "i") {
            const idx = Number(query.value);
            return Number.isInteger(idx) && idx >= 0 ? idx : null;
        }
        const k = `${query.partType}:${query.value}`;
        const list = this.#entries.get(k);
        if (!list || query.occurrenceRank >= list.length) {
            return null;
        }
        return list[query.occurrenceRank];
    }
}

/**
 * Exact raw interaction layer for dense series (§61).
 * Resolves real source datums independently of rendered samples.
 */
export interface CartesianDenseInteractionProvider {
    /** Locates the raw source index behind a full-layout mark ID (lazy reverse lookup, §73 / SD3-R11). */
    locateMarkIdentity?(query: CartesianDenseMarkIdentityQuery): number | null;
    materializeAt(sourceIndex: number): SceneHitTarget | null;
    queryRange(query: CartesianDenseRangeQuery): readonly SceneHitTarget[];
    resolveNearest(query: CartesianDensePointerQuery): readonly SceneHitTarget[];
    /** Visual/hit-radius candidates for pointer containment, when supported. */
    resolvePointerCandidates?(query: CartesianDensePointerQuery): readonly SceneHitTarget[];
    resolveSemanticBucket?(query: CartesianDenseSemanticBucketQuery): readonly SceneHitTarget[];
    readonly seriesId?: string;
    readonly xAxisId?: string;
    readonly yAxisId?: string;
}

import type { ChartSeriesMarkIdentityAuthority } from "../animation/chart-series-mark-identity-authority";

/**
 * Nearest-raw resolution for monotonic connected paths (SD4-R06, SD4-R09):
 * uses exact branch-and-bound geometry index for X, Y, and XY queries.
 */
export class CartesianConnectedPathInteractionProvider implements CartesianDenseInteractionProvider {
    readonly #identity?: ChartSeriesMarkIdentityAuthority;
    readonly #materialize: (sourceIndex: number) => SceneHitTarget | null;
    readonly #scalar: CartesianScalarDensityData;
    readonly #xScale: ChartContinuousPositionScale<number | Date>;
    readonly #yScale: ChartContinuousPositionScale<number | Date>;
    #geometryIndex: DensePointGeometryIndex | null = null;
    #identityIndex: DenseMarkIdentityIndex | null = null;
    public readonly seriesId?: string;
    public readonly xAxisId?: string;
    public readonly yAxisId?: string;
    public constructor(input: {
        readonly identity?: ChartSeriesMarkIdentityAuthority;
        readonly materialize: (sourceIndex: number) => SceneHitTarget | null;
        readonly scalar: CartesianScalarDensityData;
        readonly seriesId?: string;
        readonly xAxisId?: string;
        readonly xScale: ChartContinuousPositionScale<number | Date>;
        readonly yAxisId?: string;
        readonly yScale: ChartContinuousPositionScale<number | Date>;
    }) {
        this.#identity = input.identity;
        this.#scalar = input.scalar;
        this.#materialize = input.materialize;
        this.#xScale = input.xScale;
        this.#yScale = input.yScale;
        this.seriesId = input.seriesId;
        this.xAxisId = input.xAxisId;
        this.yAxisId = input.yAxisId;
    }

    #resolveSourcePoint(sourceIndex: number): ChartPoint | null {
        const x = this.#xScale.map(this.#scalar.x[sourceIndex]);
        const y = this.#yScale.map(this.#scalar.y[sourceIndex]);
        return x !== undefined && y !== undefined && Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
    }

    public locateMarkIdentity(query: CartesianDenseMarkIdentityQuery): number | null {
        if (this.#identity) {
            return this.#identity.locate(query);
        }
        if (!this.#identityIndex) {
            this.#identityIndex = new DenseMarkIdentityIndex(
                this.#scalar.sourceData.length,
                (_d, i) => resolveMarkKeyPart(this.#scalar.sourceData[i], undefined, this.#scalar.x[i], i).part
            );
        }
        return this.#identityIndex.locate(query);
    }

    /**
     * Locates raw indices whose X equals the semantic value exactly,
     * including duplicates in source order (lazy reverse identity lookup).
     */
    public locateRawIndex(semanticX: number): { readonly candidateIndices: readonly number[] } | null {
        const scalar = this.#scalar;
        const n = scalar.sourceData.length;
        if (n === 0) {
            return null;
        }
        if (scalar.monotonicity === "unsorted" || scalar.monotonicity === "unsearchable") {
            ChartDensityTracker.current?.onBinaryXFallback?.();
            if (scalar.monotonicity === "unsearchable") {
                ChartDensityTracker.current?.onUnsearchableXFallback?.();
            }
            return null;
        }
        ChartDensityTracker.current?.onBinaryXQuery?.();
        const match = resolveSemanticNumericRun(scalar.x, scalar.monotonicity, semanticX);
        if (!match) {
            return null;
        }
        const candidates: number[] = [];
        for (let i = match.startIndex; i < match.endIndexExclusive; i++) {
            if (Number.isFinite(scalar.y[i])) {
                candidates.push(i);
            }
        }
        return { candidateIndices: candidates };
    }

    public materializeAt(sourceIndex: number): SceneHitTarget | null {
        return this.#materialize(sourceIndex);
    }

    /**
     * Exact brush range query (§68/§221): brush pixel rectangle → semantic
     * ranges → compact raw scan → exact matching source indices → lazily
     * materialized hit targets. Explicitly requested exact results may be O(M).
     */
    public queryRange(query: CartesianDenseRangeQuery): readonly SceneHitTarget[] {
        const scalar = this.#scalar;
        const n = scalar.sourceData.length;
        const minPxX = Math.min(query.pixelA.x, query.pixelB.x);
        const maxPxX = Math.max(query.pixelA.x, query.pixelB.x);
        const minPxY = Math.min(query.pixelA.y, query.pixelB.y);
        const maxPxY = Math.max(query.pixelA.y, query.pixelB.y);
        if (n === 0 || scalar.monotonicity === "unsorted" || scalar.monotonicity === "unsearchable") {
            if (scalar.monotonicity === "unsorted" || scalar.monotonicity === "unsearchable") {
                ChartDensityTracker.current?.onBinaryXFallback?.();
            }
            if (scalar.monotonicity === "unsearchable") {
                ChartDensityTracker.current?.onUnsearchableXFallback?.();
            }
            return [];
        }

        const xA = this.toSemanticX(Math.min(query.pixelA.x, query.pixelB.x));
        const xB = this.toSemanticX(Math.max(query.pixelA.x, query.pixelB.x));
        if (xA === null || xB === null || xB < xA) {
            return [];
        }
        ChartDensityTracker.current?.onBinaryXQuery?.();
        const ascending = scalar.monotonicity === "ascending" || scalar.monotonicity === "non-decreasing";
        let startIdx: number;
        let endIdx: number;
        if (ascending) {
            startIdx = lowerBoundAscending(scalar.x, 0, n, xA);
            endIdx = upperBoundAscending(scalar.x, 0, n, xB);
        } else {
            startIdx = lowerBoundDescending(scalar.x, 0, n, xB);
            endIdx = upperBoundDescending(scalar.x, 0, n, xA);
        }
        // Include one source neighbor at each semantic boundary to cover a
        // pixel-to-semantic inversion landing on the adjacent representable
        // value. Final current-pixel geometry remains authoritative.
        startIdx = Math.max(0, startIdx - 1);
        endIdx = Math.min(n, endIdx + 1);
        if (endIdx <= startIdx) {
            return [];
        }

        const hasYRange = maxPxY > minPxY;

        const matches: SceneHitTarget[] = [];
        for (let i = startIdx; i < endIdx; i++) {
            ChartDensityTracker.current?.onDenseRawHitCandidateVisited?.();
            if (!Number.isFinite(scalar.y[i])) {
                continue;
            }
            if (hasYRange) {
                const yPixel = this.#yScale.map(scalar.y[i]);
                if (
                    yPixel === undefined ||
                    !Number.isFinite(yPixel) ||
                    yPixel < minPxY - 1e-9 ||
                    yPixel > maxPxY + 1e-9
                ) {
                    continue;
                }
            }
            ChartDensityTracker.current?.onDenseRawHitMaterialized?.();
            const target = this.#materialize(i);
            if (!target) {
                continue;
            }

            const point = target.point ?? this.#resolveSourcePoint(i);
            if (!point) {
                continue;
            }
            const insidePixelRect =
                point.x >= minPxX - 1e-9 &&
                point.x <= maxPxX + 1e-9 &&
                point.y >= minPxY - 1e-9 &&
                point.y <= maxPxY + 1e-9;
            if (insidePixelRect) {
                matches.push(target);
            }
        }
        return matches;
    }

    public resolveNearest(query: CartesianDensePointerQuery): readonly SceneHitTarget[] {
        const scalar = this.#scalar;
        const n = scalar.sourceData.length;
        if (n === 0) {
            return [];
        }
        if (scalar.monotonicity === "unsorted" || scalar.monotonicity === "unsearchable") {
            ChartDensityTracker.current?.onBinaryXFallback?.();
            if (scalar.monotonicity === "unsearchable") {
                ChartDensityTracker.current?.onUnsearchableXFallback?.();
            }
            return [];
        }

        if (!this.#geometryIndex) {
            this.#geometryIndex =
                this.#scalar.pointGeometryIndex ??
                new DensePointGeometryIndex({
                    count: n,
                    getX: i => scalar.x[i],
                    getY: i => scalar.y[i],
                    isValid: i => Number.isFinite(scalar.x[i]) && Number.isFinite(scalar.y[i])
                });
        }

        const dimension = query.dimension ?? "xy";
        const bestIdx = this.#geometryIndex.resolveNearest({
            dimension,
            mapX: x => {
                const px = this.#xScale.map(this.toPublicX(x));
                return px !== undefined && Number.isFinite(px) ? px : undefined;
            },
            mapY: y => {
                const py = this.#yScale.map(y);
                return py !== undefined && Number.isFinite(py) ? py : undefined;
            },
            pixel: query.pixel
        });

        if (bestIdx === null || bestIdx < 0) {
            return [];
        }

        ChartDensityTracker.current?.onDenseRawHitMaterialized?.();
        const target = this.#materialize(bestIdx);
        return target ? [target] : [];
    }

    public resolveSemanticBucket(query: CartesianDenseSemanticBucketQuery): readonly SceneHitTarget[] {
        if (query.axis !== "x") {
            return [];
        }
        if (query.axisId && this.xAxisId && query.axisId !== this.xAxisId) {
            return [];
        }
        const scalar = this.#scalar;
        const n = scalar.sourceData.length;
        if (n === 0 || scalar.monotonicity === "unsorted" || scalar.monotonicity === "unsearchable") {
            if (scalar.monotonicity === "unsorted" || scalar.monotonicity === "unsearchable") {
                ChartDensityTracker.current?.onBinaryXFallback?.();
            }
            if (scalar.monotonicity === "unsearchable") {
                ChartDensityTracker.current?.onUnsearchableXFallback?.();
            }
            return [];
        }
        ChartDensityTracker.current?.onBinaryXQuery?.();
        const semanticX = normalizeSemanticNumericKey(query.key);
        if (semanticX === null) {
            return [];
        }
        const match = resolveSemanticNumericRun(scalar.x, scalar.monotonicity, semanticX);
        if (!match) {
            return [];
        }
        const matches: SceneHitTarget[] = [];
        for (let i = match.startIndex; i < match.endIndexExclusive; i++) {
            if (Number.isFinite(scalar.y[i])) {
                ChartDensityTracker.current?.onDenseRawHitMaterialized?.();
                const target = this.#materialize(i);
                if (target) {
                    matches.push(target);
                }
            }
        }
        return matches;
    }

    private toPublicX(epochOrNumber: number): number | Date {
        // Temporal axes map Date instances; numeric axes map raw numbers.
        const probe = this.#xScale.invert?.(0);
        return probe instanceof Date ? new Date(epochOrNumber) : epochOrNumber;
    }

    private toSemanticX(pixel: number): number | null {
        const value = this.#xScale.invert?.(pixel);
        if (value === undefined) {
            return null;
        }
        const num = value instanceof Date ? value.getTime() : Number(value);
        return Number.isFinite(num) ? num : null;
    }
}
