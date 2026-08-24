import { describe, expect, it, vi } from "vitest";
import { CartesianScaleFactory } from "../scale/cartesian-scale-factory";
import { buildRangeDensityData, buildScalarDensityData } from "./cartesian-density-preparer";
import {
    selectConnectedProtectedCandidatesUnderBudget,
    projectRangeEnvelopeIndexView,
    projectScalarIndexView,
    type ConnectedProtectedCandidateGroup
} from "./cartesian-density-projector";

function buildScalar(
    values: readonly (number | null)[],
    options?: { readonly descending?: boolean; readonly step?: number }
) {
    const step = options?.step ?? 1;
    const data = values.map((y, i) => ({
        x: options?.descending ? (values.length - 1 - i) * step : i * step,
        y
    }));
    return buildScalarDensityData({ data, temporal: false, xField: "x", yField: "y" });
}

function linearScale(domain: readonly [number, number], range: readonly [number, number]) {
    return CartesianScaleFactory.createExactPositionScale({
        domain: [...domain],
        range: [...range],
        type: "linear"
    }) as unknown as import("../scale/chart-scale").ChartContinuousPositionScale<number | Date>;
}

const baseInput = {
    algorithm: "auto" as const,
    baseDomainMax: 1000,
    baseDomainMin: 0,
    maxPoints: null as number | null,
    plotSpanPx: 500,
    samplesPerPixel: 1,
    viewportScale: linearScale([0, 1000], [0, 500])
};

describe("projectScalarIndexView", () => {
    it("does not sample below threshold", () => {
        const scalar = buildScalar(Array.from({ length: 100 }, (_, i) => i));
        const view = projectScalarIndexView({ ...baseInput, scalar });
        expect(view.sampled).toBe(false);
        expect(view.indices).toBeNull();
        expect(view.renderedCount).toBe(100);
    });

    it("samples above threshold and preserves required extrema", () => {
        const count = 50_000;
        const values = new Array<number | null>(count).fill(0);
        // Rare extrema that naive decimation would erase.
        values[12_345] = 500;
        values[40_000] = -400;
        const scalar = buildScalar(values);
        const view = projectScalarIndexView({ ...baseInput, scalar, viewportScale: linearScale([0, values.length - 1], [0, 500]) });

        expect(view.sampled).toBe(true);
        expect(view.indices).not.toBeNull();
        const indices = view.indices!;
        expect(indices.length).toBeLessThan(count);
        expect(indices.length).toBeGreaterThan(0);
        // First/last contract
        expect(indices[0]).toBeLessThanOrEqual(1);
        expect(indices[indices.length - 1]).toBeGreaterThanOrEqual(count - 2);
        // Extrema contract
        expect(indices).toContain(12_345);
        expect(indices).toContain(40_000);
        // Source order preserved
        for (let i = 1; i < indices.length; i++) {
            expect(indices[i]).toBeGreaterThan(indices[i - 1]);
        }
    });

    it("is deterministic for identical inputs", () => {
        const values = Array.from({ length: 20_000 }, (_, i) => Math.sin(i / 30) * 10);
        const scalar = buildScalar(values);
        const a = projectScalarIndexView({ ...baseInput, scalar });
        const b = projectScalarIndexView({ ...baseInput, scalar });
        expect(a.indices).toEqual(b.indices);
    });

    it("respects budget cap", () => {
        const values = Array.from({ length: 100_000 }, (_, i) => ((i * 7919) % 1000) - 500);
        const scalar = buildScalar(values);
        const view = projectScalarIndexView({
            ...baseInput,
            algorithm: "minmax",
            maxPoints: 800,
            scalar,
            viewportScale: linearScale([0, 99_999], [0, 500])
        });
        // Budget constrains bucket count; candidates stay bounded by ~4 per bucket plus neighbors.
        expect(view.indices!.length).toBeLessThanOrEqual(800 * 4 + 2);
    });

    it("handles descending monotonic X", () => {
        const count = 20_000;
        const values = Array.from({ length: count }, (_, i) => Math.sin(i / 20) * 5);
        values[10_000] = 300;
        const scalar = buildScalar(values, { descending: true });
        const scale = linearScale([0, (count - 1)], [0, 500]);
        const view = projectScalarIndexView({ ...baseInput, scalar, viewportScale: scale });
        expect(view.sampled).toBe(true);
        expect(view.indices!).toContain(10_000);
    });

    it("retains boundary continuity neighbors outside the viewport", () => {
        const count = 20_000;
        const values = Array.from({ length: count }, (_, i) => i);
        const scalar = buildScalar(values);
        // Viewport covers only [5000, 6000] of domain [0, count-1].
        const scale = linearScale([0, count - 1], [5000, 6000]);
        const view = projectScalarIndexView({ ...baseInput, algorithm: "minmax" as const, maxPoints: null, plotSpanPx: 1000, samplesPerPixel: 1, scalar, viewportScale: scale });
        const indices = view.indices!;
        expect(indices[0]).toBeLessThan(5000);
        expect(indices[indices.length - 1]).toBeGreaterThan(6000);
    });

    it("preserves gap topology with segments", () => {
        const count = 30_000;
        const values = new Array<number | null>(count).fill(0);
        for (let i = 10_000; i < 20_000; i++) {
            values[i] = null;
        }
        const scalar = buildScalar(values);
        const view = projectScalarIndexView({ ...baseInput, scalar, viewportScale: linearScale([0, values.length - 1], [0, 500]) });
        expect(view.sampled).toBe(true);
        // No sampled index inside the null run.
        expect(view.indices!.every(i => i < 10_000 || i >= 20_000)).toBe(true);
        // Both sides retained around the gap.
        expect(view.indices!.some(i => i >= 9997 && i < 10_000)).toBe(true);
        expect(view.indices!.some(i => i > 19_997 && i <= 20_002)).toBe(true);
    });

    it("falls back to full layout for unsorted X with diagnostic", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        try {
            const data = [
                { x: 0, y: 1 },
                { x: 5, y: 2 },
                { x: 3, y: 3 },
                { x: 8, y: 4 }
            ];
            // Pad with more data to pass retention floor? Unsorted returns full regardless.
            const bigData = Array.from({ length: 25_000 }, (_, i) => ({ x: i % 7, y: i }));
            const scalar = buildScalarDensityData({ data: [...data, ...bigData], temporal: false, xField: "x", yField: "y" });
            const view = projectScalarIndexView({ ...baseInput, scalar });
            expect(view.sampled).toBe(false);
            expect(warnSpy).toHaveBeenCalled();
        } finally {
            warnSpy.mockRestore();
        }
    });

    it("lttb keeps only real source points with first and last", () => {
        const count = 30_000;
        const values = Array.from({ length: count }, (_, i) => Math.sin(i / 100) * 20);
        const scalar = buildScalar(values);
        const view = projectScalarIndexView({
            ...baseInput,
            algorithm: "lttb",
            viewportScale: linearScale([0, count - 1], [0, 500]),
            maxPoints: 1000,
            scalar
        });
        expect(view.algorithm).toBe("lttb");
        expect(view.sampled).toBe(true);
        expect(view.indices!.length).toBeLessThanOrEqual(1000);
        expect(view.indices![0]).toBeLessThanOrEqual(1);
        expect(view.indices![view.indices!.length - 1]).toBeGreaterThanOrEqual(count - 2);
    });

    it("lttb correctly resolves candidate source indices on multi-stage large datasets (SD-R20)", () => {
        const count = 250_000;
        const values = Array.from({ length: count }, (_, i) => Math.sin(i / 100) * 20);
        const scalar = buildScalar(values);
        const view = projectScalarIndexView({
            ...baseInput,
            algorithm: "lttb",
            viewportScale: linearScale([0, count - 1], [0, 500]),
            maxPoints: 500,
            scalar
        });
        expect(view.algorithm).toBe("lttb");
        expect(view.sampled).toBe(true);
        expect(view.indices!.length).toBeLessThanOrEqual(500);
        // All emitted indices are valid source indices in monotonic ascending order
        for (let i = 0; i < view.indices!.length; i++) {
            const idx = view.indices![i];
            expect(idx).toBeGreaterThanOrEqual(0);
            expect(idx).toBeLessThan(count);
            if (i > 0) {
                expect(idx).toBeGreaterThan(view.indices![i - 1]);
            }
        }
    });

    it("protects adjacent source points for sampled step transitions", () => {
        const scalar = buildScalar([0, 0, 10, 10, 0, 0, 0]);
        const view = projectScalarIndexView({
            ...baseInput,
            algorithm: "lttb",
            curve: "step",
            maxPoints: 7,
            scalar,
            threshold: 0,
            viewportScale: linearScale([0, 6], [0, 500])
        });

        expect(view.algorithm).toBe("step");
        expect(view.sampled).toBe(true);
        expect(view.indices).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });

    it("keeps step groups inside defined segments and within a hard cap", () => {
        const scalar = buildScalar([0, 0, null, 10, 10, 0, 0]);
        const view = projectScalarIndexView({
            ...baseInput,
            algorithm: "minmax",
            curve: "step-after",
            maxPoints: 5,
            scalar,
            threshold: 0,
            viewportScale: linearScale([0, 6], [0, 500])
        });

        expect(view.algorithm).toBe("step");
        expect(view.indices!.length).toBeLessThanOrEqual(5);
        expect(view.indices).not.toContain(2);
    });
});

describe("projectRangeEnvelopeIndexView", () => {
    it("preserves low/high extremes and boundaries", () => {
        const count = 40_000;
        const x = Float64Array.from({ length: count }, (_, i) => i);
        const from = Float64Array.from({ length: count }, (_, i) => (i === 15_000 ? -900 : 10));
        const to = Float64Array.from({ length: count }, (_, i) => (i === 25_000 ? 900 : 20));

        const view = projectRangeEnvelopeIndexView({
            ...baseInput,
            baseDomainMax: count - 1,
            baseDomainMin: 0,
            fromY: from,
            plotSpanPx: 500,
            toY: to,
            viewportScale: linearScale([0, count - 1], [0, 500]),
            x
        });

        expect(view.sampled).toBe(true);
        const indices = view.indices!;
        expect(indices).toContain(15_000);
        expect(indices).toContain(25_000);
        expect(indices[0]).toBeLessThanOrEqual(1);
        expect(indices[indices.length - 1]).toBeGreaterThanOrEqual(count - 2);
        for (let i = 1; i < indices.length; i++) {
            expect(indices[i]).toBeGreaterThan(indices[i - 1]);
        }
    });

    it("uses protected adjacency for step range envelopes", () => {
        const data = [
            { from: 0, high: 2, x: 0 },
            { from: 0, high: 2, x: 1 },
            { from: 5, high: 7, x: 2 },
            { from: 5, high: 7, x: 3 },
            { from: 0, high: 2, x: 4 },
            { from: 0, high: 2, x: 5 },
            { from: 0, high: 2, x: 6 }
        ];
        const range = buildRangeDensityData({ data, fromField: "from", temporal: false, toField: "high", xField: "x" });
        const view = projectRangeEnvelopeIndexView({
            ...baseInput,
            curve: "step-after",
            maxPoints: 7,
            range,
            threshold: 0,
            viewportScale: linearScale([0, 6], [0, 500])
        });

        expect(view.algorithm).toBe("step-range-envelope");
        expect(view.sampled).toBe(true);
        expect(view.indices!.length).toBeLessThanOrEqual(7);
        expect(view.indices).toEqual(expect.arrayContaining([1, 2, 3, 4]));
    });
});

describe("selectConnectedProtectedCandidatesUnderBudget", () => {
    const groups: readonly ConnectedProtectedCandidateGroup[] = [
        {
            anchorIndex: 2,
            indices: [1, 2, 3],
            order: 0,
            priority: 1000,
            reason: "clip-anchor"
        },
        {
            anchorIndex: 6,
            indices: [5, 6, 7],
            order: 1,
            priority: 500,
            reason: "step-extremum"
        }
    ];

    it("keeps a protected group atomic whenever the budget allows it", () => {
        expect(selectConnectedProtectedCandidatesUnderBudget(groups, 3, [2])).toEqual([1, 2, 3]);
        expect(selectConnectedProtectedCandidatesUnderBudget(groups, 2, [2])).toEqual([2]);
    });

    it("deduplicates overlapping groups and keeps deterministic source order", () => {
        const overlapping: readonly ConnectedProtectedCandidateGroup[] = [
            {
                anchorIndex: 10,
                indices: [10, 11],
                order: 0,
                priority: 100,
                reason: "step-transition"
            },
            {
                anchorIndex: 11,
                indices: [11, 12],
                order: 1,
                priority: 100,
                reason: "step-transition"
            }
        ];

        expect(selectConnectedProtectedCandidatesUnderBudget(overlapping, 3)).toEqual([10, 11, 12]);
    });

    it("degrades to one deterministic anchor when no protected group fits", () => {
        expect(selectConnectedProtectedCandidatesUnderBudget(groups, 1)).toEqual([2]);
    });
});
