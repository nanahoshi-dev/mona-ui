import { describe, expect, it } from "vitest";
import { CartesianScaleFactory } from "./cartesian-scale-factory";

describe("CartesianScaleFactory", () => {
    describe("LinearScale", () => {
        it("should map domain values to range pixels linearly", () => {
            const scale = CartesianScaleFactory.createLinearScale([0, 100], [0, 500], false);
            expect(scale.map(0)).toBe(0);
            expect(scale.map(50)).toBe(250);
            expect(scale.map(100)).toBe(500);
        });

        it("should invert pixels to domain value", () => {
            const scale = CartesianScaleFactory.createLinearScale([0, 100], [0, 500], false);
            expect(scale.invert(250)).toBe(50);
            expect(scale.invert(scale.map(75))).toBeCloseTo(75, 5);
        });

        it("should preserve exact explicit bounds after nice()", () => {
            const scale = CartesianScaleFactory.createLinearScale([0, 85], [0, 500], true, 5, 0, 85);
            expect(scale.domain()).toEqual([0, 85]);
        });

        it("should never produce degenerate scale when explicit min equals explicit max", () => {
            const scale = CartesianScaleFactory.createLinearScale([100, 100], [0, 500], true, 5, 100, 100);
            const domain = scale.domain();
            expect(domain[0]).toBeLessThan(100);
            expect(domain[1]).toBeGreaterThan(100);
            expect(Number.isFinite(scale.map(100))).toBe(true);
        });

        it("should generate ticks", () => {
            const scale = CartesianScaleFactory.createLinearScale([0, 100], [0, 500], false);
            const ticks = scale.ticks(5);
            expect(ticks.length).toBeGreaterThanOrEqual(4);
            expect(ticks[0]).toBe(0);
            expect(ticks[ticks.length - 1]).toBe(100);
        });
    });

    describe("BandScale", () => {
        it("should map categorical keys to band coordinates", () => {
            const categories = ["A", "B", "C"];
            const scale = CartesianScaleFactory.createBandScale(categories, [0, 300], 0, 0);
            expect(scale.bandwidth()).toBe(100);
            expect(scale.map("A")).toBe(0);
            expect(scale.map("B")).toBe(100);
            expect(scale.map("C")).toBe(200);
        });

        it("should return undefined for unknown keys", () => {
            const scale = CartesianScaleFactory.createBandScale(["A", "B"], [0, 200]);
            expect(scale.map("UNKNOWN")).toBeUndefined();
        });
    });

    describe("TimeScale", () => {
        it("should map dates to range coordinates", () => {
            const d1 = new Date(2026, 0, 1);
            const d2 = new Date(2026, 0, 11);
            const mid = new Date(2026, 0, 6);
            const scale = CartesianScaleFactory.createTimeScale([d1, d2], [0, 1000], false);
            expect(scale.map(d1)).toBe(0);
            expect(scale.map(mid)).toBeCloseTo(500, 0);
            expect(scale.map(d2)).toBe(1000);
        });

        it("should preserve exact explicit bounds after nice()", () => {
            const d1 = new Date(2026, 0, 1);
            const d2 = new Date(2026, 0, 11);
            const scale = CartesianScaleFactory.createTimeScale([d1, d2], [0, 1000], true, 5, d1, d2);
            expect(scale.domain()[0].getTime()).toBe(d1.getTime());
            expect(scale.domain()[1].getTime()).toBe(d2.getTime());
        });

        it("should handle equal explicit dates without creating zero-width scale", () => {
            const d = new Date(2026, 0, 1);
            const scale = CartesianScaleFactory.createTimeScale([d, d], [0, 1000], true, 5, d, d);
            const domain = scale.domain();
            expect(domain[0].getTime()).toBeLessThan(d.getTime());
            expect(domain[1].getTime()).toBeGreaterThan(d.getTime());
        });
    });

    describe("UtcScale", () => {
        it("should map UTC dates to range coordinates", () => {
            const d1 = new Date("2026-01-01T00:00:00Z");
            const d2 = new Date("2026-01-11T00:00:00Z");
            const scale = CartesianScaleFactory.createUtcScale([d1, d2], [0, 1000], false);
            expect(scale.map(d1)).toBe(0);
            expect(scale.map(d2)).toBe(1000);
        });
    });
});
