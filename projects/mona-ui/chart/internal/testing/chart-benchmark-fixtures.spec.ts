import { describe, expect, it } from "vitest";
import {
    assertDeterministic,
    createSeededRandom,
    generateBubbleSizeOutliers,
    generateDescendingSeries,
    generateDuplicateXSeries,
    generateIrregularTimestamps,
    generateNullGapSeries,
    generateRandomWalk,
    generateScatterClusters,
    generateSineWave,
    generateSpikedSeries,
    generateStackedAreaSeries,
    generateStepSignal,
    generateUnsortedSeries
} from "./chart-benchmark-fixtures";

describe("chart benchmark fixtures", () => {
    it("seeded random is deterministic for the same seed", () => {
        const a = createSeededRandom(42);
        const b = createSeededRandom(42);
        const seqA = Array.from({ length: 16 }, () => a());
        const seqB = Array.from({ length: 16 }, () => b());
        expect(seqA).toEqual(seqB);
        expect(seqA.every(v => v >= 0 && v < 1)).toBe(true);
    });

    it("sine wave produces monotonic ascending timestamps", () => {
        const points = generateSineWave(1000);
        expect(points).toHaveLength(1000);
        const t0 = (points[0].x as Date).getTime();
        const t1 = (points[1].x as Date).getTime();
        expect(t1).toBeGreaterThan(t0);
        expect(points.every(p => typeof p.y === "number" && Number.isFinite(p.y))).toBe(true);
    });

    it("spiked series retains rare extrema markers", () => {
        const points = generateSpikedSeries(200_000, { negativeEvery: 100_000, positiveEvery: 50_000 });
        let max = Number.NEGATIVE_INFINITY;
        let min = Number.POSITIVE_INFINITY;
        for (const p of points) {
            const y = p.y as number;
            if (y > max) max = y;
            if (y < min) min = y;
        }
        expect(max).toBeGreaterThanOrEqual(100);
        expect(min).toBeLessThan(-70);
    });

    it("random walk and step signals are deterministic", () => {
        expect(() => assertDeterministic(() => generateRandomWalk(500, 7))).not.toThrow();
        expect(() => assertDeterministic(() => generateStepSignal(500))).not.toThrow();
    });

    it("null gap series contains an explicit null run", () => {
        const points = generateNullGapSeries(100, { gapLength: 20, gapStart: 33 });
        const nullCount = points.filter(p => p.y === null).length;
        expect(nullCount).toBe(20);
    });

    it("irregular timestamps are strictly increasing", () => {
        const points = generateIrregularTimestamps(1000, 3);
        for (let i = 1; i < points.length; i++) {
            expect((points[i].x as Date).getTime()).toBeGreaterThan((points[i - 1].x as Date).getTime());
        }
    });

    it("duplicate X series contains duplicated timestamps", () => {
        const points = generateDuplicateXSeries(10);
        const keys = new Set(points.map(p => (p.x as Date).getTime()));
        expect(keys.size).toBeLessThan(points.length);
    });

    it("descending series is monotonically descending in X", () => {
        const points = generateDescendingSeries(100);
        for (let i = 1; i < points.length; i++) {
            expect((points[i].x as Date).getTime()).toBeLessThan((points[i - 1].x as Date).getTime());
        }
    });

    it("unsorted series is not monotonic", () => {
        const points = generateUnsortedSeries(1000, 11);
        let violations = 0;
        for (let i = 1; i < points.length; i++) {
            if ((points[i].x as Date).getTime() < (points[i - 1].x as Date).getTime()) {
                violations++;
            }
        }
        expect(violations).toBeGreaterThan(0);
    });

    it("scatter clusters include outliers outside cluster cores", () => {
        const points = generateScatterClusters(1000, 5, { outlierCount: 10 });
        expect(points).toHaveLength(1000);
        const farPoints = points.filter(
            p =>
                ![[25, 25], [75, 75], [50, 10]].some(([cx, cy]) => Math.abs(p.x - cx) <= 5 && Math.abs(p.y - cy) <= 5)
        );
        expect(farPoints.length).toBeGreaterThanOrEqual(10);
    });

    it("bubble outliers define a wide size domain", () => {
        const points = generateBubbleSizeOutliers(1000, 9);
        const sizes = points.map(p => p.size ?? 0);
        expect(Math.max(...sizes)).toBeGreaterThanOrEqual(500);
        expect(Math.min(...sizes)).toBeGreaterThanOrEqual(1);
    });

    it("stacked area fixture provides positive and negative layers", () => {
        const fixture = generateStackedAreaSeries(100, 13);
        expect(fixture.data).toHaveLength(100);
        expect(fixture.data.every(d => (d.positive ?? 0) > 0)).toBe(true);
        expect(fixture.data.every(d => (d.negative ?? 0) < 0)).toBe(true);
    });
});
