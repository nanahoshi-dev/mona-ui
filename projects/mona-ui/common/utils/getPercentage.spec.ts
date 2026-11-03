import { describe, expect, it } from "vitest";
import { getPercentage } from "./getPercentage";

describe("getPercentage", () => {
    it("returns the clamped, rounded percentage", () => {
        expect(getPercentage(5, 0, 10)).toBe(50);
        expect(getPercentage(1, 0, 3)).toBe(33.33);
        expect(getPercentage(1, 0, 3, 0)).toBe(33);
        expect(getPercentage(20, 0, 10)).toBe(100);
        expect(getPercentage(-5, 0, 10)).toBe(0);
    });

    it("returns 0 for an empty or non-finite range or value", () => {
        expect(getPercentage(5, 10, 10)).toBe(0);
        expect(getPercentage(5, NaN, 10)).toBe(0);
        expect(getPercentage(5, 0, Infinity)).toBe(0);
        expect(getPercentage(NaN, 0, 10)).toBe(0);
    });

    it("clamps the precision instead of throwing", () => {
        expect(getPercentage(1, 0, 3, 101)).toBeCloseTo(33.333);
        expect(getPercentage(1, 0, 3, -1)).toBe(33);
    });
});
