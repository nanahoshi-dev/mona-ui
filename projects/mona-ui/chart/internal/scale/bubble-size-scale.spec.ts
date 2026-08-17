import { describe, expect, it } from "vitest";
import { createBubbleRadiusScale, normalizeBubbleRadiusRange } from "./bubble-size-scale";

describe("Bubble Size Scale", () => {
    it("should map square magnitudes proportionally using sqrt scale", () => {
        const scale = createBubbleRadiusScale([1, 9], [10, 30]);

        const r1 = scale(1);
        const r4 = scale(4);
        const r9 = scale(9);

        expect(r1).toBe(10);
        expect(r9).toBe(30);
        // sqrt(4) is 2, which is midway between sqrt(1)=1 and sqrt(9)=3
        // So radius should be exactly midway: (10 + 30) / 2 = 20
        expect(r4).toBe(20);
    });

    it("should return midpoint radius when domain values are equal", () => {
        const scale = createBubbleRadiusScale([50, 50], [4, 24]);
        expect(scale(50)).toBe(14);
    });

    it("should return 0 for non-positive or invalid sizes", () => {
        const scale = createBubbleRadiusScale([10, 100], [4, 24]);
        expect(scale(0)).toBe(0);
        expect(scale(-5)).toBe(0);
        expect(scale(NaN)).toBe(0);
        expect(scale(Infinity)).toBe(0);
    });

    it("should normalize reversed or out-of-range radius ranges", () => {
        const normalized = normalizeBubbleRadiusRange(30, 10);
        expect(normalized.minRadius).toBe(10);
        expect(normalized.maxRadius).toBe(30);

        const clamped = normalizeBubbleRadiusRange(-5, 500);
        expect(clamped.minRadius).toBe(1);
        expect(clamped.maxRadius).toBe(100);
    });
});
