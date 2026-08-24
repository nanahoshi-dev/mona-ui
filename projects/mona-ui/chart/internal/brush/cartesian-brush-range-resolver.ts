import type {
    ChartBrushAxisRange,
    ChartBrushCategoryRange,
    ChartBrushContinuousRange,
    ChartBrushMode
} from "../../models/chart-brush.models";
import type { ChartRect } from "../../models/chart.models";
import type { CartesianAxisCoordinateSpace } from "../viewport/cartesian-axis-coordinate-space";
import type { ResolvedCartesianBrushTarget } from "./cartesian-brush-target-resolver";

export interface ResolvedBrushRanges {
    readonly xRange?: ChartBrushAxisRange;
    readonly yRange?: ChartBrushAxisRange;
}

export class CartesianBrushRangeResolver {
    public static resolve(
        bounds: ChartRect,
        coordinateSpace: CartesianAxisCoordinateSpace,
        targetOrMode: ResolvedCartesianBrushTarget | ChartBrushMode,
        targetXAxisId?: string,
        targetYAxisId?: string
    ): ResolvedBrushRanges {
        if (!coordinateSpace?.x || !coordinateSpace?.y || (bounds.width <= 0 && bounds.height <= 0)) {
            return {};
        }

        let mode: ChartBrushMode;
        let axisX: string | undefined;
        let axisY: string | undefined;
        let isValidX = true;
        let isValidY = true;

        if (typeof targetOrMode === "object") {
            mode = targetOrMode.mode;
            axisX = targetOrMode.xAxisId;
            axisY = targetOrMode.yAxisId;
            isValidX = targetOrMode.isValidX;
            isValidY = targetOrMode.isValidY;
        } else {
            mode = targetOrMode;
            axisX = targetXAxisId ?? coordinateSpace.x.keys().next().value;
            axisY = targetYAxisId ?? coordinateSpace.y.keys().next().value;
        }

        let xRange: ChartBrushAxisRange | undefined;
        let yRange: ChartBrushAxisRange | undefined;

        if ((mode === "x" || mode === "xy") && isValidX && axisX) {
            xRange = CartesianBrushRangeResolver.#resolveAxisRange(
                bounds.x,
                bounds.x + bounds.width,
                "x",
                axisX,
                coordinateSpace
            );
        }

        if ((mode === "y" || mode === "xy") && isValidY && axisY) {
            // In canvas coords, top is smaller Y, bottom is larger Y
            yRange = CartesianBrushRangeResolver.#resolveAxisRange(
                bounds.y + bounds.height,
                bounds.y,
                "y",
                axisY,
                coordinateSpace
            );
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
            const extent = coordinateSpace.resolveCategoryExtentAtPixels(ref, pixel1, pixel2);
            if (!extent) {
                return undefined;
            }

            const result: ChartBrushCategoryRange = {
                axis: ref.axis,
                axisId,
                fromIndex: extent.fromBaseIndex,
                fromValue: extent.fromValue,
                kind: "category",
                toIndex: extent.toBaseIndex,
                toValue: extent.toValue
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
        } else if (from instanceof Date && to instanceof Date && from.getTime() > to.getTime()) {
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
