import { curveLinear, curveMonotoneX, curveNatural, curveStep, curveStepAfter } from "d3-shape";
import { describe, expect, it } from "vitest";
import { resolveCurveFactory } from "./chart-curve-factory";

describe("resolveCurveFactory", () => {
    it.each([
        ["linear", curveLinear],
        ["monotone-x", curveMonotoneX],
        ["natural", curveNatural],
        ["step", curveStep],
        ["step-after", curveStepAfter]
    ] as const)("maps %s to the renderer curve factory", (curve, factory) => {
        expect(resolveCurveFactory(curve)).toBe(factory);
    });
});
