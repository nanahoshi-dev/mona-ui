import { describe, expect, it } from "vitest";
import {
    CartesianAxisCoordinateSpace,
    type CartesianAxisCoordinateSnapshot
} from "../viewport/cartesian-axis-coordinate-space";
import { CartesianBrushRangeResolver } from "./cartesian-brush-range-resolver";
import type { ResolvedCartesianBrushTarget } from "./cartesian-brush-target-resolver";
import type { ChartBrushCategoryRange } from "../../models/chart-brush.models";

describe("Cartesian Brush Category Extent O(log C) Performance & Boundary Semantics", () => {
    it("resolves category extent in O(log C) time over a large category domain (50,000 categories)", () => {
        const count = 50000;
        const categories = Array.from({ length: count }, (_, i) => `Cat_${i}`);
        const categoryPositions = categories.map((_, i) => ({
            center: i * 10 + 5,
            start: i * 10,
            end: i * 10 + 10,
            gapBefore: 0,
            gapAfter: 0
        }));

        const bandMock = {
            bandwidth: () => 10,
            categoryPositions,
            domain: () => categories,
            map: (k: string) => {
                const idx = parseInt(k.replace("Cat_", ""), 10);
                return idx * 10;
            },
            range: () => [0, 500000]
        };

        const xSnap: CartesianAxisCoordinateSnapshot = {
            baseDomain: categories,
            baseScale: bandMock as any,
            range: [0, 500000],
            ref: { axis: "x", axisId: "xAxis" },
            resolvedType: "category",
            valid: true,
            viewportDomain: categories,
            viewportScale: bandMock as any
        };

        const ySnap: CartesianAxisCoordinateSnapshot = {
            baseDomain: [0, 100],
            baseScale: { domain: () => [0, 100], range: () => [300, 0] } as any,
            range: [300, 0],
            ref: { axis: "y", axisId: "yAxis" },
            resolvedType: "linear",
            valid: true,
            viewportDomain: [0, 100],
            viewportScale: { domain: () => [0, 100], range: () => [300, 0] } as any
        };

        const coordSpace = new CartesianAxisCoordinateSpace(
            new Map([["xAxis", xSnap]]),
            new Map([["yAxis", ySnap]])
        );

        const target: ResolvedCartesianBrushTarget = {
            isValidX: true,
            isValidY: true,
            mode: "x",
            xAxisId: "xAxis"
        };

        const t0 = performance.now();
        // Resolve range spanning category indices 12000 to 24000
        const result = CartesianBrushRangeResolver.resolve(
            { x: 120005, y: 0, width: 119990, height: 300 },
            coordSpace,
            target
        );
        const t1 = performance.now();

        // Must complete well under 10ms (typically <0.1ms for binary search)
        expect(t1 - t0).toBeLessThan(10);
        expect(result.xRange).toBeDefined();
        const catRange = result.xRange as ChartBrushCategoryRange;
        expect(catRange.kind).toBe("category");
        expect(catRange.fromValue).toBe("Cat_12000");
    });

    it("returns undefined for pixel ranges completely within non-overlapping padding gaps", () => {
        const categories = ["A", "B", "C"];
        const categoryPositions = [
            { center: 20, start: 10, end: 30, gapBefore: 10, gapAfter: 10 },
            { center: 60, start: 50, end: 70, gapBefore: 10, gapAfter: 10 },
            { center: 100, start: 90, end: 110, gapBefore: 10, gapAfter: 10 }
        ];

        const mapDict: Record<string, number> = { A: 10, B: 50, C: 90 };
        const bandMock = {
            bandwidth: () => 20,
            categoryPositions,
            domain: () => categories,
            map: (k: string) => mapDict[k],
            range: () => [0, 300]
        };

        const xSnap: CartesianAxisCoordinateSnapshot = {
            baseDomain: categories,
            baseScale: bandMock as any,
            range: [0, 300],
            ref: { axis: "x", axisId: "xAxis" },
            resolvedType: "category",
            valid: true,
            viewportDomain: categories,
            viewportScale: bandMock as any
        };

        const ySnap: CartesianAxisCoordinateSnapshot = {
            baseDomain: [0, 100],
            baseScale: { domain: () => [0, 100], range: () => [300, 0] } as any,
            range: [300, 0],
            ref: { axis: "y", axisId: "yAxis" },
            resolvedType: "linear",
            valid: true,
            viewportDomain: [0, 100],
            viewportScale: { domain: () => [0, 100], range: () => [300, 0] } as any
        };

        const coordSpace = new CartesianAxisCoordinateSpace(
            new Map([["xAxis", xSnap]]),
            new Map([["yAxis", ySnap]])
        );

        // Query in pure gap between 31 and 49
        const extent = coordSpace.resolveCategoryExtentAtPixels({ axis: "x", axisId: "xAxis" }, 32, 48);
        expect(extent).toBeUndefined();
    });
});
