import type { ResolvedChartCartesianAxisType } from "./chart-scale";

export class CartesianScalePolicy {
    public static isScaleCompatibleWithSeries(seriesType: string, scaleType: ResolvedChartCartesianAxisType, dimension: "x" | "y"): boolean {
        // Value axis log restriction: Bar and Area do not support log due to zero baseline
        if (scaleType === "log") {
            if (dimension === "y" && (seriesType === "bar" || seriesType === "area")) {
                return false;
            }
            if (dimension === "x" && seriesType === "bar") {
                // For horizontal bars, X is value axis
                return false;
            }
        }
        return true;
    }

    public static normalizeExponent(e?: number): number {
        return Number.isFinite(e) && (e ?? 0) > 0 ? (e as number) : 1;
    }

    public static normalizeLogBase(base?: number): number {
        return Number.isFinite(base) && (base ?? 0) > 0 && base !== 1 ? (base as number) : 10;
    }

    public static normalizeSymlogConstant(c?: number): number {
        return Number.isFinite(c) && (c ?? 0) > 0 ? (c as number) : 1;
    }
}
