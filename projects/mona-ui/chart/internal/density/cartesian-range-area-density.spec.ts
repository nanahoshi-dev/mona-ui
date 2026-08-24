import { describe, expect, it } from "vitest";
import { buildRangeDensityData } from "./cartesian-density-preparer";
import { projectRangeEnvelopeIndexView } from "./cartesian-density-projector";
import { CartesianRangeAreaDenseInteractionProvider } from "./cartesian-range-dense-interaction-provider";
import { CartesianScaleFactory } from "../scale/cartesian-scale-factory";
import type { ChartRangeAreaSeriesRegistration } from "../context/chart-registration-context";

describe("Cartesian Range Area Density", () => {
    it("builds range density data with lowExtrema and highExtrema indexes", () => {
        const data = [
            { from: 10, to: 20, x: 0 },
            { from: 5, to: 15, x: 1 }, // min is 5
            { from: 25, to: 30, x: 2 }, // max is 30
            { from: 12, to: 22, x: 3 }
        ];

        const range = buildRangeDensityData({
            data,
            fromField: "from",
            temporal: false,
            toField: "to",
            xField: "x"
        });

        expect(range.x).toHaveLength(4);
        expect(range.combinedMin[1]).toBe(5);
        expect(range.combinedMax[2]).toBe(30);

        const lowMin = range.lowExtremaIndex.queryRange(0, 4);
        expect(lowMin.minIndex).toBe(1);

        const highMax = range.highExtremaIndex.queryRange(0, 4);
        expect(highMax.maxIndex).toBe(2);
    });

    it("projects range envelope indices preserving both low and high extrema per bucket", () => {
        const count = 5_000;
        const data = new Array(count);
        for (let i = 0; i < count; i++) {
            data[i] = {
                from: Math.sin(i / 50) * 20 + 30,
                to: Math.sin(i / 50) * 20 + 50,
                x: i
            };
        }

        const range = buildRangeDensityData({
            data,
            fromField: "from",
            temporal: false,
            toField: "to",
            xField: "x"
        });

        const scale = CartesianScaleFactory.createExactPositionScale({
            domain: [0, count - 1],
            range: [0, 500],
            type: "linear"
        });

        const envelope = projectRangeEnvelopeIndexView({
            baseDomainMax: count - 1,
            baseDomainMin: 0,
            maxPoints: 1000,
            plotSpanPx: 500,
            range,
            samplesPerPixel: 1,
            viewportScale: scale as any
        });

        expect(envelope.sampled).toBe(true);
        expect(envelope.indices).not.toBeNull();
        expect(envelope.indices!.length).toBeLessThan(count);
        expect(envelope.indices![0]).toBe(0);
        expect(envelope.indices![envelope.indices!.length - 1]).toBe(count - 1);
    });

    it("CartesianRangeAreaDenseInteractionProvider resolves nearest and range queries accurately", () => {
        const data = [
            { from: 10, to: 20, x: 100 },
            { from: 20, to: 40, x: 200 },
            { from: 15, to: 35, x: 300 }
        ];

        const range = buildRangeDensityData({
            data,
            fromField: "from",
            temporal: false,
            toField: "to",
            xField: "x"
        });

        const xScale = CartesianScaleFactory.createExactPositionScale({
            domain: [0, 400],
            range: [0, 400],
            type: "linear"
        });

        const yScale = CartesianScaleFactory.createExactPositionScale({
            domain: [0, 50],
            range: [100, 0],
            type: "linear"
        });

        const mockSeries: ChartRangeAreaSeriesRegistration = {
            data: () => data,
            fromField: () => "from",
            id: "range-series-1",
            toField: () => "to",
            type: "rangeArea",
            visible: () => true
        } as any;

        const provider = new CartesianRangeAreaDenseInteractionProvider({
            range,
            series: mockSeries,
            seriesDisplayName: "Range Area 1",
            xAxisId: "x-main",
            xScale: xScale as any,
            yAxisId: "y-main",
            yScale: yScale as any
        });

        const hit = provider.materializeAt(1);
        expect(hit).not.toBeNull();
        expect(hit?.fromValue).toBe(20);
        expect(hit?.toValue).toBe(40);
        expect(hit?.seriesId).toBe("range-series-1");

        const nearest = provider.resolveNearest({ pixel: { x: 205, y: 50 } });
        expect(nearest).toHaveLength(1);
        expect(nearest[0].index).toBe(1);

        const rangeHits = provider.queryRange({
            hitPolicy: "intersect",
            pixelA: { x: 150, y: 0 },
            pixelB: { x: 250, y: 100 }
        });
        expect(rangeHits).toHaveLength(1);
        expect(rangeHits[0].index).toBe(1);
    });
});
