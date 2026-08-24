import { describe, expect, it } from "vitest";
import { CartesianScaleFactory, LinearScale } from "../scale/cartesian-scale-factory";
import { formatTimeRange } from "../utils/chart-formatter";
import { buildRangeDensityData, buildScalarDensityData } from "./cartesian-density-preparer";
import { projectSegmentedLttb } from "./cartesian-density-projector";
import { CartesianConnectedPathInteractionProvider } from "./cartesian-dense-interaction-provider";
import { createDenseHitMaterializer } from "./cartesian-dense-hit-materializer";
import { CartesianMinMaxBlockIndex } from "./cartesian-minmax-block-index";
import { projectCartesianMarkerDensity } from "./cartesian-marker-density-projector";
import { CartesianRangeAreaDenseInteractionProvider } from "./cartesian-range-dense-interaction-provider";
import { resolveRangeTemporalXValue } from "./cartesian-range-temporal";
import { CartesianSpatialDensityIndex } from "./cartesian-spatial-density-index";
import { resolveRangeAreaHitGeometry } from "../layout/cartesian-range-hit-geometry";

function linearScale(domain: readonly [number, number], range: readonly [number, number] = [0, 100]) {
    return new LinearScale([...domain], [...range]);
}

describe("Cartesian Density Source Order and Formatter Regressions", () => {
    it("keeps summarized first/last source-order facts independent of extrema visitation", () => {
        const values = new Float64Array(768).fill(Number.NaN);
        values[260] = 5;
        values[350] = 100;
        values[400] = -100;
        values[500] = 6;

        const result = new CartesianMinMaxBlockIndex(values, 256).queryRange(10, 700);

        expect(result).toMatchObject({
            firstValidIndex: 260,
            lastValidIndex: 500,
            maxIndex: 350,
            minIndex: 400
        });
    });

    it("retains marker candidates in normalized space outside the base unit extent", () => {
        const spatialIndex = new CartesianSpatialDensityIndex(
            Float64Array.from([-0.05, 0.5, 1.05]),
            Float64Array.from([0.5, 0.5, 0.5])
        );

        const projection = projectCartesianMarkerDensity({
            centerWindow: [-0.1, 0, 1.2, 1],
            enabled: true,
            maxPoints: null,
            maxVisualRadius: 0,
            plotHeight: 100,
            plotWidth: 100,
            samplesPerPixel: 1,
            spatialIndex,
            threshold: 2_000
        });

        expect(projection.centerVisibleCount).toBe(3);
        expect(projection.renderCandidateCount).toBe(3);
        expect(projection.indices).toEqual([0, 1, 2]);
    });

    it("reserves global LTTB clipping anchors before fragment budgets", () => {
        const scalar = buildScalarDensityData({
            data: Array.from({ length: 121 }, (_, index) => ({
                x: index,
                y: index === 60 ? null : index
            })),
            temporal: false,
            xField: "x",
            yField: "y"
        });

        const indices = projectSegmentedLttb({
            budget: 2,
            clipLeft: 9,
            clipRight: 110,
            connectNulls: false,
            maxPoints: 2,
            nextBracket: null,
            pixelSpan: 100,
            plotSpanPx: 100,
            prevBracket: null,
            samplesPerPixel: 1,
            scalar,
            viewportScale: linearScale([10, 109]),
            visEnd: 110,
            visStart: 10
        });

        expect(indices).toEqual([9, 110]);
        expect(indices.length).toBeLessThanOrEqual(2);
    });

    it("preserves dense series formatter precedence and UTC category semantics", () => {
        const instant = new Date("2026-01-02T03:04:05.000Z");
        const scalar = buildScalarDensityData({
            data: [{ x: instant, y: 42 }],
            temporal: true,
            xField: "x",
            yField: "y"
        });
        const xScale = CartesianScaleFactory.createExactPositionScale({
            domain: [new Date("2026-01-01T00:00:00.000Z"), new Date("2026-01-03T00:00:00.000Z")],
            range: [0, 100],
            type: "utc"
        });
        const yScale = linearScale([0, 100], [100, 0]);
        const target = createDenseHitMaterializer({
            scalar,
            seriesDisplayName: "Area",
            seriesId: "area",
            seriesType: "area",
            valueFormatter: () => "SERIES",
            xAxisId: "x-main",
            xAxisType: "utc",
            xScale: xScale as never,
            xTimeSpanMs: 2 * 86400000,
            yAxisFormatter: () => "AXIS",
            yAxisId: "y-main",
            yScale: yScale as never
        })(0);

        expect(target?.formattedValue).toBe("SERIES");
        expect(target?.formattedCategory).toBe(formatTimeRange(instant, 2 * 86400000, true));
    });

    it("shares range hit geometry for hidden and visible points", () => {
        expect(resolveRangeAreaHitGeometry(false, 60)).toEqual({ hitRadius: 16, visualRadius: 0 });
        expect(resolveRangeAreaHitGeometry(true, 60)).toEqual({ hitRadius: 64, visualRadius: 60 });
    });

    it("rejects numeric-looking temporal range strings in structural density data", () => {
        const range = buildRangeDensityData({
            data: [
                { from: 1, high: 2, x: "1" },
                { from: 2, high: 3, x: "2026-01-02T00:00:00.000Z" }
            ],
            fromField: "from",
            temporal: true,
            toField: "high",
            xField: "x"
        });

        expect(resolveRangeTemporalXValue("1")).toBeNull();
        expect(range.segmentIds[0]).toBe(-1);
        expect(range.segmentIds[1]).toBeGreaterThanOrEqual(0);

        const provider = new CartesianRangeAreaDenseInteractionProvider({
            range,
            series: { id: "range" } as never,
            seriesDisplayName: "Range",
            xAxisId: "x-main",
            xScale: CartesianScaleFactory.createExactPositionScale({
                domain: [new Date("2026-01-01T00:00:00.000Z"), new Date("2026-01-03T00:00:00.000Z")],
                range: [0, 100],
                type: "utc"
            }) as never,
            yAxisId: "y-main",
            yScale: linearScale([0, 4], [100, 0]) as never
        });
        expect(provider.materializeAt(0)).toBeNull();
    });

    it("uses exact current pixel geometry after dense brush discovery", () => {
        const data = [
            { x: 600_000_000_000, y: 0.5 },
            { x: 600_000_000_020, y: 0.5 }
        ];
        const scalar = buildScalarDensityData({ data, temporal: false, xField: "x", yField: "y" });
        const xScale = linearScale([0, 1_000_000_000_000]);
        const yScale = linearScale([0, 1], [100, 0]);
        const provider = new CartesianConnectedPathInteractionProvider({
            materialize: createDenseHitMaterializer({
                scalar,
                seriesDisplayName: "Line",
                seriesId: "line",
                seriesType: "line",
                xAxisId: "x-main",
                xAxisType: "linear",
                xScale: xScale as never,
                yAxisId: "y-main",
                yScale: yScale as never
            }),
            scalar,
            xScale: xScale as never,
            yScale: yScale as never
        });

        const matches = provider.queryRange({
            pixelA: { x: 40, y: 0 },
            pixelB: { x: 60, y: 100 }
        });

        expect(matches.map(match => match.index)).toEqual([0]);
    });
});
