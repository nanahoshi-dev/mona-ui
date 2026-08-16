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
    });
});
