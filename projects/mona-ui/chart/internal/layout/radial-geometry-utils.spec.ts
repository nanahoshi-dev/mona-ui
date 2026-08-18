import { describe, expect, it } from "vitest";
import {
    computeOuterRadiusWithStroke,
    computeRadialRingBands,
    normalizeGaugeGeometry,
    normalizeRosePadding
} from "./radial-geometry-utils";

describe("radial-geometry-utils", () => {
    describe("computeRadialRingBands", () => {
        it("computes automatic thickness evenly for multiple rings", () => {
            const result = computeRadialRingBands(20, 100, 4, 4);
            expect(result.bands).toHaveLength(4);
            expect(result.gap).toBe(4);
            // availableBand = 80, gaps total = 3 * 4 = 12, remaining = 68, thickness = 17
            expect(result.thickness).toBe(17);
            expect(result.bands[0].outerRadius).toBe(100);
            expect(result.bands[0].innerRadius).toBe(83);
            expect(result.bands[3].outerRadius).toBe(37);
            expect(result.bands[3].innerRadius).toBe(20);
        });

        it("reduces gap when gap total exceeds available band", () => {
            // availableBand = 10, N = 4, requestedGap = 10 -> total gap 30 > 10
            const result = computeRadialRingBands(0, 10, 4, 10);
            expect(result.bands).toHaveLength(4);
            expect(result.gap).toBeCloseTo(10 / 3);
            expect(result.thickness).toBe(0);
        });

        it("centers explicit thickness bands inside available band", () => {
            // availableBand = 100, N = 2, gap = 10, explicitThickness = 20 -> usedBand = 50, offset = 25
            const result = computeRadialRingBands(0, 100, 2, 10, 20);
            expect(result.thickness).toBe(20);
            expect(result.bands[0].outerRadius).toBe(75); // 100 - 25
            expect(result.bands[0].innerRadius).toBe(55);
            expect(result.bands[1].outerRadius).toBe(45); // 55 - 10
            expect(result.bands[1].innerRadius).toBe(25);
        });

        it("handles NaN and non-finite inputs gracefully", () => {
            const result = computeRadialRingBands(NaN, NaN, 3, NaN, NaN);
            expect(result.bands).toHaveLength(0);
        });
    });

    describe("normalizeRosePadding", () => {
        it("caps padAngle to 0.35 of slot span", () => {
            const slotSpan = Math.PI / 2; // 90 deg = 1.57079 rad
            const padDeg = 45; // 45 deg = 0.785 rad > 0.35 * slotSpan (~0.55 rad)
            const result = normalizeRosePadding(padDeg, slotSpan, 4);
            expect(result).toBeCloseTo(slotSpan * 0.35);
        });

        it("returns 0 padding for single category", () => {
            expect(normalizeRosePadding(10, Math.PI * 2, 1)).toBe(0);
        });

        it("handles NaN and negative padding", () => {
            expect(normalizeRosePadding(NaN, Math.PI / 2, 4)).toBe(0);
            expect(normalizeRosePadding(-10, Math.PI / 2, 4)).toBe(0);
        });
    });

    describe("computeOuterRadiusWithStroke", () => {
        it("reserves half stroke width from available outer radius", () => {
            const outer = computeOuterRadiusWithStroke(100, 1.0, 4);
            expect(outer).toBe(98); // 100 - 2
        });

        it("handles NaN and negative values gracefully", () => {
            const outer = computeOuterRadiusWithStroke(NaN, NaN, NaN);
            expect(Number.isFinite(outer)).toBe(true);
            expect(outer).toBeGreaterThanOrEqual(0);
        });
    });

    describe("normalizeGaugeGeometry", () => {
        it("normalizes all properties to finite numbers within valid ranges", () => {
            const geom = normalizeGaugeGeometry({
                containerHeight: 200,
                containerWidth: 200,
                cornerRadius: 10,
                endAngle: 270,
                hubRadius: 6,
                innerRadiusRatio: 0.7,
                needleLengthRatio: 0.9,
                needleWidth: 3,
                outerRadiusRatio: 0.9,
                startAngle: -90
            });

            expect(geom.outerRadius).toBe(90);
            expect(geom.innerRadius).toBeCloseTo(63);
            expect(geom.cornerRadius).toBeLessThanOrEqual((90 - 63) / 2);
            expect(geom.needleLength).toBeCloseTo(90 * 0.9);
            expect(geom.needleWidth).toBe(3);
            expect(geom.hubRadius).toBe(6);
        });

        it("handles all NaN and Infinity inputs gracefully without producing NaN", () => {
            const geom = normalizeGaugeGeometry({
                containerHeight: NaN,
                containerWidth: NaN,
                cornerRadius: NaN,
                endAngle: NaN,
                hubRadius: NaN,
                innerRadiusRatio: NaN,
                needleLengthRatio: NaN,
                needleWidth: NaN,
                outerRadiusRatio: NaN,
                startAngle: NaN
            });

            for (const [key, val] of Object.entries(geom)) {
                expect(Number.isFinite(val), `Field ${key} should be finite`).toBe(true);
            }
        });
    });
});
