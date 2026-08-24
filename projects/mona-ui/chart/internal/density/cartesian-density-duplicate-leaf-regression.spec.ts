import { describe, expect, it } from "vitest";
import { ChartDensityTracker } from "../layout/chart-density-instrumentation";
import { projectCartesianMarkerDensity } from "./cartesian-marker-density-projector";
import { CartesianSpatialDensityIndex } from "./cartesian-spatial-density-index";

function duplicateIndex(count: number, sizes?: Float64Array): CartesianSpatialDensityIndex {
    return new CartesianSpatialDensityIndex(
        new Float64Array(count).fill(0.5),
        new Float64Array(count).fill(0.5),
        sizes
    );
}

const narrowInsideWindow: readonly [number, number, number, number] = [0.5, 0.5, 1e-15, 1e-15];
const narrowOutsideWindow: readonly [number, number, number, number] = [0.5 + 5e-13, 0.5 + 5e-13, 1e-15, 1e-15];

describe("Cartesian Density Duplicate Leaf Counting Regressions", () => {
    it("counts a narrow inside exact-duplicate leaf with one membership test", () => {
        const index = duplicateIndex(100_000);
        let membershipTests = 0;

        const count = index.countPointsInWindow(narrowInsideWindow, undefined, () => membershipTests++);

        expect(count).toBe(100_000);
        expect(membershipTests).toBeLessThanOrEqual(2);
    });

    it("rejects a narrow outside exact-duplicate leaf with one membership test", () => {
        const index = duplicateIndex(100_000);
        let membershipTests = 0;

        const count = index.countPointsInWindow(narrowOutsideWindow, undefined, () => membershipTests++);

        expect(count).toBe(0);
        expect(membershipTests).toBeLessThanOrEqual(2);
    });

    it("rejects an over-cap exact duplicate collection before scanning the source slice", () => {
        const index = duplicateIndex(100_000);
        let membershipTests = 0;

        const collected = index.collectIndicesInWindow(narrowInsideWindow, 8, () => membershipTests++);

        expect(collected).toBeNull();
        expect(membershipTests).toBeLessThanOrEqual(2);
    });

    it("still materializes an allowed exact duplicate collection in source order", () => {
        const index = duplicateIndex(8);
        let membershipTests = 0;

        const collected = index.collectIndicesInWindow(narrowInsideWindow, 8, () => membershipTests++);

        expect(collected).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
        expect(membershipTests).toBeLessThanOrEqual(2);
    });

    it("keeps projector count work bounded for a million exact duplicates", () => {
        const index = duplicateIndex(1_000_000);
        const tracker = ChartDensityTracker.install();
        try {
            const projection = projectCartesianMarkerDensity({
                centerWindow: narrowInsideWindow,
                enabled: true,
                maxPoints: 8,
                maxVisualRadius: 0,
                plotHeight: 1_000,
                plotWidth: 1_000,
                samplesPerPixel: 1,
                spatialIndex: index,
                threshold: 0
            });

            expect(index.nodeCount).toBe(1);
            expect(projection.renderCandidateCount).toBe(1_000_000);
            expect(projection.selectedCount).toBeLessThanOrEqual(8);
            expect(tracker.snapshot.spatialPointMembershipTests).toBeLessThanOrEqual(4);
        } finally {
            ChartDensityTracker.uninstall();
        }
    });

    it("preserves non-degenerate exact count and collection behavior", () => {
        const index = new CartesianSpatialDensityIndex(
            Float64Array.from([0.49, 0.5, 0.51]),
            Float64Array.from([0.49, 0.5, 0.51])
        );
        let membershipTests = 0;
        const window: readonly [number, number, number, number] = [0.5, 0.5, 0.005, 0.005];

        expect(index.countPointsInWindow(window, undefined, () => membershipTests++)).toBe(1);
        expect(index.collectIndicesInWindow(window, 1, () => membershipTests++)).toEqual([1]);
        expect(membershipTests).toBeGreaterThanOrEqual(2);
    });
});
