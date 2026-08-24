import { curveLinear, curveMonotoneX, curveNatural, curveStep, curveStepAfter, type CurveFactory } from "d3-shape";
import type { ChartCurve } from "../../../models/chart-series.models";

export function resolveCurveFactory(curve: ChartCurve): CurveFactory {
    switch (curve) {
        case "monotone-x":
            return curveMonotoneX;
        case "natural":
            return curveNatural;
        case "step":
            return curveStep;
        case "step-after":
            return curveStepAfter;
        case "linear":
        default:
            return curveLinear;
    }
}
