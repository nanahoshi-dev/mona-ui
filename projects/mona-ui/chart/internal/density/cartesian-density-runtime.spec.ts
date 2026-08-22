import { describe, expect, it } from "vitest";
import {
    lowerBoundAscending,
    lowerBoundDescending,
    upperBoundAscending,
    upperBoundDescending
} from "./cartesian-minmax-block-index";
import { CartesianMinMaxBlockIndex } from "./cartesian-minmax-block-index";
import { buildDefinedSegments, detectMonotonicity } from "./cartesian-density-segments";
import { buildScalarDensityData, normalizeScalarXValue } from "./cartesian-density-preparer";
import { CartesianStageTracker } from "../layout/cartesian-stage-instrumentation";
import { ChartDensityTracker } from "../layout/chart-density-instrumentation";

describe("binary search bounds", () => {
    const ascending = Float64Array.from([1, 2, 2, 5, 8, 8, 9]);
    const descending = Float64Array.from([9, 8, 8, 5, 2, 2, 1]);

    it("lowerBoundAscending returns first index >= value", () => {
        expect(lowerBoundAscending(ascending, 0, 7, 2)).toBe(1);
        expect(lowerBoundAscending(ascending, 0, 7, 3)).toBe(3);
        expect(lowerBoundAscending(ascending, 0, 7, 0)).toBe(0);
        expect(lowerBoundAscending(ascending, 0, 7, 10)).toBe(7);
    });

    it("upperBoundAscending returns first index > value", () => {
        expect(upperBoundAscending(ascending, 0, 7, 2)).toBe(3);
        expect(upperBoundAscending(ascending, 0, 7, 8)).toBe(6);
        expect(upperBoundAscending(ascending, 0, 7, 9)).toBe(7);
    });

    it("descending bounds mirror ascending semantics", () => {
        expect(lowerBoundDescending(descending, 0, 7, 8)).toBe(1);
        expect(lowerBoundDescending(descending, 0, 7, 5)).toBe(3);
        expect(upperBoundDescending(descending, 0, 7, 8)).toBe(3);
        expect(upperBoundDescending(descending, 0, 7, 2)).toBe(6);
    });

    it("handles empty and single element ranges", () => {
        expect(lowerBoundAscending(new Float64Array(0), 0, 0, 1)).toBe(0);
        expect(lowerBoundAscending(Float64Array.from([5]), 0, 1, 5)).toBe(0);
        expect(upperBoundAscending(Float64Array.from([5]), 0, 1, 5)).toBe(1);
    });
});

describe("density segments and monotonicity", () => {
    it("detects all five monotonicity classes", () => {
        expect(detectMonotonicity(Float64Array.from([1, 2, 3]), buildDefinedSegments(Float64Array.from([1, 2, 3]), Float64Array.from([1, 1, 1])))).toBe("ascending");
        expect(detectMonotonicity(Float64Array.from([1, 1, 2]), buildDefinedSegments(Float64Array.from([1, 1, 2]), Float64Array.from([1, 1, 1])))).toBe("non-decreasing");
        expect(detectMonotonicity(Float64Array.from([3, 2, 1]), buildDefinedSegments(Float64Array.from([3, 2, 1]), Float64Array.from([1, 1, 1])))).toBe("descending");
        expect(detectMonotonicity(Float64Array.from([3, 3, 2]), buildDefinedSegments(Float64Array.from([3, 3, 2]), Float64Array.from([1, 1, 1])))).toBe("non-increasing");
        expect(detectMonotonicity(Float64Array.from([1, 3, 2]), buildDefinedSegments(Float64Array.from([1, 3, 2]), Float64Array.from([1, 1, 1])))).toBe("unsorted");
    });

    it("splits segments at invalid entries", () => {
        const x = Float64Array.from([1, 2, 3, 4, 5]);
        const y = Float64Array.from([1, Number.NaN, 3, 4, Number.NaN]);
        const segments = buildDefinedSegments(x, y);
        expect(segments).toEqual([
            { endIndexExclusive: 1, startIndex: 0 },
            { endIndexExclusive: 4, startIndex: 2 }
        ]);
    });

    it("invalid X also breaks segments", () => {
        const x = Float64Array.from([1, Number.NaN, 3]);
        const y = Float64Array.from([1, 2, 3]);
        const segments = buildDefinedSegments(x, y);
        expect(segments).toHaveLength(2);
    });
});

describe("CartesianMinMaxBlockIndex", () => {
    const y = Float64Array.from([5, 1, 7, Number.NaN, 3, 9, 2, 8, 4, 6]);

    function build(blockSize: number): CartesianMinMaxBlockIndex {
        return new CartesianMinMaxBlockIndex(y, blockSize);
    }

    it("finds extrema across whole range", () => {
        const result = build(3).queryRange(0, 10);
        expect(result.minIndex).toBe(1);
        expect(result.maxIndex).toBe(5);
        expect(result.firstValidIndex).toBe(0);
        expect(result.lastValidIndex).toBe(9);
    });

    it("handles partial block boundaries", () => {
        const index = build(3);
        const result = index.queryRange(2, 8);
        expect(result.minIndex).toBe(6);
        expect(result.maxIndex).toBe(5);
        expect(result.firstValidIndex).toBe(2);
        expect(result.lastValidIndex).toBe(7);
    });

    it("skips invalid-only ranges", () => {
        const index = build(2);
        const result = index.queryRange(3, 4);
        expect(result.minIndex).toBe(-1);
        expect(result.maxIndex).toBe(-1);
        expect(result.firstValidIndex).toBe(-1);
    });

    it("breaks ties toward lower source index", () => {
        const tied = Float64Array.from([4, 4, 4, 4]);
        const index = new CartesianMinMaxBlockIndex(tied, 2);
        const result = index.queryRange(0, 4);
        expect(result.minIndex).toBe(0);
        expect(result.maxIndex).toBe(0);
    });

    it("resolves visible ranges for ascending data", () => {
        const x = Float64Array.from([0, 10, 20, 30, 40, 50]);
        const y = Float64Array.from([1, 2, 3, 4, 5, 6]);
        const index = new CartesianMinMaxBlockIndex(y, 2);
        expect(index.resolveVisibleRange(x, "ascending", 12, 33)).toEqual([2, 4]);
        expect(index.resolveVisibleRange(x, "ascending", 100, 200)).toBeNull();
    });

    it("resolves visible ranges for descending data", () => {
        const x = Float64Array.from([50, 40, 30, 20, 10, 0]);
        const y = Float64Array.from([1, 2, 3, 4, 5, 6]);
        const index = new CartesianMinMaxBlockIndex(y, 2);
        expect(index.resolveVisibleRange(x, "descending", 12, 33)).toEqual([2, 4]);
    });
});

describe("buildScalarDensityData", () => {
    it("normalizes temporal values to epoch milliseconds", () => {
        const data = [
            { t: new Date(Date.UTC(2025, 0, 1)), v: 1 },
            { t: new Date(Date.UTC(2025, 0, 2)), v: 2 }
        ];
        const scalar = buildScalarDensityData({ data, temporal: true, xField: "t", yField: "v" });
        expect(scalar.x[0]).toBe(Date.UTC(2025, 0, 1));
        expect(scalar.monotonicity).toBe("ascending");
        expect(scalar.validCount).toBe(2);
        expect(normalizeScalarXValue("2025-01-01T00:00:00Z")).toBe(Date.UTC(2025, 0, 1));
    });

    it("keeps source data references without copying datum objects", () => {
        const datum = { x: 1, y: 2 };
        const scalar = buildScalarDensityData({ data: [datum], temporal: false, xField: "x", yField: "y" });
        expect(scalar.sourceData[0]).toBe(datum);
    });

    it("reports instrumentation counters", () => {
        const instrumentation = ChartDensityTracker.install();
        try {
            const data = Array.from({ length: 100 }, (_, i) => ({ x: i, y: i * 2 }));
            buildScalarDensityData({ data, temporal: false, xField: "x", yField: "y" });
            expect(instrumentation.snapshot.densityRuntimeBuilds).toBe(1);
            expect(instrumentation.snapshot.rawPointsNormalized).toBe(100);
        } finally {
            ChartDensityTracker.uninstall();
        }
    });

    it("does not disturb stage instrumentation", () => {
        let stageA = 0;
        CartesianStageTracker.current = { onStageA: () => stageA++ };
        try {
            const data = [{ x: 1, y: 1 }];
            buildScalarDensityData({ data, temporal: false, xField: "x", yField: "y" });
            expect(stageA).toBe(0);
        } finally {
            CartesianStageTracker.current = null;
        }
    });
});
