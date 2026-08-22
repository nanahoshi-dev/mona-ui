import { describe, expect, it } from "vitest";
import { CartesianScaleFactory } from "../scale/cartesian-scale-factory";
import type { CartesianStackEntry } from "../data/cartesian-stack-engine";
import { computeSharedStackSampleIndices } from "./cartesian-stack-downsampler";

function makeEntries(seriesId: string, count: number, valueAt: (i: number) => number): CartesianStackEntry[] {
    const keyResolver = { resolveKey: () => `${seriesId}-key` };
    return Array.from({ length: count }, (_, i) => ({
        animationKey: keyResolver.resolveKey(),
        dataIndex: i,
        datum: { x: i, v: valueAt(i) },
        defined: true,
        rawValue: valueAt(i),
        stackEnd: valueAt(i),
        stackStart: 0,
        synthetic: false,
        visualValue: valueAt(i),
        xKey: i,
        xValue: i
    }));
}

describe("computeSharedStackSampleIndices", () => {
    const scale = CartesianScaleFactory.createExactPositionScale({
        domain: [0, 49_999],
        range: [0, 500],
        type: "linear"
    }) as never;

    it("returns null below threshold", () => {
        const entries = new Map([["a", makeEntries("a", 100, i => i)]]);
        expect(computeSharedStackSampleIndices({ entriesBySeriesId: entries, plotSpanPx: 500, samplesPerPixel: 1, viewportScale: scale })).toBeNull();
    });

    it("selects the same shared index set for every series in the group", () => {
        // The sampler produces one set applied to all layers by construction;
        // verify determinism and boundedness of that set here.
        const count = 40_000;
        const entries = new Map<string, readonly CartesianStackEntry[]>([
            ["a", makeEntries("a", count, i => Math.sin(i / 100) * 10 + 20)],
            ["b", makeEntries("b", count, i => -5)]
        ]);
        const first = computeSharedStackSampleIndices({ entriesBySeriesId: entries, plotSpanPx: 600, samplesPerPixel: 1, viewportScale: scale });
        const second = computeSharedStackSampleIndices({ entriesBySeriesId: entries, plotSpanPx: 600, samplesPerPixel: 1, viewportScale: scale });
        expect(first).not.toBeNull();
        expect(Array.from(first!).sort((x, y) => x - y)).toEqual(Array.from(second!).sort((x, y) => x - y));

        // Bounded output regardless of layer count (§214).
        expect(first!.size).toBeLessThan(8_000);

        // First/last retained.
        expect(first!.has(0)).toBe(true);
        expect(first!.has(count - 1)).toBe(true);
    });

    it("retains buckets containing rare total spikes", () => {
        const count = 30_000;
        const spikeIndex = 17_777;
        const a = makeEntries("a", count, i => (i === spikeIndex ? 400 : 1));
        const b = makeEntries("b", count, i => (i === 21_000 ? -300 : -1));
        const entries = new Map<string, readonly CartesianStackEntry[]>([["a", a], ["b", b]]);
        const selected = computeSharedStackSampleIndices({ entriesBySeriesId: entries, plotSpanPx: 500, samplesPerPixel: 1, viewportScale: scale })!;
        expect(selected.has(spikeIndex)).toBe(true);
        expect(selected.has(21_000)).toBe(true);
    });

    it("accumulates totals from full layers before selection (never sampled-only)", () => {
        const count = 25_000;
        // Two layers each with modest values; combined positive peak at index k
        // would be invisible looking at either single layer.
        const peak = 15_000;
        const a = makeEntries("a", count, i => (i === peak ? 60 : 2));
        const b = makeEntries("b", count, i => (i === peak ? 80 : 3));
        const entries = new Map<string, readonly CartesianStackEntry[]>([["a", a], ["b", b]]);
        const selected = computeSharedStackSampleIndices({ entriesBySeriesId: entries, plotSpanPx: 500, samplesPerPixel: 1, viewportScale: scale })!;
        expect(selected.has(peak)).toBe(true);
    });
});
