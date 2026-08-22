import type { ChartPoint } from "../../models/chart.models";
import type { ChartContinuousPositionScale } from "../scale/chart-scale";
import type { ChartPositionScale } from "../scale/chart-scale";
import type { SceneHitTarget } from "../scene/scene-geometry";
import type {
    CartesianDenseInteractionProvider,
    CartesianDensePointerQuery,
    CartesianDenseRangeQuery
} from "./cartesian-dense-interaction-provider";
import type { CartesianSpatialDensityIndex } from "./cartesian-spatial-density-index";
import { ChartDensityTracker } from "../layout/chart-density-instrumentation";

/**
 * Exact raw interaction for scatter/bubble via the normalized spatial
 * hierarchy: nearest-neighbor by increasing lower-bound distance (§64/§220)
 * and rectangular candidate discovery with exact final filtering (§221).
 */
export class CartesianMarkerSpatialInteractionProvider implements CartesianDenseInteractionProvider {
    readonly #hierarchy: CartesianSpatialDensityIndex;
    readonly #materialize: (sourceIndex: number) => SceneHitTarget | null;
    readonly #onNodeVisited?: () => void;
    readonly #xViewportScale: ChartContinuousPositionScale<number | Date>;
    readonly #yViewportScale: ChartPositionScale<unknown>;
    readonly #xBaseNormalize: (semanticValue: unknown) => number;
    readonly #yBaseNormalize: (semanticValue: unknown) => number;

    public constructor(input: {
        readonly hierarchy: CartesianSpatialDensityIndex;
        readonly materialize: (sourceIndex: number) => SceneHitTarget | null;
        readonly onNodeVisited?: () => void;
        readonly xBaseNormalize: (semanticValue: unknown) => number;
        readonly xViewportScale: ChartContinuousPositionScale<number | Date>;
        readonly yBaseNormalize: (semanticValue: unknown) => number;
        readonly yViewportScale: ChartPositionScale<unknown>;
    }) {
        this.#hierarchy = input.hierarchy;
        this.#materialize = input.materialize;
        this.#onNodeVisited = input.onNodeVisited;
        this.#xBaseNormalize = input.xBaseNormalize;
        this.#yBaseNormalize = input.yBaseNormalize;
        this.#xViewportScale = input.xViewportScale;
        this.#yViewportScale = input.yViewportScale;
    }

    public locateRawIndex(): null {
        // 2-D markers have no single-axis natural-key reverse mapping; controlled
        // selection overlay falls back gracefully (§73).
        return null;
    }

    public materializeAt(sourceIndex: number): SceneHitTarget | null {
        return sourceIndex >= 0 ? this.#materialize(sourceIndex) : null;
    }

    public queryRange(query: CartesianDenseRangeQuery): readonly SceneHitTarget[] {
        const uA = this.toNormalizedU(query.pixelA.x);
        const uB = this.toNormalizedU(query.pixelB.x);
        const vA = this.toNormalizedV(query.pixelA.y);
        const vB = this.toNormalizedV(query.pixelB.y);
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
            if (target) {
                matches.push(target);
            }
        });
        matches.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
        return matches;
    }

    public resolveNearest(query: CartesianDensePointerQuery): readonly SceneHitTarget[] {
        const u = this.pointerToU(query.pixel);
        const v = this.pointerToV(query.pixel);
        if (u === null || v === null) {
            return [];
        }
        const best = this.#hierarchy.resolveNearestNormalized(u, v, () =>
            this.#onNodeVisited?.()
        );
        if (!best) {
            return [];
        }
        ChartDensityTracker.current?.onDenseRawHitMaterialized?.();
        const target = this.#materialize(best.index);
        return target ? [target] : [];
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
}
