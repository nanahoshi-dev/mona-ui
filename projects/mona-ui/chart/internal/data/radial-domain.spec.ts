import { describe, expect, it } from "vitest";
import { computeRadialDomain } from "./radial-domain";

describe("RadialDomain", () => {
    it("should compute default domain for empty values", () => {
        const result = computeRadialDomain([]);
        expect(result.domain[0]).toBeLessThanOrEqual(0);
        expect(result.domain[1]).toBeGreaterThan(0);
        expect(result.isZeroCrossed).toBe(false);
    });

    it("should include zero for positive-only values", () => {
        const result = computeRadialDomain([20, 50, 80], { nice: false });
        expect(result.domain[0]).toBe(0);
        expect(result.domain[1]).toBe(80);
        expect(result.isZeroCrossed).toBe(false);
    });

    it("should include zero for negative-only values", () => {
        const result = computeRadialDomain([-20, -50, -80], { nice: false });
        expect(result.domain[0]).toBe(-80);
        expect(result.domain[1]).toBe(0);
        expect(result.isZeroCrossed).toBe(false);
    });

    it("should mark zero crossed for signed mixed values", () => {
        const result = computeRadialDomain([-30, 20, 70], { nice: false });
        expect(result.domain[0]).toBe(-30);
        expect(result.domain[1]).toBe(70);
        expect(result.isZeroCrossed).toBe(true);
    });

    it("should honor explicit min and max", () => {
        const result = computeRadialDomain([10, 20, 30], {
            explicitMax: 100,
            explicitMin: 0,
            nice: false
        });
        expect(result.domain).toEqual([0, 100]);
    });

    it("should generate valid non-empty ticks", () => {
        const result = computeRadialDomain([0, 20, 40, 60, 80, 100], { tickCount: 5 });
        expect(result.ticks.length).toBeGreaterThan(0);
        expect(result.domain[0]).toBeLessThan(result.domain[1]);
    });
});
