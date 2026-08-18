import { describe, expect, it } from "vitest";
import { CartesianAxisLabelGeometry } from "./cartesian-axis-label-geometry";

describe("CartesianAxisLabelGeometry", () => {
    describe("normalizeRotation", () => {
        it("returns 'auto' when rotation is 'auto'", () => {
            expect(CartesianAxisLabelGeometry.normalizeRotation("auto")).toBe("auto");
        });

        it("returns 0 for undefined, null, NaN, or non-finite values", () => {
            expect(CartesianAxisLabelGeometry.normalizeRotation(undefined)).toBe(0);
            expect(CartesianAxisLabelGeometry.normalizeRotation(NaN as unknown as number)).toBe(0);
            expect(CartesianAxisLabelGeometry.normalizeRotation(Number.POSITIVE_INFINITY)).toBe(0);
        });

        it("clamps rotation between -90 and 90 degrees", () => {
            expect(CartesianAxisLabelGeometry.normalizeRotation(45)).toBe(45);
            expect(CartesianAxisLabelGeometry.normalizeRotation(-45)).toBe(-45);
            expect(CartesianAxisLabelGeometry.normalizeRotation(120)).toBe(90);
            expect(CartesianAxisLabelGeometry.normalizeRotation(-120)).toBe(-90);
        });
    });

    describe("projectRotatedDimensions", () => {
        it("returns exact dimensions at 0 degrees", () => {
            const dims = CartesianAxisLabelGeometry.projectRotatedDimensions(60, 16, 0);
            expect(dims.projectedWidth).toBe(60);
            expect(dims.projectedHeight).toBe(16);
        });

        it("swaps dimensions at 90 degrees", () => {
            const dims = CartesianAxisLabelGeometry.projectRotatedDimensions(60, 16, 90);
            expect(dims.projectedWidth).toBe(16);
            expect(dims.projectedHeight).toBe(60);
        });

        it("swaps dimensions at -90 degrees", () => {
            const dims = CartesianAxisLabelGeometry.projectRotatedDimensions(60, 16, -90);
            expect(dims.projectedWidth).toBe(16);
            expect(dims.projectedHeight).toBe(60);
        });

        it("calculates trigonometric bounding box at 45 degrees", () => {
            const dims = CartesianAxisLabelGeometry.projectRotatedDimensions(60, 16, 45);
            // 60*cos(45) + 16*sin(45) = (60 + 16) * 0.7071 = 53.74
            expect(dims.projectedWidth).toBeCloseTo(53.74, 1);
            expect(dims.projectedHeight).toBeCloseTo(53.74, 1);
        });
    });

    describe("createTickKey", () => {
        it("creates category tick key", () => {
            expect(CartesianAxisLabelGeometry.createTickKey("x", "category", "Q1", 0)).toBe("axis:x:category:0:Q1");
        });

        it("creates linear tick key", () => {
            expect(CartesianAxisLabelGeometry.createTickKey("y", "linear", 50, 2)).toBe("axis:y:linear:50");
        });

        it("creates time tick key", () => {
            const date = new Date(2026, 0, 1);
            expect(CartesianAxisLabelGeometry.createTickKey("x", "time", date, 0)).toBe(`axis:x:time:${date.getTime()}`);
        });
    });

    describe("resolveCategoryLabelThinning", () => {
        it("returns all true when categories fit without collision", () => {
            const flags = CartesianAxisLabelGeometry.resolveCategoryLabelThinning({
                categoryCount: 5,
                categoryStep: 80,
                maxLabelExtentAlongAxis: 40
            });
            expect(flags).toEqual([true, true, true, true, true]);
        });

        it("thins labels when category step is smaller than label extent", () => {
            const flags = CartesianAxisLabelGeometry.resolveCategoryLabelThinning({
                categoryCount: 6,
                categoryStep: 30,
                maxLabelExtentAlongAxis: 50
            });
            // Stride = ceil(54 / 30) = 2
            expect(flags[0]).toBe(true);
            expect(flags[1]).toBe(false);
            expect(flags[2]).toBe(true);
            expect(flags[3]).toBe(false);
            expect(flags[5]).toBe(true); // last is preserved
        });

        it("respects preferredTickCount cap", () => {
            const flags = CartesianAxisLabelGeometry.resolveCategoryLabelThinning({
                categoryCount: 20,
                categoryStep: 50,
                maxLabelExtentAlongAxis: 20,
                preferredTickCount: 5
            });
            const visibleCount = flags.filter(Boolean).length;
            expect(visibleCount).toBeLessThanOrEqual(6);
            expect(flags[0]).toBe(true);
            expect(flags[19]).toBe(true);
        });

        it("preserves last label by replacing near-duplicate if gap is too tight", () => {
            const flags = CartesianAxisLabelGeometry.resolveCategoryLabelThinning({
                categoryCount: 7,
                categoryStep: 20,
                maxLabelExtentAlongAxis: 40
            });
            expect(flags[0]).toBe(true);
            expect(flags[6]).toBe(true);
        });
    });
});
