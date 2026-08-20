import type {
    ChartBrushAxisRange,
    ChartBrushCategoryRange,
    ChartBrushContinuousRange,
    ChartBrushMode
} from "../../models/chart-brush.models";
import type { ChartRect } from "../../models/chart.models";
import type { CartesianAxisCoordinateSpace } from "../viewport/cartesian-axis-coordinate-space";

export interface ResolvedBrushRanges {
    readonly xRange?: ChartBrushAxisRange;
    readonly yRange?: ChartBrushAxisRange;
}

export class CartesianBrushRangeResolver {
    public static resolve(
        bounds: ChartRect,
        coordinateSpace: CartesianAxisCoordinateSpace,
        mode: ChartBrushMode,
        targetXAxisId?: string,
        targetYAxisId?: string
    ): ResolvedBrushRanges {
        if (
            !coordinateSpace?.x ||
            !coordinateSpace?.y ||
            (bounds.width <= 0 && bounds.height <= 0)
        ) {
            return {};
        }

        let xRange: ChartBrushAxisRange | undefined;
        let yRange: ChartBrushAxisRange | undefined;

        if (mode === "x" || mode === "xy") {
            const axisId = targetXAxisId ?? coordinateSpace.x.keys().next().value;
            if (axisId) {
                xRange = CartesianBrushRangeResolver.#resolveAxisRange(
                    bounds.x,
                    bounds.x + bounds.width,
                    "x",
                    axisId,
                    coordinateSpace
                );
            }
        }

        if (mode === "y" || mode === "xy") {
            const axisId = targetYAxisId ?? coordinateSpace.y.keys().next().value;
            if (axisId) {
                // In canvas coords, top is smaller Y, bottom is larger Y
                yRange = CartesianBrushRangeResolver.#resolveAxisRange(
                    bounds.y + bounds.height,
                    bounds.y,
                    "y",
                    axisId,
                    coordinateSpace
                );
            }
        }

        return { xRange, yRange };
    }

    static #resolveAxisRange(
        pixel1: number,
        pixel2: number,
        axis: "x" | "y",
        axisId: string,
        coordinateSpace: CartesianAxisCoordinateSpace
    ): ChartBrushAxisRange | undefined {
        const snap = axis === "x" ? coordinateSpace.x.get(axisId) : coordinateSpace.y.get(axisId);
        if (!snap || snap.valid === false) {
            return undefined;
        }

        const ref = { axis, axisId };

        if (snap.resolvedType === "category") {
            const minPx = Math.min(pixel1, pixel2);
            const maxPx = Math.max(pixel1, pixel2);

            const categoryIndex = snap.categoryIndex;
            if (!categoryIndex || !categoryIndex.viewportDomain) {
                return undefined;
            }

            const intersected: Array<{ baseIndex: number; key: string }> = [];

            for (const key of categoryIndex.viewportDomain) {
                const geom = categoryIndex.byKey.get(key);
                if (!geom) {
                    continue;
                }

                const bStart = Math.min(geom.bandStart, geom.bandEnd);
                const bEnd = Math.max(geom.bandStart, geom.bandEnd);

                // Check actual band intersection (inclusive)
                if (bStart <= maxPx && bEnd >= minPx) {
                    intersected.push({
                        baseIndex: geom.baseIndex,
                        key: geom.key
                    });
                }
            }

            if (intersected.length === 0) {
                return undefined;
            }

            const firstIntersected = intersected[0];
            const lastIntersected = intersected[intersected.length - 1];

            const fromIndex = Math.min(firstIntersected.baseIndex, lastIntersected.baseIndex);
            const toIndex = Math.max(firstIntersected.baseIndex, lastIntersected.baseIndex);

            const fromValue = snap.baseDomain[fromIndex] ?? firstIntersected.key;
            const toValue = snap.baseDomain[toIndex] ?? lastIntersected.key;

            const result: ChartBrushCategoryRange = {
                axis: ref.axis,
                axisId,
                fromIndex,
                fromValue,
                kind: "category",
                toIndex,
                toValue
            };
            return result;
        }

        // Continuous axis
        const res1 = coordinateSpace.resolveContinuousAtPixel(ref, pixel1);
        const res2 = coordinateSpace.resolveContinuousAtPixel(ref, pixel2);

        let from = res1?.value;
        let to = res2?.value;

        if (from === undefined && to === undefined) {
            return undefined;
        }

        if (from === undefined) from = to;
        if (to === undefined) to = from;

        if (typeof from === "number" && typeof to === "number" && from > to) {
            const temp = from;
            from = to;
            to = temp;
        } else if (
            from instanceof Date &&
            to instanceof Date &&
            from.getTime() > to.getTime()
        ) {
            const temp = from;
            from = to;
            to = temp;
        }

        const scaleType =
            res1?.resolvedType ??
            res2?.resolvedType ??
            (snap.resolvedType as ChartBrushContinuousRange["scaleType"]) ??
            "linear";

        const continuousResult: ChartBrushContinuousRange = {
            axis: ref.axis,
            axisId,
            from: from!,
            kind: "continuous",
            scaleType,
            to: to!
        };
        return continuousResult;
    }
}
