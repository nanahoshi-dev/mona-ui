import { describe, expect, it } from "vitest";
import type { CartesianStackEntry, CartesianStackGroup } from "../data/cartesian-stack-engine";
import { CartesianScaleFactory } from "../scale/cartesian-scale-factory";
import { buildStackGroupDensityRuntime } from "./cartesian-stack-density-runtime";
import { computeSharedStackProjection } from "./cartesian-stack-downsampler";
import { buildScalarDensityData } from "./cartesian-density-preparer";
import { CartesianDefinedSegmentIndex, detectSearchableXMonotonicity } from "./cartesian-density-segments";
import {
    allocateSegmentBudgets,
    planExactConnectedProjection,
    projectScalarIndexView
} from "./cartesian-density-projector";
import { projectCartesianMarkerDensity } from "./cartesian-marker-density-projector";
import { CartesianSpatialDensityIndex } from "./cartesian-spatial-density-index";

function linearScale(domain: readonly [number, number], range: readonly [number, number]) {
    return CartesianScaleFactory.createExactPositionScale({
        domain: [...domain],
        range: [...range],
        type: "linear"
    }) as unknown as import("../scale/chart-scale").ChartContinuousPositionScale<number | Date>;
}

function stackEntry(seriesId: string, dataIndex: number, x: number, value: number): CartesianStackEntry {
    return {
        animationKey: `${seriesId}-${dataIndex}`,
        dataIndex,
        datum: { value, x },
        defined: true,
        rawValue: value,
        stackEnd: value,
        stackStart: 0,
        synthetic: false,
        visualValue: value,
        xKey: x,
        xValue: x
    };
}

describe("Cartesian Density LTTB Clipping and Fragment Reservation Regressions", () => {
    it("requires globally finite monotonic X even when Y has gaps", () => {
        expect(detectSearchableXMonotonicity(Float64Array.from([0, 10, 5, 20]))).toBe("unsorted");
        expect(detectSearchableXMonotonicity(Float64Array.from([0, 10, Number.NaN, 20]))).toBe("unsearchable");

        const scalar = buildScalarDensityData({
            data: [
                { x: 0, y: 1 },
                { x: 10, y: null },
                { x: 5, y: 2 },
                { x: 20, y: 3 }
            ],
            temporal: false,
            xField: "x",
            yField: "y"
        });
        expect(scalar.monotonicity).toBe("unsorted");
        expect(
            projectScalarIndexView({
                algorithm: "auto",
                baseDomainMax: 20,
                baseDomainMin: 0,
                maxPoints: 2,
                plotSpanPx: 100,
                samplesPerPixel: 1,
                scalar,
                threshold: 0,
                viewportScale: linearScale([0, 20], [0, 100])
            }).sampled
        ).toBe(false);
    });

    it("counts fragmented defined marks through the prefix index", () => {
        const index = new CartesianDefinedSegmentIndex([
            { startIndex: 0, endIndexExclusive: 2 },
            { startIndex: 5, endIndexExclusive: 8 },
            { startIndex: 12, endIndexExclusive: 13 }
        ]);
        expect(index.countDefinedInSourceRange(1, 13)).toBe(5);
        const plan = planExactConnectedProjection({
            includeIndices: false,
            segmentIndex: index,
            segments: [
                { startIndex: 0, endIndexExclusive: 2 },
                { startIndex: 5, endIndexExclusive: 8 },
                { startIndex: 12, endIndexExclusive: 13 }
            ],
            totalCount: 13,
            visEnd: 13,
            visStart: 1
        });
        expect(plan.definedMarkCount).toBe(6);
        expect(plan.indices).toEqual([]);
    });

    it("keeps same-segment clipping anchors in an LTTB projection", () => {
        const scalar = buildScalarDensityData({
            data: Array.from({ length: 100 }, (_, x) => ({ x, y: Math.sin(x / 10) })),
            temporal: false,
            xField: "x",
            yField: "y"
        });
        const view = projectScalarIndexView({
            algorithm: "lttb",
            baseDomainMax: 60,
            baseDomainMin: 40,
            maxPoints: 10,
            plotSpanPx: 100,
            samplesPerPixel: 1,
            scalar,
            threshold: 0,
            viewportScale: linearScale([40, 60], [0, 100])
        });
        expect(view.indices).toContain(39);
        expect(view.indices).toContain(61);
        expect(view.indices!.length).toBeLessThanOrEqual(10);
    });

    it("activates the marker cap from radius-expanded candidates", () => {
        const u = Float64Array.from([
            ...Array.from({ length: 80 }, (_, i) => 0.1 + i * 0.004),
            ...Array.from({ length: 420 }, (_, i) => 0.51 + i * 0.0001)
        ]);
        const v = new Float64Array(u.length).fill(0.5);
        const projection = projectCartesianMarkerDensity({
            centerWindow: [0, 0, 0.5, 1],
            enabled: true,
            maxPoints: 100,
            maxVisualRadius: 20,
            plotHeight: 100,
            plotWidth: 100,
            samplesPerPixel: 1,
            spatialIndex: new CartesianSpatialDensityIndex(u, v),
            threshold: 2000
        });
        expect(projection.centerVisibleCount).toBe(80);
        expect(projection.renderCandidateCount).toBe(500);
        expect(projection.sampled).toBe(true);
        expect(projection.indices.length).toBeLessThanOrEqual(100);
    });

    it("reserves every fragmented segment before proportional LTTB growth", () => {
        const segments = [
            { count: 2, endIndexExclusive: 2, startIndex: 0 },
            { count: 2, endIndexExclusive: 5, startIndex: 3 },
            { count: 1000, endIndexExclusive: 1006, startIndex: 6 }
        ];
        expect(allocateSegmentBudgets(segments, 3)).toEqual([1, 1, 1]);
    });

    it("keeps a sparse stack member under the exact cap-two counterexample", () => {
        const group: CartesianStackGroup = {
            geometryType: "area",
            hasNegative: false,
            hasPositive: true,
            id: "g",
            mode: "normal",
            name: "G",
            seriesIds: ["a", "b"],
            xAxisId: "x",
            xKeys: [0, 50, 100],
            yAxisId: "y"
        };
        const runtime = buildStackGroupDensityRuntime(
            group,
            new Map([
                ["a", [stackEntry("a", 0, 0, 1), stackEntry("a", 1, 100, 1)]],
                ["b", [stackEntry("b", 2, 50, 1)]]
            ])
        );
        expect(runtime).not.toBeNull();
        const projection = computeSharedStackProjection({
            groupRuntime: runtime!,
            maxPoints: 2,
            plotSpanPx: 100,
            samplesPerPixel: 1,
            threshold: 0,
            viewportScale: linearScale([0, 100], [0, 100])
        });
        expect(projection.view.kind).toBe("keys");
        expect(projection.view.kind === "keys" ? projection.view.keys.has(50) : false).toBe(true);
        expect(projection.renderedCount).toBeLessThanOrEqual(2);
    });
});
