import { describe, expect, it } from "vitest";
import { buildStackGroupDensityRuntime } from "./cartesian-stack-density-runtime";
import { computeSharedStackSampleIndices } from "./cartesian-stack-downsampler";
import { CartesianStackedAreaDenseInteractionProvider } from "./cartesian-stack-dense-interaction-provider";
import { CartesianScaleFactory } from "../scale/cartesian-scale-factory";
import type { ChartContinuousPositionScale } from "../scale/chart-scale";
import type { CartesianStackEntry, CartesianStackGroup } from "../data/cartesian-stack-engine";
import type { ChartAreaSeriesRegistration } from "../context/chart-registration-context";
import { defaultDownsamplingOptions } from "./chart-downsampling-options";

describe("Cartesian Stacked Area Density", () => {
    it("builds retained stack timeline keyed by semantic-X rather than raw index", () => {
        const count = 3_000;
        const entriesA: CartesianStackEntry[] = [];
        const entriesB: CartesianStackEntry[] = [];

        for (let i = 0; i < count; i++) {
            const x = i * 10;
            entriesA.push({
                animationKey: `a-${i}`,
                dataIndex: i,
                datum: { x, y: 10 },
                defined: true,
                rawValue: 10,
                stackEnd: 10,
                stackPercentage: 0.5,
                stackStart: 0,
                stackTotal: 20,
                synthetic: false,
                visualValue: 10,
                xKey: x,
                xValue: x
            });
            entriesB.push({
                animationKey: `b-${i}`,
                dataIndex: i,
                datum: { x, y: 10 },
                defined: true,
                rawValue: 10,
                stackEnd: 20,
                stackPercentage: 0.5,
                stackStart: 10,
                stackTotal: 20,
                synthetic: false,
                visualValue: 10,
                xKey: x,
                xValue: x
            });
        }

        const entriesBySeries = new Map<string, readonly CartesianStackEntry[]>([
            ["series-a", entriesA],
            ["series-b", entriesB]
        ]);

        const group: CartesianStackGroup = {
            geometryType: "area",
            hasNegative: false,
            hasPositive: true,
            id: "stack-g1",
            mode: "normal",
            name: "group 1",
            seriesIds: ["series-a", "series-b"],
            xAxisId: "x-main",
            xKeys: entriesA.map(e => e.xKey),
            yAxisId: "y-main"
        };

        const mockSeriesA: ChartAreaSeriesRegistration = { id: "series-a", type: "area" } as unknown as ChartAreaSeriesRegistration;
        const mockSeriesB: ChartAreaSeriesRegistration = { id: "series-b", type: "area" } as unknown as ChartAreaSeriesRegistration;

        const runtime = buildStackGroupDensityRuntime(
            group,
            entriesBySeries,
            [mockSeriesA, mockSeriesB],
            defaultDownsamplingOptions
        );

        expect(runtime).not.toBeNull();
        expect(runtime?.timeline.xKeys).toHaveLength(count);
        expect(runtime?.timeline.xNumeric[0]).toBe(0);
        expect(runtime?.timeline.xNumeric[count - 1]).toBe((count - 1) * 10);
        expect(runtime?.timeline.positiveExtrema.queryRange(0, count).maxIndex).toBeGreaterThanOrEqual(0);

        const xScale = CartesianScaleFactory.createExactPositionScale({
            domain: [0, (count - 1) * 10],
            range: [0, 500],
            type: "linear"
        });

        const selected = computeSharedStackSampleIndices({
            plotSpanPx: 500,
            samplesPerPixel: 1,
            threshold: 1000,
            timeline: runtime!.timeline,
            viewportScale: xScale as ChartContinuousPositionScale<number | Date>
        });

        expect(selected).not.toBeNull();
        expect(selected!.size).toBeLessThan(count);
        expect(selected!.has(0)).toBe(true);
        expect(selected!.has((count - 1) * 10)).toBe(true);

        const provider = new CartesianStackedAreaDenseInteractionProvider({
            groupRuntime: runtime!,
            series: mockSeriesA,
            seriesDisplayName: "Series A",
            xAxisId: "x-main",
            xScale: xScale as ChartContinuousPositionScale<number | Date>,
            yAxisId: "y-main",
            yScale: CartesianScaleFactory.createExactPositionScale({ domain: [0, 30], range: [100, 0], type: "linear" }) as ChartContinuousPositionScale<number>
        });

        const hit = provider.materializeAt(5);
        expect(hit).not.toBeNull();
        expect(hit?.xKey).toBe(50);
        expect(hit?.stackGroup).toBe("group 1");
        expect(hit?.stackTotal).toBe(20);
    });
});
