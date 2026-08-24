import { describe, expect, it } from "vitest";
import { CartesianScaleFactory } from "../scale/cartesian-scale-factory";
import { ChartMarkIdentityResolver } from "../interaction/chart-mark-identity-resolver";
import { ChartMarkKeyResolver } from "../animation/animation-identity";
import { buildScalarDensityData } from "./cartesian-density-preparer";
import { CartesianConnectedPathInteractionProvider } from "./cartesian-dense-interaction-provider";
import type { CartesianDenseInteractionProvider } from "./cartesian-dense-interaction-provider";
import type { SceneHitTarget } from "../scene/scene-geometry";

describe("dense brush range query", () => {
    const count = 40_000;
    const data = Array.from({ length: count }, (_, i) => ({ x: i, y: i % 100 }));
    // Distinctive unsampled datum inside a brush window.
    data[20_000] = { x: 20_000, y: 55 };

    const scalar = buildScalarDensityData({ data, temporal: false, xField: "x", yField: "y" });
    const xScale = CartesianScaleFactory.createExactPositionScale({
        domain: [0, count - 1],
        range: [0, 800],
        type: "linear"
    });
    const yScale = CartesianScaleFactory.createExactPositionScale({
        domain: [0, 99],
        range: [400, 0],
        type: "linear"
    });
    const keyResolver = new ChartMarkKeyResolver("s1", undefined, undefined);
    const provider: CartesianDenseInteractionProvider = new CartesianConnectedPathInteractionProvider({
        materialize: (index: number) => {
            const datum = scalar.sourceData[index];
            if (datum === undefined || !Number.isFinite(scalar.y[index])) {
                return null;
            }
            return {
                animationKey: keyResolver.resolveKeyWithRank(datum, scalar.x[index], index, 0),
                datum,
                index,
                seriesId: "s1",
                seriesName: "S",
                seriesType: "line",
                xKey: scalar.x[index],
                xValue: scalar.x[index],
                yValue: scalar.y[index]
            };
        },
        scalar,
        xScale: xScale as never,
        yScale: yScale as never
    });

    it("returns every raw point in the brush rectangle without truncation", () => {
        const pixelA = { x: xScale.map(100)!, y: 0 };
        const pixelB = { x: xScale.map(149)!, y: 400 };
        const hits = provider.queryRange({ pixelA, pixelB });
        expect(hits).toHaveLength(50);
        expect(hits[0].index).toBe(100);
        expect(hits[hits.length - 1].index).toBe(149);
    });

    it("filters by the semantic Y range of the rectangle", () => {
        // y=55 maps to a specific pixel band; brush only that band over a wide X range.
        const yPixel = yScale.map(55)!;
        const hits = provider.queryRange({
            pixelA: { x: 0, y: yPixel - 2 },
            pixelB: { x: 800, y: yPixel + 2 }
        });
        expect(hits.length).toBeGreaterThan(0);
        for (const hit of hits) {
            expect(Math.abs((hit as { yValue: number }).yValue - 55)).toBeLessThanOrEqual(1);
        }
    });

    it("keeps mark identity equal to full-layout identity", () => {
        const pixelA = { x: xScale.map(19_999)!, y: 0 };
        const pixelB = { x: xScale.map(20_001)!, y: 400 };
        const hits = provider.queryRange({ pixelA, pixelB });
        const spike = hits.find((h: SceneHitTarget) => h.index === 20_000);
        expect(spike).toBeDefined();
        expect((spike as { yValue: number }).yValue).toBe(55);
        const identity = ChartMarkIdentityResolver.resolve(spike!);
        expect(identity).toContain("20000");
    });
});

describe("lazy reverse lookup by mark id", () => {
    it("locates the raw index behind a natural-key mark id", () => {
        const count = 30_000;
        const data = Array.from({ length: count }, (_, i) => ({ x: i * 3, y: i }));
        const scalar = buildScalarDensityData({ data, temporal: false, xField: "x", yField: "y" });
        const xScale = CartesianScaleFactory.createExactPositionScale({
            domain: [0, (count - 1) * 3],
            range: [0, 900],
            type: "linear"
        });
        const yScale = CartesianScaleFactory.createExactPositionScale({
            domain: [0, count],
            range: [300, 0],
            type: "linear"
        });
        const keyResolver = new ChartMarkKeyResolver("rev", undefined, undefined);
        const provider = new CartesianConnectedPathInteractionProvider({
            materialize: (index: number) => ({
                animationKey: keyResolver.resolveKeyWithRank(scalar.sourceData[index], scalar.x[index], index, 0),
                datum: scalar.sourceData[index],
                index,
                seriesId: "rev",
                seriesName: "R",
                seriesType: "line",
                xKey: scalar.x[index],
                xValue: scalar.x[index],
                yValue: scalar.y[index]
            }),
            scalar,
            xScale: xScale as never,
            yScale: yScale as never
        });

        const targetIndex = 12_345;
        const lookup = provider.locateRawIndex!(targetIndex * 3)!;
        expect(lookup.candidateIndices).toContain(targetIndex);

        const hit = provider.materializeAt(targetIndex)!;
        const markId = ChartMarkIdentityResolver.resolve(hit);
        // The parsed ID resolves back to the same raw datum.
        const parsed = JSON.parse(markId) as [string, string, number, number];
        const reLookup = provider.locateRawIndex!(parsed[2])!;
        expect(reLookup.candidateIndices[parsed[3]]).toBe(targetIndex);
    });

    it("returns no candidates for values absent from the source domain", () => {
        const data = [
            { x: 0, y: 1 },
            { x: 5, y: 2 }
        ];
        const scalar = buildScalarDensityData({ data, temporal: false, xField: "x", yField: "y" });
        const xScale = CartesianScaleFactory.createExactPositionScale({
            domain: [0, 5],
            range: [0, 100],
            type: "linear"
        });
        const yScale = CartesianScaleFactory.createExactPositionScale({
            domain: [0, 2],
            range: [10, 0],
            type: "linear"
        });
        const provider = new CartesianConnectedPathInteractionProvider({
            materialize: () => null,
            scalar,
            xScale: xScale as never,
            yScale: yScale as never
        });
        expect(provider.locateRawIndex!(3)?.candidateIndices ?? []).toHaveLength(0);
    });
});
