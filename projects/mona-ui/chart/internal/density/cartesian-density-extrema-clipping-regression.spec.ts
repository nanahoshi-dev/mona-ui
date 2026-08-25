import { describe, expect, it } from "vitest";
import type { NormalizedChartDownsamplingOptions } from "./chart-downsampling-options";
import { buildRangeDensityData, buildScalarDensityData } from "./cartesian-density-preparer";
import {
    projectRangeEnvelopeIndexView,
    projectScalarIndexView,
    selectConnectedCandidatesUnderBudget
} from "./cartesian-density-projector";
import { resolveDensityRetention } from "./cartesian-density-runtime";
import { resolveSemanticNumericRun } from "./cartesian-semantic-key";
import { LinearScale } from "../scale/cartesian-scale-factory";

const policy: NormalizedChartDownsamplingOptions = {
    algorithm: "auto",
    enabled: true,
    maxPoints: null,
    samplesPerPixel: 1,
    threshold: null
};

function scalarFromValues(values: readonly (number | null)[]) {
    return buildScalarDensityData({
        data: values.map((y, index) => ({ x: index, y })),
        temporal: false,
        xField: "x",
        yField: "y"
    });
}

function scale(domain: readonly [number, number], span = 800): LinearScale {
    return new LinearScale([...domain], [0, span]);
}

describe("Cartesian Density Fragmented Extrema and Clipping Anchor Regressions", () => {
    it("retains searchable source work even when only a sparse subset is defined", () => {
        expect(resolveDensityRetention(1_000_000, true, policy, 800)).toEqual({
            reason: "eligible-source-work",
            retain: true
        });
        expect(resolveDensityRetention(50, false, policy, 800)).toEqual({
            reason: "unsearchable",
            retain: false
        });
        expect(resolveDensityRetention(50, true, { ...policy, maxPoints: 25, threshold: 2000 }, 800).retain).toBe(true);
    });

    it("queries fragmented scalar extrema globally instead of selecting segment ordinals first", () => {
        const values: (number | null)[] = [];
        for (let segment = 0; segment < 5000; segment++) {
            values.push(segment === 1 ? 100_000 : segment === 7 ? -100_000 : 1);
            values.push(null);
        }
        const scalar = scalarFromValues(values);
        const view = projectScalarIndexView({
            algorithm: "minmax",
            baseDomainMax: values.length - 1,
            baseDomainMin: 0,
            maxPoints: null,
            plotSpanPx: 800,
            samplesPerPixel: 1,
            scalar,
            threshold: 0,
            viewportScale: scale([0, values.length - 1])
        });

        expect(view.sampled).toBe(true);
        expect(view.indices).toContain(2);
        expect(view.indices).toContain(14);
    });

    it("queries fragmented range extrema globally for both low and high envelope extremes", () => {
        const data = Array.from({ length: 10_000 }, (_, index) => {
            const segment = Math.floor(index / 2);
            return index % 2 === 1
                ? { from: null, to: null, x: index }
                : {
                      from: segment === 7 ? -100_000 : 0,
                      to: segment === 1 ? 100_000 : 1,
                      x: index
                  };
        });
        const range = buildRangeDensityData({
            data,
            fromField: "from",
            temporal: false,
            toField: "to",
            xField: "x"
        });
        const view = projectRangeEnvelopeIndexView({
            baseDomainMax: data.length - 1,
            baseDomainMin: 0,
            maxPoints: null,
            plotSpanPx: 800,
            range,
            samplesPerPixel: 1,
            threshold: 0,
            viewportScale: scale([0, data.length - 1])
        });

        expect(view.sampled).toBe(true);
        expect(view.indices).toContain(2);
        expect(view.indices).toContain(14);
    });

    it("reserves both scalar clipping anchors under a two-point cap", () => {
        const scalar = scalarFromValues([1, 2, 3]);
        const view = projectScalarIndexView({
            algorithm: "minmax",
            baseDomainMax: 100,
            baseDomainMin: 0,
            maxPoints: 2,
            plotSpanPx: 200,
            samplesPerPixel: 1,
            scalar: buildScalarDensityData({
                data: [
                    { x: 40, y: 1 },
                    { x: 50, y: 2 },
                    { x: 60, y: 3 }
                ],
                temporal: false,
                xField: "x",
                yField: "y"
            }),
            threshold: 0,
            viewportScale: scale([41, 59], 200)
        });

        expect(view.indices).toEqual([0, 2]);
        expect(view.renderedCount).toBe(2);
        expect(scalar.validCount).toBe(3);
    });

    it("reserves both range clipping anchors under a two-point cap", () => {
        const data = [
            { from: 1, to: 2, x: 40 },
            { from: 2, to: 3, x: 50 },
            { from: 3, to: 4, x: 60 }
        ];
        const range = buildRangeDensityData({
            data,
            fromField: "from",
            temporal: false,
            toField: "to",
            xField: "x"
        });
        const view = projectRangeEnvelopeIndexView({
            baseDomainMax: 100,
            baseDomainMin: 0,
            maxPoints: 2,
            plotSpanPx: 200,
            range,
            samplesPerPixel: 1,
            threshold: 0,
            viewportScale: scale([41, 59], 200)
        });

        expect(view.indices).toEqual([0, 2]);
        expect(view.renderedCount).toBe(2);
    });

    it("keeps LTTB clipping anchors when the in-window set appears to fit", () => {
        const scalar = scalarFromValues(Array.from({ length: 12 }, (_, index) => index));
        const view = projectScalarIndexView({
            algorithm: "lttb",
            baseDomainMax: 11,
            baseDomainMin: 0,
            maxPoints: 10,
            plotSpanPx: 800,
            samplesPerPixel: 1,
            scalar,
            threshold: 0,
            viewportScale: scale([1, 10])
        });

        expect(view.indices).toContain(0);
        expect(view.indices).toContain(11);
        expect(view.renderedCount).toBeLessThanOrEqual(10);
    });

    it("deduplicates connected roles while reserving required anchors", () => {
        const selected = selectConnectedCandidatesUnderBudget(
            [
                { defined: true, index: 0, priority: 600, reason: "bucket-edge", roles: ["bucket-first"] },
                { defined: true, index: 0, priority: 950, reason: "clip-left", roles: ["clip-left"] },
                { defined: true, index: 5, priority: 800, reason: "visible-extremum", roles: ["max-extremum"] },
                { defined: true, index: 10, priority: 950, reason: "clip-right", roles: ["clip-right"] }
            ],
            2,
            {
                connectNulls: false,
                requiredAnchorIndices: [0, 10],
                segmentIds: Int32Array.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
            }
        );

        expect(selected).toEqual([0, 10]);
    });

    it("resolves predecessor round trips, exact matches, duplicate runs, and ambiguity consistently", () => {
        const predecessor = resolveSemanticNumericRun(Float64Array.from([0.3, 0.4]), "ascending", 0.30000000000000004);
        expect(predecessor?.canonicalValue).toBe(0.3);
        expect(predecessor?.startIndex).toBe(0);

        const largeValueA = 1_000_000_000;
        const largeValueB = 1_000_000_000.000001;
        const exact = resolveSemanticNumericRun(
            Float64Array.from([largeValueA, largeValueB]),
            "ascending",
            largeValueB
        );
        expect(exact?.canonicalValue).toBe(largeValueB);

        const duplicates = resolveSemanticNumericRun(Float64Array.from([0.3, 0.3, 0.4]), "non-decreasing", 0.3);
        expect(duplicates).toMatchObject({ endIndexExclusive: 2, startIndex: 0 });

        expect(resolveSemanticNumericRun(Float64Array.from([0, 1e-14]), "ascending", 5e-15)).toBeNull();
    });
});
