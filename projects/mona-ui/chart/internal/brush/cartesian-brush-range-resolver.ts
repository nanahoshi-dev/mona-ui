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
        xAxisId?: string,
        yAxisId?: string
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
            const effectiveXAxisId = xAxisId ?? coordinateSpace.x.keys().next().value;
            if (effectiveXAxisId) {
                xRange = CartesianBrushRangeResolver.#resolveAxisRange(
                    bounds.x,
                    bounds.x + bounds.width,
                    "x",
                    effectiveXAxisId,
                    coordinateSpace
                );
            }
        }

        if (mode === "y" || mode === "xy") {
            const effectiveYAxisId = yAxisId ?? coordinateSpace.y.keys().next().value;
            if (effectiveYAxisId) {
                // In canvas coords, top is smaller Y, bottom is larger Y
                yRange = CartesianBrushRangeResolver.#resolveAxisRange(
                    bounds.y + bounds.height,
                    bounds.y,
                    "y",
                    effectiveYAxisId,
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
            const catFrom = coordinateSpace.resolveCategoryAtPixel(ref, minPx);
            const catTo = coordinateSpace.resolveCategoryAtPixel(ref, maxPx);

            if (!catFrom && !catTo) {
                return undefined;
            }

            const fromIdx = Math.min(catFrom?.baseIndex ?? 0, catTo?.baseIndex ?? 0);
            const toIdx = Math.max(catFrom?.baseIndex ?? 0, catTo?.baseIndex ?? 0);

            const result: ChartBrushCategoryRange = {
                axis: ref.axis,
                axisId,
                fromIndex: fromIdx,
                fromValue: catFrom?.key,
                kind: "category",
                toIndex: toIdx,
                toValue: catTo?.key
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

        const continuousResult: ChartBrushContinuousRange = {
            axis: ref.axis,
            axisId,
            from: from!,
            kind: "continuous",
            scaleType: res1?.resolvedType ?? "linear",
            to: to!
        };
        return continuousResult;
    }
}
