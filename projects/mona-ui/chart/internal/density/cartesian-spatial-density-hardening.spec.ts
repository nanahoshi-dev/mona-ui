import { describe, expect, it } from "vitest";
import { CartesianSpatialDensityIndex } from "./cartesian-spatial-density-index";
import { CartesianMarkerSpatialInteractionProvider } from "./cartesian-marker-dense-provider";
import { CartesianScaleFactory } from "../scale/cartesian-scale-factory";

describe("Cartesian Spatial Density Hardening (SD2-R27 - SD2-R36)", () => {
    it("handles dynamic root bounds containing normalized points outside [0, 1]", () => {
        // Coordinates outside [0, 1] (e.g. u from -0.5 to 1.5, v from -0.2 to 1.2)
        const u = new Float64Array([-0.5, 0.2, 0.8, 1.5]);
        const v = new Float64Array([-0.2, 0.4, 0.6, 1.2]);

        const index = new CartesianSpatialDensityIndex(u, v);
        expect(index.pointCount).toBe(4);

        const nearest = index.resolveNearestNormalized(-0.4, -0.1);
        expect(nearest).not.toBeNull();
        expect(nearest?.index).toBe(0);

        const nearestFar = index.resolveNearestNormalized(1.4, 1.1);
        expect(nearestFar).not.toBeNull();
        expect(nearestFar?.index).toBe(3);
    });

    it("handles degenerate leaves with identical coordinates in O(1)", () => {
        const count = 200;
        const u = new Float64Array(count).fill(0.5);
        const v = new Float64Array(count).fill(0.5);

        const index = new CartesianSpatialDensityIndex(u, v);
        expect(index.pointCount).toBe(count);

        let visitedNodes = 0;
        const nearest = index.resolveNearestNormalized(0.5, 0.5, () => visitedNodes++);
        expect(nearest).not.toBeNull();
        expect(nearest?.index).toBe(0); // lowest source index tie break
    });

    it("partitions a tight non-identical cluster instead of leaving one max-depth leaf", () => {
        const count = 10_000;
        const u = Float64Array.from({ length: count }, (_, index) => 0.5 + (index % 100) * 1e-8);
        const v = Float64Array.from({ length: count }, (_, index) => 0.5 + Math.floor(index / 100) * 1e-10);

        const index = new CartesianSpatialDensityIndex(u, v);
        expect(index.nodeCount).toBeGreaterThan(20);

        const representatives: number[] = [];
        index.collectRepresentatives([0, 0, 1, 1], 500, sourceIndex => representatives.push(sourceIndex));
        expect(representatives.length).toBeLessThanOrEqual(500);
    });

    it("deduplicates representatives in collectRepresentatives", () => {
        const u = new Float64Array([0.1, 0.1, 0.2, 0.3, 0.4, 0.5]);
        const v = new Float64Array([0.1, 0.1, 0.2, 0.3, 0.4, 0.5]);
        const sizes = new Float64Array([10, 10, 5, 5, 5, 5]);

        const index = new CartesianSpatialDensityIndex(u, v, sizes);
        const collected: number[] = [];
        index.collectRepresentatives([0, 0, 1, 1], 10, idx => collected.push(idx));

        const uniqueSet = new Set(collected);
        expect(collected.length).toBe(uniqueSet.size);
    });

    it("CartesianMarkerSpatialInteractionProvider expands discovery window for visual radius on intersect", () => {
        const u = new Float64Array([0.5]);
        const v = new Float64Array([0.5]);
        const sizes = new Float64Array([20]); // visual radius 20px

        const index = new CartesianSpatialDensityIndex(u, v, sizes);
        const xScale = CartesianScaleFactory.createExactPositionScale({
            domain: [0, 100],
            range: [0, 400],
            type: "linear"
        });
        const yScale = CartesianScaleFactory.createExactPositionScale({
            domain: [0, 100],
            range: [400, 0],
            type: "linear"
        });

        const provider = new CartesianMarkerSpatialInteractionProvider({
            hierarchy: index,
            materialize: idx => ({
                animationKey: `marker-${idx}`,
                datum: { x: 50, y: 50 },
                index: idx,
                point: { x: 200, y: 200 },
                radius: 16,
                seriesId: "scatter-1",
                seriesName: "Scatter 1",
                seriesType: "scatter",
                visualRadius: 20,
                xKey: 50,
                xValue: 50,
                yValue: 50
            }),
            maxVisualRadius: 20,
            seriesId: "scatter-1",
            xAxisId: "x-main",
            xBaseNormalize: val => Number(val) / 100,
            xViewportScale: xScale as any,
            yAxisId: "y-main",
            yBaseNormalize: val => Number(val) / 100,
            yViewportScale: yScale as any
        });

        // Query box near but not touching the center (center is at 200, query is 185 to 195)
        // With radius 20, the circle extends to 180, so it intersects!
        const hits = provider.queryRange({
            hitPolicy: "intersect",
            pixelA: { x: 170, y: 170 },
            pixelB: { x: 190, y: 190 }
        });

        expect(hits).toHaveLength(1);
        expect(hits[0].index).toBe(0);
    });
});
