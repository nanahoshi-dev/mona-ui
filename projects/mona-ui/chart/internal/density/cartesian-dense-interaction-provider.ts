import type { ChartPoint } from "../../models/chart.models";
import type { ChartContinuousPositionScale } from "../scale/chart-scale";
import type { SceneHitTarget } from "../scene/scene-geometry";
import type { CartesianScalarDensityData } from "./cartesian-density-preparer";
import { lowerBoundAscending, lowerBoundDescending } from "./cartesian-minmax-block-index";
import { ChartDensityTracker } from "../layout/chart-density-instrumentation";

export interface CartesianDensePointerQuery {
    readonly pixel: ChartPoint;
}

/**
 * Exact raw interaction layer for dense series (§61).
 * Resolves real source datums independently of rendered samples.
 */
export interface CartesianDenseInteractionProvider {
    queryRange(query: CartesianDensePointerQuery & { readonly pixelB: ChartPoint }): readonly SceneHitTarget[];
    resolveNearest(query: CartesianDensePointerQuery): readonly SceneHitTarget[];
}

/**
 * Nearest-raw-X resolution for monotonic connected paths (§63):
 * binary search the semantic pointer X, inspect duplicate/neighbor candidates,
 * and choose the geometrically closest compatible raw datum.
 * Complexity is O(log N + small local candidate set).
 *
 * The provider is immutable for one committed projection: it references the
 * structural typed arrays plus that projection's frozen viewport scales (§66/§223).
 */
export class CartesianConnectedPathInteractionProvider implements CartesianDenseInteractionProvider {
    readonly #materialize: (sourceIndex: number) => SceneHitTarget | null;
    readonly #maxNeighbors: number;
    readonly #scalar: CartesianScalarDensityData;
    readonly #xScale: ChartContinuousPositionScale<number | Date>;
    readonly #yScale: ChartContinuousPositionScale<number | Date>;

    public constructor(input: {
        readonly maxNeighbors?: number;
        readonly materialize: (sourceIndex: number) => SceneHitTarget | null;
        readonly scalar: CartesianScalarDensityData;
        readonly xScale: ChartContinuousPositionScale<number | Date>;
        readonly yScale: ChartContinuousPositionScale<number | Date>;
    }) {
        this.#scalar = input.scalar;
        this.#materialize = input.materialize;
        this.#xScale = input.xScale;
        this.#yScale = input.yScale;
        this.#maxNeighbors = Math.max(2, input.maxNeighbors ?? 6);
    }

    public queryRange(_query: CartesianDensePointerQuery & { readonly pixelB: ChartPoint }): readonly SceneHitTarget[] {
        // Dense brush range queries aggregate separately (WP10); not part of pointer flow.
        return [];
    }

    public resolveNearest(query: CartesianDensePointerQuery): readonly SceneHitTarget[] {
        const scalar = this.#scalar;
        const n = scalar.sourceData.length;
        if (n === 0 || scalar.monotonicity === "unsorted") {
            return [];
        }

        const semanticX = this.toSemanticX(query.pixel.x);
        if (semanticX === null) {
            return [];
        }

        const ascending = scalar.monotonicity === "ascending" || scalar.monotonicity === "non-decreasing";
        const insertion = ascending
            ? lowerBoundAscending(scalar.x, 0, n, semanticX)
            : lowerBoundDescending(scalar.x, 0, n, semanticX);

        // Candidate window around the insertion point covering duplicates and neighbors.
        const start = Math.max(0, insertion - this.#maxNeighbors);
        const end = Math.min(n, insertion + this.#maxNeighbors);

        // Compare projected geometry so mixed semantic units cannot skew the decision.
        let bestIdx = -1;
        let bestDistanceSq = Number.POSITIVE_INFINITY;
        for (let i = start; i < end; i++) {
            if (!Number.isFinite(scalar.y[i])) {
                continue;
            }
            const px = this.#xScale.map(this.toPublicX(scalar.x[i]));
            const py = this.#yScale.map(scalar.y[i]);
            if (px === undefined || py === undefined || !Number.isFinite(px) || !Number.isFinite(py)) {
                continue;
            }
            const dx = px - query.pixel.x;
            const dy = py - query.pixel.y;
            const distanceSq = dx * dx + dy * dy;
            if (distanceSq < bestDistanceSq || (distanceSq === bestDistanceSq && i < bestIdx)) {
                bestDistanceSq = distanceSq;
                bestIdx = i;
            }
        }

        if (bestIdx < 0) {
            return [];
        }

        ChartDensityTracker.current?.onDenseRawHitMaterialized?.();
        const target = this.#materialize(bestIdx);
        return target ? [target] : [];
    }

    private toSemanticX(pixel: number): number | null {
        const value = this.#xScale.invert?.(pixel);
        if (value === undefined) {
            return null;
        }
        const num = value instanceof Date ? value.getTime() : Number(value);
        return Number.isFinite(num) ? num : null;
    }

    private toPublicX(epochOrNumber: number): number | Date {
        // Temporal axes map Date instances; numeric axes map raw numbers.
        const probe = this.#xScale.invert?.(0);
        return probe instanceof Date ? new Date(epochOrNumber) : epochOrNumber;
    }
}
