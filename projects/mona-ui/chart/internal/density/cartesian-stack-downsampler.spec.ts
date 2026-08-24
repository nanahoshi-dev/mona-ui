import { describe, expect, it } from "vitest";
import { CartesianScaleFactory } from "../scale/cartesian-scale-factory";
import type { CartesianStackEntry } from "../data/cartesian-stack-engine";
import type { CartesianStackMemberDensityRuntime } from "./cartesian-stack-density-runtime";
import {
    buildStackTimelineData,
    computeSharedStackProjection,
    computeSharedStackSampleIndices,
    selectCoverageAwareStackIndices
} from "./cartesian-stack-downsampler";
import { ChartDensityTracker } from "../layout/chart-density-instrumentation";

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
        expect(
            computeSharedStackSampleIndices({
                entriesBySeriesId: entries,
                plotSpanPx: 500,
                samplesPerPixel: 1,
                viewportScale: scale
            })
        ).toBeNull();
    });

    it("selects the same shared index set for every series in the group", () => {
        // The sampler produces one set applied to all layers by construction;
        // verify determinism and boundedness of that set here.
        const count = 40_000;
        const entries = new Map<string, readonly CartesianStackEntry[]>([
            ["a", makeEntries("a", count, i => Math.sin(i / 100) * 10 + 20)],
            ["b", makeEntries("b", count, i => -5)]
        ]);
        const first = computeSharedStackSampleIndices({
            entriesBySeriesId: entries,
            plotSpanPx: 600,
            samplesPerPixel: 1,
            viewportScale: scale
        });
        const second = computeSharedStackSampleIndices({
            entriesBySeriesId: entries,
            plotSpanPx: 600,
            samplesPerPixel: 1,
            viewportScale: scale
        });
        expect(first).not.toBeNull();
        expect(Array.from(first!).sort((x, y) => Number(x) - Number(y))).toEqual(
            Array.from(second!).sort((x, y) => Number(x) - Number(y))
        );

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
        const entries = new Map<string, readonly CartesianStackEntry[]>([
            ["a", a],
            ["b", b]
        ]);
        const selected = computeSharedStackSampleIndices({
            entriesBySeriesId: entries,
            plotSpanPx: 500,
            samplesPerPixel: 1,
            viewportScale: scale
        })!;
        expect(selected.has(spikeIndex)).toBe(true);
        expect(selected.has(21_000)).toBe(true);
    });

    it("keeps shared stack step selection bounded and source-adjacent", () => {
        const count = 20_000;
        const entries = new Map<string, readonly CartesianStackEntry[]>([
            ["a", makeEntries("a", count, i => Math.floor(i / 250) % 4)],
            ["b", makeEntries("b", count, i => 1)]
        ]);
        const projection = computeSharedStackProjection({
            entriesBySeriesId: entries,
            maxPoints: 120,
            plotSpanPx: 500,
            samplesPerPixel: 1,
            stepProtected: true,
            threshold: 0,
            viewportScale: scale
        });

        expect(projection.sampled).toBe(true);
        expect(projection.view.kind).toBe("keys");
        expect(projection.renderedCount).toBeLessThanOrEqual(120);
        expect(projection.view.kind === "keys" ? projection.view.keys.has(0) : false).toBe(true);
        expect(projection.view.kind === "keys" ? projection.view.keys.has(count - 1) : false).toBe(true);
    });

    it("accumulates totals from full layers before selection (never sampled-only)", () => {
        const count = 25_000;
        // Two layers each with modest values; combined positive peak at index k
        // would be invisible looking at either single layer.
        const peak = 15_000;
        const a = makeEntries("a", count, i => (i === peak ? 60 : 2));
        const b = makeEntries("b", count, i => (i === peak ? 80 : 3));
        const entries = new Map<string, readonly CartesianStackEntry[]>([
            ["a", a],
            ["b", b]
        ]);
        const selected = computeSharedStackSampleIndices({
            entriesBySeriesId: entries,
            plotSpanPx: 500,
            samplesPerPixel: 1,
            viewportScale: scale
        })!;
        expect(selected.has(peak)).toBe(true);
    });

    it("prebuilds retained timeline with positive and negative extrema indexes (SD-R17)", () => {
        const count = 20_000;
        const a = makeEntries("a", count, i => (i === 12_000 ? 500 : 10));
        const b = makeEntries("b", count, i => (i === 14_000 ? -400 : -5));
        const entries = new Map<string, readonly CartesianStackEntry[]>([
            ["a", a],
            ["b", b]
        ]);
        const timeline = import("./cartesian-stack-downsampler").then(m => m.buildStackTimelineData(entries));
        return timeline.then(t => {
            expect(t).not.toBeNull();
            expect(t!.dataIndices.length).toBe(count);
            const selected = computeSharedStackSampleIndices({
                plotSpanPx: 500,
                samplesPerPixel: 1,
                timeline: t,
                viewportScale: scale
            });
            expect(selected).not.toBeNull();
            expect(selected!.has(12_000)).toBe(true);
            expect(selected!.has(14_000)).toBe(true);
        });
    });

    it("uses canonical fallback X keys instead of local member data indices", () => {
        const entries: CartesianStackEntry[] = [
            {
                animationKey: "a-100",
                dataIndex: 0,
                datum: { x: 100, v: 1 },
                defined: true,
                rawValue: 1,
                stackEnd: 1,
                stackStart: 0,
                synthetic: false,
                visualValue: 1,
                xKey: 100,
                xValue: 100
            },
            {
                animationKey: "a-200",
                dataIndex: 1,
                datum: { x: 200, v: 2 },
                defined: true,
                rawValue: 2,
                stackEnd: 2,
                stackStart: 0,
                synthetic: false,
                visualValue: 2,
                xKey: 200,
                xValue: 200
            }
        ];
        const timeline = buildStackTimelineData(new Map([["a", entries]]));
        const localScale = CartesianScaleFactory.createExactPositionScale({
            domain: [100, 200],
            range: [0, 500],
            type: "linear"
        }) as never;

        const selected = computeSharedStackSampleIndices({
            maxPoints: 2,
            plotSpanPx: 500,
            samplesPerPixel: 1,
            threshold: 0,
            timeline,
            viewportScale: localScale
        });

        expect(selected).toEqual(new Set([100, 200]));
    });

    it("keeps stack coverage membership work bounded and measurable", () => {
        const memberCount = 50;
        const timelineLength = 250_000;
        const candidateCount = 4_000;
        const realTimelineIndices = Int32Array.from({ length: timelineLength }, (_, index) => index);
        const members = Array.from(
            { length: memberCount },
            (_, index) =>
                ({
                    realTimelineIndices,
                    seriesId: `member-${index}`
                }) as unknown as CartesianStackMemberDensityRuntime
        );
        const candidates = Array.from({ length: candidateCount }, (_, index) => ({
            coveredSeriesIds: [`member-${index % memberCount}`],
            index: Math.floor((index * timelineLength) / candidateCount),
            priority: index % 2 === 0 ? 900 : 700
        }));
        const tracker = ChartDensityTracker.install();
        try {
            const selected = selectCoverageAwareStackIndices(candidates, 2_000, members, 0, timelineLength);

            expect(selected).toHaveLength(2_000);
            const selectedCoverage = new Set(
                candidates
                    .filter(candidate => selected.includes(candidate.index))
                    .flatMap(candidate => candidate.coveredSeriesIds)
            );
            expect(selectedCoverage.size).toBe(memberCount);
            expect(tracker.snapshot.stackCoverageCandidateChecks).toBe(candidateCount);
            expect(tracker.snapshot.stackCoverageMemberSearches).toBe(memberCount * 2);
        } finally {
            ChartDensityTracker.uninstall();
        }
    });

    it("unions sparse member coverage when candidates share a timeline index", () => {
        const members = [
            { realTimelineIndices: Int32Array.from([5]), seriesId: "member-a" },
            { realTimelineIndices: Int32Array.from([5]), seriesId: "member-b" }
        ] as unknown as CartesianStackMemberDensityRuntime[];

        const selected = selectCoverageAwareStackIndices(
            [
                { coveredSeriesIds: ["member-a"], index: 5, priority: 900 },
                { coveredSeriesIds: ["member-b"], index: 5, priority: 700 }
            ],
            1,
            members,
            0,
            10
        );

        expect(selected).toEqual([5]);
    });
});
