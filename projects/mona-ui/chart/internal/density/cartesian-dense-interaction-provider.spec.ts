import { describe, expect, it } from "vitest";
import { CartesianScaleFactory } from "../scale/cartesian-scale-factory";
import { ChartMarkKeyResolver } from "../animation/animation-identity";
import { buildScalarDensityData } from "./cartesian-density-preparer";
import { CartesianConnectedPathInteractionProvider } from "./cartesian-dense-interaction-provider";
import { createDenseHitMaterializer } from "./cartesian-dense-hit-materializer";

describe("CartesianConnectedPathInteractionProvider", () => {
    const count = 50_000;
    const data = Array.from({ length: count }, (_, i) => ({ x: i * 2, y: Math.sin(i / 100) * 10 }));
    // A distinctive raw datum the visual sampler will not retain.
    const targetIndex = 23_456;
    data[targetIndex] = { x: targetIndex * 2, y: 999 };

    const scalar = buildScalarDensityData({ data, temporal: false, xField: "x", yField: "y" });
    const xScale = CartesianScaleFactory.createExactPositionScale({
        domain: [0, (count - 1) * 2],
        range: [0, 1000],
        type: "linear"
    });
    const yScale = CartesianScaleFactory.createExactPositionScale({
        domain: [-20, 1000],
        range: [400, 0],
        type: "linear"
    });

    const keyResolver = new ChartMarkKeyResolver("series-1", undefined, undefined);
    const materialize = createDenseHitMaterializer({
        keyResolver,
        scalar,
        seriesDisplayName: "Dense",
        seriesId: "series-1",
        seriesType: "line",
        temporal: false,
        xAxisId: "x-main",
        xScale: xScale as never,
        yAxisId: "y-main",
        yScale: yScale as never
    });

    const provider = new CartesianConnectedPathInteractionProvider({
        materialize,
        scalar,
        xScale: xScale as never,
        yScale: yScale as never
    });

    it("resolves an unsampled raw datum near a semantic X", () => {
        // Pixel for semantic x = targetIndex*2 exactly, aimed at the spike's Y.
        const pixelX = ((targetIndex * 2) / ((count - 1) * 2)) * 1000;
        const pixelY = yScale.map(999)!;
        const matches = provider.resolveNearest({ pixel: { x: pixelX, y: pixelY } });
        expect(matches).toHaveLength(1);
        expect(matches[0].index).toBe(targetIndex);
        expect(matches[0].datum).toBe(data[targetIndex]);
        expect((matches[0] as { yValue?: number }).yValue).toBe(999);
    });

    it("returns raw identity equal to what the full layout would produce", () => {
        const pixelX = ((targetIndex * 2 + 1) / ((count - 1) * 2)) * 1000;
        const pixelY = yScale.map(999)!;
        const matches = provider.resolveNearest({ pixel: { x: pixelX, y: pixelY } });
        expect(matches[0].seriesId).toBe("series-1");
        // Mark identity must not leak bucket/sample IDs.
        expect(String(matches[0].xKey)).not.toContain("bucket");
        expect(matches[0].animationKey).toBe(keyResolver.resolveKey(data[targetIndex], targetIndex * 2, targetIndex));
    });

    it("prefers the geometrically nearest duplicate-X candidate", () => {
        const dupData = [
            { x: 0, y: 10 },
            { x: 10, y: 50 },
            { x: 10, y: -30 },
            { x: 20, y: 12 }
        ];
        const dupScalar = buildScalarDensityData({ data: dupData, temporal: false, xField: "x", yField: "y" });
        const dupXScale = CartesianScaleFactory.createExactPositionScale({ domain: [0, 20], range: [0, 100], type: "linear" });
        const dupYScale = CartesianScaleFactory.createExactPositionScale({ domain: [-40, 60], range: [100, 0], type: "linear" });
        const dupKeyResolver = new ChartMarkKeyResolver("dup", undefined, undefined);
        const dupProvider = new CartesianConnectedPathInteractionProvider({
            materialize: createDenseHitMaterializer({
                keyResolver: dupKeyResolver,
                scalar: dupScalar,
                seriesDisplayName: "Dup",
                seriesId: "dup",
                seriesType: "line",
                temporal: false,
                xAxisId: "x",
                xScale: dupXScale as never,
                yAxisId: "y",
                yScale: dupYScale as never
            }),
            scalar: dupScalar,
            xScale: dupXScale as never,
            yScale: dupYScale as never
        });

        // Pointer at semantic x=10 with y near -30 → duplicate at index 2 wins.
        const matches = dupProvider.resolveNearest({ pixel: { x: 50, y: dupYScale.map(-30)! } });
        expect(matches[0].index).toBe(2);

        // Pointer at semantic x=10 with y near 50 → duplicate at index 1 wins.
        const matchesHigh = dupProvider.resolveNearest({ pixel: { x: 50, y: dupYScale.map(50)! } });
        expect(matchesHigh[0].index).toBe(1);
    });

    it("skips invalid datums in the candidate window", () => {
        const gapData = [
            { x: 0, y: 1 },
            { x: 5, y: null as unknown as number },
            { x: 10, y: 3 }
        ];
        const gapScalar = buildScalarDensityData({ data: gapData, temporal: false, xField: "x", yField: "y" });
        const gX = CartesianScaleFactory.createExactPositionScale({ domain: [0, 10], range: [0, 100], type: "linear" });
        const gY = CartesianScaleFactory.createExactPositionScale({ domain: [0, 4], range: [100, 0], type: "linear" });
        const gKeyResolver = new ChartMarkKeyResolver("gap", undefined, undefined);
        const gapProvider = new CartesianConnectedPathInteractionProvider({
            materialize: createDenseHitMaterializer({
                keyResolver: gKeyResolver,
                scalar: gapScalar,
                seriesDisplayName: "G",
                seriesId: "g",
                seriesType: "line",
                temporal: false,
                xAxisId: "x",
                xScale: gX as never,
                yAxisId: "y",
                yScale: gY as never
            }),
            scalar: gapScalar,
            xScale: gX as never,
            yScale: gY as never
        });

        const matches = gapProvider.resolveNearest({ pixel: { x: 50, y: 50 } });
        expect(matches[0].index).not.toBe(1);
    });

    it("materializes nothing for empty data or unsorted fallback", () => {
        const emptyScalar = buildScalarDensityData({ data: [], temporal: false, xField: "x", yField: "y" });
        const eProvider = new CartesianConnectedPathInteractionProvider({
            materialize: () => null,
            scalar: emptyScalar,
            xScale: xScale as never,
            yScale: yScale as never
        });
        expect(eProvider.resolveNearest({ pixel: { x: 0, y: 0 } })).toHaveLength(0);
    });
});
