import { describe, expect, it } from "vitest";
import {
    computeSparklineGeometry,
    getSparklineStats,
    readSparklineValues,
    type SparklineGeometryOptions
} from "../utils/sparkline-geometry";

const LINE: SparklineGeometryOptions = {
    curve: "linear",
    markers: [],
    max: null,
    min: null,
    referenceValue: null,
    type: "line"
};

describe("sparkline geometry", () => {
    it("reads anything that isn't a finite number as a gap", () => {
        expect(readSparklineValues([1, null, undefined, Number.NaN, Infinity, 2])).toEqual([
            1,
            null,
            null,
            null,
            null,
            2
        ]);
    });

    it("summarizes the values, without the gaps", () => {
        expect(getSparklineStats([3, null, -1, 0, 5])).toEqual({
            count: 4,
            draws: 1,
            first: 3,
            last: 5,
            losses: 1,
            max: 5,
            min: -1,
            wins: 2
        });
        expect(getSparklineStats([null, null])).toBeNull();
    });

    it("draws a line from the left edge to the right, with the highest value at the top", () => {
        const geometry = computeSparklineGeometry([0, 10, 5], LINE);
        expect(geometry.linePath).toBe("M0,100L50,0L100,50");
        expect(geometry.areaPath).toBe("");
        expect(geometry.bars).toEqual([]);
    });

    it("breaks the line at gaps, and draws a dot for a value alone between them", () => {
        const geometry = computeSparklineGeometry([0, 10, null, 5, null, 10, 0], LINE);
        expect(geometry.linePath).toBe("M0,100L16.67,0M83.33,0L100,100");
        expect(geometry.dotsPath).toBe("M50 50h0");
    });

    it("centers a single value, and values that are all the same", () => {
        expect(computeSparklineGeometry([7], LINE).dotsPath).toBe("M50 50h0");
        expect(computeSparklineGeometry([4, 4], LINE).linePath).toBe("M0,50L100,50");
    });

    it("fills an area down to zero when the values cross it, and to the bottom when they're all above it", () => {
        const crossing = computeSparklineGeometry([-5, 5], { ...LINE, type: "area" });
        expect(crossing.areaPath).toBe("M0,100L100,0L100,50L0,50Z");
        const above = computeSparklineGeometry([10, 20], { ...LINE, type: "area" });
        expect(above.areaPath).toBe("M0,100L100,0L100,100L0,100Z");
        expect(above.linePath).toBe("M0,100L100,0");
    });

    it("joins the values with a smooth curve through each of them", () => {
        const monotone = computeSparklineGeometry([0, 10, 5], { ...LINE, curve: "monotone-x" });
        expect(monotone.linePath).toBe("M0,100C16.67,50,33.33,0,50,0C66.67,0,83.33,25,100,50");
        const natural = computeSparklineGeometry([0, 10, 5], { ...LINE, curve: "natural" });
        expect(natural.linePath).toBe("M0,100C16.67,54.17,33.33,8.33,50,0C66.67,-8.33,83.33,20.83,100,50");
    });

    it("keeps a monotone curve within the values, where a natural one swings past them", () => {
        const values = [0, 10, 0, 10, 5];
        const heights = (path: string): number[] =>
            Array.from(path.matchAll(/-?[\d.]+,(-?[\d.]+)/g), match => Number(match[1]));
        const monotone = heights(computeSparklineGeometry(values, { ...LINE, curve: "monotone-x" }).linePath);
        expect(Math.min(...monotone)).toBe(0);
        expect(Math.max(...monotone)).toBe(100);
        const natural = heights(computeSparklineGeometry(values, { ...LINE, curve: "natural" }).linePath);
        expect(Math.max(...natural)).toBeGreaterThan(100);
    });

    it("draws steps that change halfway between values, or at each value", () => {
        expect(computeSparklineGeometry([0, 10, 5], { ...LINE, curve: "step" }).linePath).toBe(
            "M0,100L25,100L25,0L75,0L75,50L100,50"
        );
        expect(computeSparklineGeometry([0, 10, 5], { ...LINE, curve: "step-after" }).linePath).toBe(
            "M0,100L50,100L50,0L100,0L100,50"
        );
    });

    it("fills under the curve, and keeps dots and markers on the values", () => {
        const geometry = computeSparklineGeometry([0, 10, 5, null, 3], {
            ...LINE,
            curve: "step-after",
            markers: ["max"],
            type: "area"
        });
        expect(geometry.linePath).toBe("M0,100L25,100L25,0L50,0L50,50");
        expect(geometry.areaPath).toBe("M0,100L25,100L25,0L50,0L50,50L50,100L50,100L25,100L25,100L0,100Z");
        expect(geometry.dotsPath).toBe("M100 70h0");
        expect(geometry.markersPath).toBe("M25 0h0");
    });

    it("stands columns on zero, with a baseline only when values are on both sides of it", () => {
        const positive = computeSparklineGeometry([5, 10], { ...LINE, type: "column" });
        expect(positive.bars).toEqual([
            { height: 50, kind: "positive", width: 35, x: 7.5, y: 50 },
            { height: 100, kind: "positive", width: 35, x: 57.5, y: 0 }
        ]);
        expect(positive.baselineY).toBeNull();

        const mixed = computeSparklineGeometry([10, null, -10], { ...LINE, type: "column" });
        expect(mixed.baselineY).toBe(50);
        expect(mixed.bars.map(bar => [bar.kind, bar.y, bar.height])).toEqual([
            ["positive", 0, 50],
            ["negative", 50, 50]
        ]);
    });

    it("ignores the curve for columns and win-loss bars", () => {
        for (const type of ["column", "win-loss"] as const) {
            const straight = computeSparklineGeometry([5, -2, 10], { ...LINE, type });
            expect(computeSparklineGeometry([5, -2, 10], { ...LINE, curve: "natural", type })).toEqual(straight);
        }
    });

    it("draws wins up, losses down and draws as a tick across the middle, all of one height", () => {
        const geometry = computeSparklineGeometry([3, -1, 0, null, 8], { ...LINE, type: "win-loss" });
        expect(geometry.bars.map(bar => [bar.kind, bar.y, bar.height])).toEqual([
            ["positive", 0, 46],
            ["negative", 54, 46],
            ["zero", 46, 8],
            ["positive", 0, 46]
        ]);
        expect(geometry.linePath).toBe("");
        expect(computeSparklineGeometry([1], { ...LINE, referenceValue: 0, type: "win-loss" }).referenceY).toBeNull();
    });

    it("marks the first, last, lowest and highest values once each", () => {
        const geometry = computeSparklineGeometry([null, 4, 0, 10, 10, 2, null], {
            ...LINE,
            markers: ["max", "first", "min", "last", "first"]
        });
        expect(geometry.markersPath).toBe("M16.67 60h0M33.33 100h0M50 0h0M83.33 80h0");
    });

    it("keeps the given range, and keeps values outside it at its edges", () => {
        const geometry = computeSparklineGeometry([0, 50, 150], { ...LINE, max: 100, min: 0 });
        expect(geometry.linePath).toBe("M0,100L50,50L100,0");
        const swapped = computeSparklineGeometry([0, 50], { ...LINE, max: 0, min: 100 });
        expect(swapped.linePath).toBe("M0,100L100,50");
    });

    it("draws the reference value, widening the range to show it", () => {
        const geometry = computeSparklineGeometry([10, 20], { ...LINE, referenceValue: 30 });
        expect(geometry.referenceY).toBe(0);
        expect(geometry.linePath).toBe("M0,100L100,50");
    });

    it("draws nothing without values", () => {
        expect(computeSparklineGeometry([null], LINE)).toEqual({
            areaPath: "",
            bars: [],
            baselineY: null,
            dotsPath: "",
            linePath: "",
            markersPath: "",
            referenceY: null
        });
    });
});
