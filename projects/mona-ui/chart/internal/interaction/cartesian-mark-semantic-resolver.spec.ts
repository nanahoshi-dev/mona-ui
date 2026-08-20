import { describe, expect, it } from "vitest";
import { CartesianMarkSemanticResolver } from "./cartesian-mark-semantic-resolver";
import type { CartesianXYChartScene } from "../scene/chart-scene";
import type { SceneHitTarget } from "../scene/scene-geometry";
import {
    CartesianAxisCoordinateSpace,
    type CartesianAxisCoordinateSnapshot
} from "../viewport/cartesian-axis-coordinate-space";
import { CartesianScaleFactory } from "../scale/cartesian-scale-factory";

function createMockCoordSpace(): CartesianAxisCoordinateSpace {
    const xMap = new Map<string, CartesianAxisCoordinateSnapshot>();
    const yMap = new Map<string, CartesianAxisCoordinateSnapshot>();

    const xScale = CartesianScaleFactory.createBandScale({
        domain: ["Jan", "Feb", "Mar"],
        paddingInner: 0.2,
        paddingOuter: 0.1,
        range: [50, 450]
    });

    const yScale = CartesianScaleFactory.createExactPositionScale({
        domain: [0, 500],
        range: [250, 50],
        type: "linear"
    });

    const xContScale = CartesianScaleFactory.createExactPositionScale({
        domain: [0, 100],
        range: [50, 450],
        type: "linear"
    });

    xMap.set("x-main", {
        baseDomain: ["Jan", "Feb", "Mar"],
        baseScale: xScale,
        range: [50, 450],
        ref: { axis: "x", axisId: "x-main" },
        resolvedType: "category",
        valid: true,
        viewportDomain: ["Jan", "Feb", "Mar"],
        viewportScale: xScale
    });

    yMap.set("y-main", {
        baseDomain: [0, 500],
        baseScale: yScale,
        range: [250, 50],
        ref: { axis: "y", axisId: "y-main" },
        resolvedType: "linear",
        valid: true,
        viewportDomain: [0, 500],
        viewportScale: yScale
    });

    xMap.set("x-cont", {
        baseDomain: [0, 100],
        baseScale: xContScale,
        range: [50, 450],
        ref: { axis: "x", axisId: "x-cont" },
        resolvedType: "linear",
        valid: true,
        viewportDomain: [0, 100],
        viewportScale: xContScale
    });

    return new CartesianAxisCoordinateSpace(xMap, yMap);
}

describe("CartesianMarkSemanticResolver", () => {
    const mockCoordSpace = createMockCoordSpace();

    const mockScene: CartesianXYChartScene = {
        axes: [],
        cartesianKind: "xy",
        coordinateSpace: mockCoordSpace,
        coordinateSystem: "cartesian",
        hasRenderableData: true,
        height: 300,
        hitTargets: [],
        interactionAxis: "x",
        interactionBuckets: [],
        legendItems: [],
        orientation: "vertical",
        plotRect: { height: 200, width: 400, x: 50, y: 50 },
        primaryXAxisId: "x-main",
        primaryYAxisId: "y-main",
        series: [],
        width: 500
    };

    it("resolves vertical scalar bar with category on X and value on Y", () => {
        const hit: SceneHitTarget = {
            category: "Feb",
            dataIndex: 1,
            datum: { category: "Feb", value: 250 },
            index: 1,
            point: { x: 250, y: 150 },
            seriesId: "s1",
            seriesName: "Bar 1",
            seriesType: "bar",
            value: 250,
            xKey: "Feb",
            xValue: "Feb"
        };

        const result = CartesianMarkSemanticResolver.resolve(hit, mockScene, { x: 250, y: 150 });
        expect(result.semanticX).toBe("Feb");
        expect(result.semanticY).toBe(250);
        expect(result.semanticIndexX).toBe(1);
        expect(result.semanticIndexY).toBe(1);
    });

    it("resolves horizontal scalar bar with value endpoint on X and category on Y (CAA-R2-001)", () => {
        const horizScene: CartesianXYChartScene = {
            ...mockScene,
            interactionAxis: "y",
            orientation: "horizontal"
        };

        const hit: SceneHitTarget = {
            barOrientation: "horizontal",
            categoryY: "Feb",
            dataIndex: 1,
            datum: { category: "Feb", value: 300 },
            index: 1,
            point: { x: 200, y: 150 },
            rawValue: 300,
            seriesId: "s-horiz",
            seriesName: "HBar 1",
            seriesType: "bar",
            value: 300,
            xKey: "Feb",
            xValue: "Feb",
            yValue: 300
        };

        const result = CartesianMarkSemanticResolver.resolve(hit, horizScene, { x: 200, y: 150 });
        expect(result.semanticX).toBe(300);
        expect(result.semanticY).toBe("Feb");
    });

    it("resolves stacked vertical bar using stackEnd coordinate (CAA-R2-002)", () => {
        const hit: SceneHitTarget = {
            category: "Feb",
            dataIndex: 1,
            datum: { category: "Feb", value: 120 },
            index: 1,
            point: { x: 250, y: 80 },
            seriesId: "s-stack",
            seriesName: "StackBar 1",
            seriesType: "bar",
            stackEnd: 420,
            value: 120,
            xKey: "Feb",
            xValue: "Feb",
            yValue: 120
        };

        const result = CartesianMarkSemanticResolver.resolve(hit, mockScene, { x: 250, y: 80 });
        expect(result.semanticX).toBe("Feb");
        expect(result.semanticY).toBe(420);
    });

    it("resolves stacked horizontal bar using stackEnd coordinate (CAA-R2-002)", () => {
        const horizScene: CartesianXYChartScene = {
            ...mockScene,
            interactionAxis: "y",
            orientation: "horizontal"
        };

        const hit: SceneHitTarget = {
            barOrientation: "horizontal",
            categoryY: "Mar",
            dataIndex: 2,
            datum: { category: "Mar", value: 150 },
            index: 2,
            point: { x: 350, y: 200 },
            seriesId: "s-hstack",
            seriesName: "HStackBar 1",
            seriesType: "bar",
            stackEnd: 480,
            value: 150,
            xKey: "Mar",
            xValue: "Mar",
            yValue: 150
        };

        const result = CartesianMarkSemanticResolver.resolve(hit, horizScene, { x: 350, y: 200 });
        expect(result.semanticX).toBe(480);
        expect(result.semanticY).toBe("Mar");
    });

    it("resolves vertical range bar mapping from/to via continuous Y scale (CAA-R2-003)", () => {
        const hit: SceneHitTarget = {
            category: "Feb",
            dataIndex: 1,
            datum: { category: "Feb", from: 100, to: 400 },
            fromValue: 100,
            index: 1,
            seriesId: "s-range",
            seriesName: "RangeBar 1",
            seriesType: "rangeBar",
            toValue: 400,
            valueKind: "range",
            xKey: "Feb",
            xValue: "Feb"
        };

        // Pointer near top boundary (y = 80, closer to toValue=400 at y=90)
        const resNearTo = CartesianMarkSemanticResolver.resolve(hit, mockScene, { x: 250, y: 80 });
        expect(resNearTo.semanticX).toBe("Feb");
        expect(resNearTo.semanticY).toBe(400);

        // Pointer near bottom boundary (y = 220, closer to fromValue=100 at y=210)
        const resNearFrom = CartesianMarkSemanticResolver.resolve(hit, mockScene, { x: 250, y: 220 });
        expect(resNearFrom.semanticX).toBe("Feb");
        expect(resNearFrom.semanticY).toBe(100);
    });

    it("resolves financial candlestick and OHLC with close semantic", () => {
        const hit: SceneHitTarget = {
            close: 340,
            dataIndex: 0,
            datum: { category: "Jan", close: 340, high: 380, low: 300, open: 310 },
            financial: {
                close: 340,
                direction: "rising",
                high: 380,
                low: 300,
                open: 310,
                valueKind: "ohlc"
            },
            high: 380,
            index: 0,
            low: 300,
            open: 310,
            point: { x: 116.66, y: 114 },
            seriesId: "fin-1",
            seriesName: "Candle 1",
            seriesType: "candlestick",
            xKey: "Jan",
            xValue: "Jan"
        };

        const result = CartesianMarkSemanticResolver.resolve(hit, mockScene, { x: 116.66, y: 114 });
        expect(result.semanticX).toBe("Jan");
        expect(result.semanticY).toBe(340);
    });

    it("resolves horizontal RangeBar mapping from/to via continuous X scale (Gate H)", () => {
        const horizScene: CartesianXYChartScene = {
            ...mockScene,
            interactionAxis: "y",
            orientation: "horizontal"
        };

        const hit: SceneHitTarget = {
            barOrientation: "horizontal",
            categoryY: "Feb",
            dataIndex: 1,
            datum: { category: "Feb", from: 20, to: 80 },
            fromValue: 20,
            index: 1,
            seriesId: "s-hrange",
            seriesName: "HRangeBar 1",
            seriesType: "rangeBar",
            toValue: 80,
            valueKind: "range",
            xAxisId: "x-cont",
            xKey: "Feb",
            xValue: "Feb",
            yValue: 1
        };

        // In continuous X scale [0, 100] -> [50, 450], 20 is at 130px, 80 is at 370px.
        const resNearFrom = CartesianMarkSemanticResolver.resolve(hit, horizScene, { x: 140, y: 150 });
        expect(resNearFrom.semanticY).toBe("Feb");
        expect(resNearFrom.semanticX).toBe(20);

        const resNearTo = CartesianMarkSemanticResolver.resolve(hit, horizScene, { x: 360, y: 150 });
        expect(resNearTo.semanticY).toBe("Feb");
        expect(resNearTo.semanticX).toBe(80);
    });

    it("resolves RangeArea near lower vs upper boundary (Gate H)", () => {
        const hit: SceneHitTarget = {
            category: "Feb",
            dataIndex: 1,
            datum: { category: "Feb", from: 50, to: 200 },
            fromValue: 50,
            index: 1,
            rangeBand: {
                fromPoint: { x: 250, y: 230 },
                toPoint: { x: 250, y: 170 }
            },
            seriesId: "s-range-area",
            seriesName: "RangeArea 1",
            seriesType: "rangeArea",
            toValue: 200,
            valueKind: "range",
            xKey: "Feb",
            xValue: "Feb"
        };

        const resNearTo = CartesianMarkSemanticResolver.resolve(hit, mockScene, { x: 250, y: 160 });
        expect(resNearTo.semanticX).toBe("Feb");
        expect(resNearTo.semanticY).toBe(200);

        const resNearFrom = CartesianMarkSemanticResolver.resolve(hit, mockScene, { x: 250, y: 240 });
        expect(resNearFrom.semanticX).toBe("Feb");
        expect(resNearFrom.semanticY).toBe(50);
    });

    it("resolves stacked area and percent stacked mark semantics (Gate G)", () => {
        const hit: SceneHitTarget = {
            category: "Feb",
            dataIndex: 1,
            datum: { category: "Feb", value: 50 },
            index: 1,
            point: { x: 250, y: 150 },
            seriesId: "s-pct",
            seriesName: "Percent Series",
            seriesType: "area",
            stackEnd: 0.75,
            stackMode: "percent",
            stackPercentage: 0.75,
            value: 50,
            xKey: "Feb",
            xValue: "Feb"
        };

        const result = CartesianMarkSemanticResolver.resolve(hit, mockScene, { x: 250, y: 150 });
        expect(result.semanticX).toBe("Feb");
        expect(result.semanticY).toBe(0.75);
    });

    it("resolves scatter and bubble points with exact scalar coordinates (Gate F)", () => {
        const scatterHit: SceneHitTarget = {
            dataIndex: 0,
            datum: { x: 42, y: 180 },
            index: 0,
            point: { x: 218, y: 178 },
            radius: 8,
            seriesId: "s-scatter",
            seriesName: "Scatter 1",
            seriesType: "scatter",
            xKey: "42",
            xValue: 42,
            yValue: 180
        };

        const result = CartesianMarkSemanticResolver.resolve(scatterHit, mockScene, { x: 218, y: 178 });
        expect(result.semanticX).toBe(42);
        expect(result.semanticY).toBe(180);
    });
});
