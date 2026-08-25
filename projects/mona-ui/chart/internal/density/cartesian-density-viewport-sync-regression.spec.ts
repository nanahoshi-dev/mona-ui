import { describe, expect, it } from "vitest";
import type { ChartViewportState } from "../../models/chart-viewport.models";
import { CartesianScaleFactory, TimeScale } from "../scale/cartesian-scale-factory";
import { ChartSynchronizationAxisMapper } from "../synchronization/chart-synchronization-axis-mapper";
import type { ChartSynchronizationViewportMessage } from "../synchronization/chart-synchronization-types";
import { ChartDensityTracker } from "../layout/chart-density-instrumentation";
import { CartesianAxisCoordinateSpace } from "../viewport/cartesian-axis-coordinate-space";
import {
    computeSourceNormalizedWindow,
    mapContinuousDomainWindow,
    mapContinuousRelativeWindow
} from "../viewport/cartesian-viewport-semantic-mapper";
import type { CartesianAxisCoordinateSnapshot } from "../viewport/cartesian-axis-coordinate-space";
import {
    areAxisViewportsEqual,
    areViewportStatesEqual,
    normalizeViewportState,
    type InternalAxisViewport,
    type ResolvedAxisInfoMap
} from "../viewport/cartesian-viewport-normalizer";
import { buildScalarDensityData } from "./cartesian-density-preparer";
import { CartesianConnectedPathInteractionProvider } from "./cartesian-dense-interaction-provider";
import { projectCartesianMarkerDensity } from "./cartesian-marker-density-projector";
import { CartesianSpatialDensityIndex } from "./cartesian-spatial-density-index";

function linearSnapshot(
    axisId: string,
    domain: readonly [number, number],
    range: readonly [number, number] = [0, 400]
): CartesianAxisCoordinateSnapshot {
    const scale = CartesianScaleFactory.createExactPositionScale({
        domain: [...domain],
        range: [...range],
        type: "linear"
    });
    return {
        baseDomain: domain,
        baseScale: scale,
        range,
        ref: { axis: "x", axisId },
        resolvedType: "linear",
        valid: true,
        viewportDomain: domain,
        viewportScale: scale
    };
}

function continuousWindow(axisId: string, min: number, max: number): InternalAxisViewport {
    return { axis: "x", axisId, kind: "continuous", max, min };
}

function viewportMessage(
    axes: ChartSynchronizationViewportMessage["axes"],
    mode: "domain" | "relative" = "domain"
): ChartSynchronizationViewportMessage {
    return {
        axes,
        group: "r15",
        kind: "viewport",
        originMemberId: "source",
        phase: "end",
        sequence: 1,
        source: "programmatic",
        transactionId: `r15-${mode}`
    };
}

const synchronizationOptions = {
    axisMappings: [],
    crosshair: {
        axes: "auto" as const,
        clearOnLeave: true,
        enabled: true,
        match: "axis-value" as const,
        mode: "domain" as const,
        showTooltip: false
    },
    group: "r15",
    viewport: { axes: "auto" as const, enabled: true, mode: "relative" as const, phase: "continuous" as const }
};

describe("Cartesian Density Viewport Synchronization Regressions", () => {
    it("keeps full marker projection membership identical to exact candidate count", () => {
        const spatialIndex = new CartesianSpatialDensityIndex(
            Float64Array.from([0, 5e-10]),
            Float64Array.from([0.5, 0.5])
        );

        const projection = projectCartesianMarkerDensity({
            centerWindow: [0, 0.4, 1e-12, 0.2],
            enabled: true,
            maxPoints: null,
            maxVisualRadius: 0,
            plotHeight: 100,
            plotWidth: 100,
            samplesPerPixel: 1,
            spatialIndex,
            threshold: 1_000
        });

        expect(projection.renderCandidateCount).toBe(1);
        expect(projection.algorithm).toBe("full");
        expect(projection.indices).toEqual([0]);
    });

    it("never lets a tolerance-near off-window representative consume the sample budget", () => {
        const spatialIndex = new CartesianSpatialDensityIndex(
            Float64Array.from([5e-10, 0]),
            Float64Array.from([0.5, 0.5])
        );

        const projection = projectCartesianMarkerDensity({
            centerWindow: [0, 0.4, 1e-12, 0.2],
            enabled: true,
            maxPoints: 1,
            maxVisualRadius: 0,
            plotHeight: 100,
            plotWidth: 100,
            samplesPerPixel: 1,
            spatialIndex,
            threshold: 0
        });

        expect(projection.algorithm).toBe("pixel");
        expect(projection.indices).toEqual([1]);
    });

    it("keeps exact count and collection membership identical for tiny normalized windows", () => {
        const spatialIndex = new CartesianSpatialDensityIndex(
            Float64Array.from([-1e-12, 0, 5e-10, 1e-12]),
            Float64Array.from([0.5, 0.5, 0.5, 0.5])
        );
        const windows: readonly (readonly [number, number, number, number])[] = [
            [0, 0.49, 1e-12, 0.02],
            [-1e-12, 0.49, 2e-12, 0.02],
            [5e-10, 0.49, 1e-20, 0.02]
        ];

        for (const window of windows) {
            const count = spatialIndex.countPointsInWindow(window);
            const collected = spatialIndex.collectIndicesInWindow(window, count);
            expect(collected).not.toBeNull();
            expect(collected?.length).toBe(count);
        }
    });

    it("keeps tiny partial public viewports and observes deep endpoint changes", () => {
        const axes: ResolvedAxisInfoMap = {
            x: new Map([["tiny", { baseDomain: [0, 1e-12], resolvedType: "linear" }]]),
            y: new Map()
        };
        const partial: ChartViewportState = {
            axes: [{ axis: "x", axisId: "tiny", kind: "continuous", max: 5e-13, min: 0 }]
        };
        const shifted: ChartViewportState = {
            axes: [{ axis: "x", axisId: "tiny", kind: "continuous", max: 1.5e-12, min: 5e-13 }]
        };
        const normalizedPartial = normalizeViewportState(partial, axes, { clampToData: false });
        const normalizedShifted = normalizeViewportState(shifted, axes, { clampToData: false });
        const partialWindow = normalizedPartial.x.get("tiny");
        const shiftedWindow = normalizedShifted.x.get("tiny");

        expect(partialWindow).toBeDefined();
        expect(shiftedWindow).toBeDefined();
        expect(areAxisViewportsEqual(partialWindow, shiftedWindow)).toBe(false);
        expect(areViewportStatesEqual(partial, shifted)).toBe(false);
    });

    it("does not canonicalize a half-domain continuous link as full domain", () => {
        const source = linearSnapshot("source", [0, 1e-12]);
        const target = linearSnapshot("target", [0, 1e-12]);
        const mapped = mapContinuousDomainWindow(
            continuousWindow("source", 0, 5e-13),
            source,
            target,
            { clampToData: false },
            { diagnosticScope: "r15", warned: new Set() }
        );

        expect(mapped).toBeDefined();
        expect(mapped?.kind).toBe("continuous");
    });

    it("maps tiny normalized relative positions through the unit mapper", () => {
        const target = linearSnapshot("target", [0, 1e20], [50, 650]);
        const mapped = mapContinuousRelativeWindow({ u0: 1e-20, u1: 2e-20 }, target, { clampToData: false });

        expect(mapped?.kind).toBe("continuous");
        if (mapped?.kind === "continuous") {
            expect(mapped.min).toBeCloseTo(1, 12);
            expect(mapped.max).toBeCloseTo(2, 12);
        }
    });

    it("preserves off-domain source normalized positions when relative links do not clamp", () => {
        const source = linearSnapshot("source", [0, 100]);
        const target = linearSnapshot("target", [0, 1_000]);
        const sourceWindow = continuousWindow("source", -10, 50);
        const normalized = computeSourceNormalizedWindow(sourceWindow, source);
        const mapped = mapContinuousRelativeWindow(normalized, target, { clampToData: false });

        expect(normalized.u0).toBeCloseTo(-0.1, 12);
        expect(normalized.u1).toBeCloseTo(0.5, 12);
        expect(mapped?.kind).toBe("continuous");
        if (mapped?.kind === "continuous") {
            expect(mapped.min).toBeCloseTo(-100, 12);
            expect(mapped.max).toBeCloseTo(500, 12);
        }
    });

    it("reports a deep relative sync delta instead of treating it as equal", () => {
        const coordinateSpace = new CartesianAxisCoordinateSpace(
            new Map([["target", linearSnapshot("target", [0, 1])]]),
            new Map()
        );
        const existing = new Map([["target", continuousWindow("target", 0, 1e-12)]]);
        const result = ChartSynchronizationAxisMapper.mapIncomingAxes(
            viewportMessage(
                [
                    {
                        normalizedWindow: [5e-13, 1.5e-12],
                        sourceRef: { axis: "x", axisId: "source" },
                        sourceType: "linear",
                        window: { axis: "x", axisId: "source", kind: "continuous", max: 1.5e-12, min: 5e-13 }
                    }
                ],
                "relative"
            ),
            coordinateSpace,
            synchronizationOptions,
            { x: existing, y: new Map() },
            { x: "source", y: "y" },
            { clampToData: false },
            new Set()
        );

        expect(result.changedAxes).toEqual([{ axis: "x", axisId: "target" }]);
    });

    it("keeps dense brush candidate work near the actual tiny-domain interval", () => {
        const count = 100_000;
        const data = Array.from({ length: count }, (_, index) => ({ x: (index / (count - 1)) * 1e-12, y: 0.5 }));
        const scalar = buildScalarDensityData({
            buildGeometryIndex: false,
            data,
            temporal: false,
            xField: "x",
            yField: "y"
        });
        const xScale = CartesianScaleFactory.createExactPositionScale({
            domain: [0, 1e-12],
            range: [0, 1_000],
            type: "linear"
        });
        const yScale = CartesianScaleFactory.createExactPositionScale({
            domain: [0, 1],
            range: [100, 0],
            type: "linear"
        });
        const provider = new CartesianConnectedPathInteractionProvider({
            materialize: index => ({
                animationKey: `r15-${index}`,
                datum: data[index],
                index,
                seriesId: "r15-line",
                seriesName: "R15",
                seriesType: "line",
                xKey: scalar.x[index],
                xValue: scalar.x[index],
                yValue: scalar.y[index]
            }),
            scalar,
            xScale: xScale as never,
            yScale: yScale as never
        });

        const tracker = ChartDensityTracker.install();
        try {
            const hits = provider.queryRange({ pixelA: { x: 400, y: 0 }, pixelB: { x: 450, y: 100 } });
            expect(hits.length).toBeGreaterThan(0);
            expect(tracker.snapshot.denseRawHitCandidatesVisited).toBeLessThan(count / 10);
        } finally {
            ChartDensityTracker.uninstall();
        }
    });

    it("keeps descending, duplicate, and pixel-edge brush membership exact", () => {
        const data = [
            { x: 3.9, y: 0.5 },
            { x: 4, y: 0.5 },
            { x: 4, y: 0.5 },
            { x: 5, y: 0.5 },
            { x: 6, y: 0.5 },
            { x: 6, y: 0.5 },
            { x: 6.1, y: 0.5 }
        ];
        const scalar = buildScalarDensityData({ data, temporal: false, xField: "x", yField: "y" });
        const xScale = CartesianScaleFactory.createExactPositionScale({
            domain: [0, 10],
            range: [0, 100],
            type: "linear"
        });
        const yScale = CartesianScaleFactory.createExactPositionScale({
            domain: [0, 1],
            range: [100, 0],
            type: "linear"
        });
        const provider = new CartesianConnectedPathInteractionProvider({
            materialize: index => ({
                animationKey: `r15-edge-${index}`,
                datum: data[index],
                index,
                seriesId: "r15-edge",
                seriesName: "R15 edge",
                seriesType: "line",
                xKey: scalar.x[index],
                xValue: scalar.x[index],
                yValue: scalar.y[index]
            }),
            scalar,
            xScale: xScale as never,
            yScale: yScale as never
        });

        const edgeHits = provider.queryRange({ pixelA: { x: 40, y: 0 }, pixelB: { x: 60, y: 100 } });
        expect(edgeHits.map(hit => hit.index)).toEqual([1, 2, 3, 4, 5]);

        const descendingData = Array.from({ length: 11 }, (_, index) => ({ x: 10 - index, y: 0.5 }));
        const descendingScalar = buildScalarDensityData({
            data: descendingData,
            temporal: false,
            xField: "x",
            yField: "y"
        });
        const descendingProvider = new CartesianConnectedPathInteractionProvider({
            materialize: index => ({
                animationKey: `r15-desc-${index}`,
                datum: descendingData[index],
                index,
                seriesId: "r15-desc",
                seriesName: "R15 descending",
                seriesType: "line",
                xKey: descendingScalar.x[index],
                xValue: descendingScalar.x[index],
                yValue: descendingScalar.y[index]
            }),
            scalar: descendingScalar,
            xScale: xScale as never,
            yScale: yScale as never
        });

        const descendingHits = descendingProvider.queryRange({ pixelA: { x: 40, y: 0 }, pixelB: { x: 60, y: 100 } });
        expect(descendingHits.map(hit => hit.index)).toEqual([4, 5, 6]);
    });

    it("keeps temporal brush discovery bounded and tiny Y ranges pixel-authoritative", () => {
        const epoch = 1_000_000_000_000;
        const temporalData = Array.from({ length: 1_001 }, (_, index) => ({ x: epoch + index, y: 0.5 }));
        const temporalScalar = buildScalarDensityData({ data: temporalData, temporal: true, xField: "x", yField: "y" });
        const temporalProvider = new CartesianConnectedPathInteractionProvider({
            materialize: index => ({
                animationKey: `r15-time-${index}`,
                datum: temporalData[index],
                index,
                seriesId: "r15-time",
                seriesName: "R15 time",
                seriesType: "line",
                xKey: temporalScalar.x[index],
                xValue: temporalScalar.x[index],
                yValue: temporalScalar.y[index]
            }),
            scalar: temporalScalar,
            xScale: new TimeScale([new Date(epoch), new Date(epoch + 1_000)], [0, 1_000]),
            yScale: CartesianScaleFactory.createExactPositionScale({
                domain: [0, 1],
                range: [100, 0],
                type: "linear"
            }) as never
        });

        const tracker = ChartDensityTracker.install();
        try {
            const temporalHits = temporalProvider.queryRange({ pixelA: { x: 400, y: 0 }, pixelB: { x: 450, y: 100 } });
            expect(temporalHits).toHaveLength(51);
            expect(tracker.snapshot.denseRawHitCandidatesVisited).toBeLessThan(100);
        } finally {
            ChartDensityTracker.uninstall();
        }

        const tinyYData = Array.from({ length: 11 }, (_, index) => ({ x: index, y: index * 1e-16 }));
        const tinyYScalar = buildScalarDensityData({ data: tinyYData, temporal: false, xField: "x", yField: "y" });
        const tinyYProvider = new CartesianConnectedPathInteractionProvider({
            materialize: index => ({
                animationKey: `r15-y-${index}`,
                datum: tinyYData[index],
                index,
                seriesId: "r15-y",
                seriesName: "R15 tiny Y",
                seriesType: "line",
                xKey: tinyYScalar.x[index],
                xValue: tinyYScalar.x[index],
                yValue: tinyYScalar.y[index]
            }),
            scalar: tinyYScalar,
            xScale: CartesianScaleFactory.createExactPositionScale({
                domain: [0, 10],
                range: [0, 100],
                type: "linear"
            }) as never,
            yScale: CartesianScaleFactory.createExactPositionScale({
                domain: [0, 1e-15],
                range: [100, 0],
                type: "linear"
            }) as never
        });

        const tinyYHits = tinyYProvider.queryRange({ pixelA: { x: 20, y: 45 }, pixelB: { x: 80, y: 55 } });
        expect(tinyYHits.map(hit => hit.index)).toEqual([5]);
    });
});
