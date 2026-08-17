import { describe, expect, it } from "vitest";
import { resolveFiniteRangeValues } from "./chart-range-resolver";

describe("chart-range-resolver", () => {
    it("should resolve finite positive endpoints", () => {
        const datum = { high: 28, low: 12 };
        const resolved = resolveFiniteRangeValues(datum, "low", "high", 0);
        expect(resolved).toEqual({
            fromValue: 12,
            highValue: 28,
            lowValue: 12,
            toValue: 28
        });
    });

    it("should resolve finite negative endpoints", () => {
        const datum = { from: -40, to: -15 };
        const resolved = resolveFiniteRangeValues(datum, "from", "to", 0);
        expect(resolved).toEqual({
            fromValue: -40,
            highValue: -15,
            lowValue: -40,
            toValue: -15
        });
    });

    it("should resolve mixed-sign endpoints", () => {
        const datum = { from: -10, to: 20 };
        const resolved = resolveFiniteRangeValues(datum, "from", "to", 0);
        expect(resolved).toEqual({
            fromValue: -10,
            highValue: 20,
            lowValue: -10,
            toValue: 20
        });
    });

    it("should preserve source order when from > to (inverted range)", () => {
        const datum = { from: 30, to: 10 };
        const resolved = resolveFiniteRangeValues(datum, "from", "to", 0);
        expect(resolved).toEqual({
            fromValue: 30,
            highValue: 30,
            lowValue: 10,
            toValue: 10
        });
    });

    it("should resolve equal endpoints as valid zero-length range", () => {
        const datum = { from: 25, to: 25 };
        const resolved = resolveFiniteRangeValues(datum, "from", "to", 0);
        expect(resolved).toEqual({
            fromValue: 25,
            highValue: 25,
            lowValue: 25,
            toValue: 25
        });
    });

    it("should return null if from is NaN or non-finite", () => {
        expect(resolveFiniteRangeValues({ from: Number.NaN, to: 20 }, "from", "to", 0)).toBeNull();
        expect(resolveFiniteRangeValues({ from: Number.POSITIVE_INFINITY, to: 20 }, "from", "to", 0)).toBeNull();
        expect(resolveFiniteRangeValues({ from: null, to: 20 }, "from", "to", 0)).toBeNull();
        expect(resolveFiniteRangeValues({ from: undefined, to: 20 }, "from", "to", 0)).toBeNull();
    });

    it("should return null if to is NaN or non-finite", () => {
        expect(resolveFiniteRangeValues({ from: 10, to: Number.NaN }, "from", "to", 0)).toBeNull();
        expect(resolveFiniteRangeValues({ from: 10, to: Number.NEGATIVE_INFINITY }, "from", "to", 0)).toBeNull();
        expect(resolveFiniteRangeValues({ from: 10, to: "invalid" }, "from", "to", 0)).toBeNull();
    });

    it("should support accessor functions", () => {
        const datum = { values: [15, 45] };
        const resolved = resolveFiniteRangeValues(
            datum,
            (d: any) => d.values[0],
            (d: any) => d.values[1],
            0
        );
        expect(resolved).toEqual({
            fromValue: 15,
            highValue: 45,
            lowValue: 15,
            toValue: 45
        });
    });

    it("should not mutate source datum", () => {
        const datum = Object.freeze({ from: 10, to: 20 });
        const resolved = resolveFiniteRangeValues(datum, "from", "to", 0);
        expect(resolved).toBeDefined();
    });
});
