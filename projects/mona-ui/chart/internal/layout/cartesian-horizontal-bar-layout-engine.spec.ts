import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type {
    ChartBarSeriesRegistration,
    ChartRangeBarSeriesRegistration,
    ChartXAxisRegistration,
    ChartYAxisRegistration
} from "../context/chart-registration-context";
import { CartesianHorizontalBarLayoutEngine } from "./cartesian-horizontal-bar-layout-engine";

function createMockBarSeries(overrides: Partial<ChartBarSeriesRegistration> = {}): ChartBarSeriesRegistration {
    return {
        borderRadius: signal(4),
        color: signal("#3b82f6"),
        data: signal([
            { cat: "Q1", val: 100 },
            { cat: "Q2", val: 200 }
        ]),
        element: { nativeElement: {} as HTMLElement } as import("@angular/core").ElementRef<HTMLElement>,
        field: signal("val"),
        fillOpacity: signal(1),
        id: "bar-1",
        keyField: signal(undefined),
        maxBarWidth: signal(undefined),
        name: signal("Revenue"),
        orientation: signal("horizontal"),
        stack: signal(undefined),
        stackMode: signal("normal"),
        type: "bar",
        valueFormatter: signal(undefined),
        visible: signal(true),
        xAxisId: signal(undefined),
        xField: signal("cat"),
        yAxisId: signal(undefined),
        ...overrides
    };
}

function createMockRangeBarSeries(
    overrides: Partial<ChartRangeBarSeriesRegistration> = {}
): ChartRangeBarSeriesRegistration {
    return {
        borderRadius: signal(4),
        color: signal("#10b981"),
        data: signal([
            { cat: "Q1", from: 50, to: 120 },
            { cat: "Q2", from: 80, to: 180 }
        ]),
        element: { nativeElement: {} as HTMLElement } as import("@angular/core").ElementRef<HTMLElement>,
        fillOpacity: signal(1),
        fromField: signal("from"),
        id: "range-bar-1",
        keyField: signal(undefined),
        maxBarWidth: signal(undefined),
        name: signal("Operating Range"),
        orientation: signal("horizontal"),
        toField: signal("to"),
        type: "rangeBar",
        valueFormatter: signal(undefined),
        visible: signal(true),
        xAxisId: signal(undefined),
        xField: signal("cat"),
        yAxisId: signal(undefined),
        ...overrides
    };
}

function createMockXAxis(overrides: Partial<ChartXAxisRegistration> = {}): ChartXAxisRegistration {
    return {
        axisId: signal(undefined),
        axisLine: signal(true),
        formatter: signal(undefined),
        gridLines: signal(true),
        labelMaxWidth: signal(undefined),
        labelPadding: signal(4),
        labelRotation: signal(0),
        labels: signal(true),
        labelTemplate: signal(undefined),
        max: signal(undefined),
        min: signal(undefined),
        nice: signal(true),
        position: signal("bottom"),
        registrationId: "mock-x",
        tickCount: signal(5),
        tickMarks: signal(false),
        tickSize: signal(6),
        title: signal("Value"),
        titlePadding: signal(8),
        type: signal("linear"),
        visible: signal(true),
        ...overrides
    };
}

function createMockYAxis(overrides: Partial<ChartYAxisRegistration> = {}): ChartYAxisRegistration {
    return {
        axisId: signal(undefined),
        axisLine: signal(true),
        formatter: signal(undefined),
        gridLines: signal(false),
        labelMaxWidth: signal(undefined),
        labelPadding: signal(4),
        labelRotation: signal(0),
        labels: signal(true),
        labelTemplate: signal(undefined),
        max: signal(undefined),
        min: signal(undefined),
        nice: signal(true),
        position: signal("left"),
        registrationId: "mock-y",
        tickCount: signal(5),
        tickMarks: signal(false),
        tickSize: signal(6),
        title: signal("Category"),
        titlePadding: signal(8),
        type: signal("category"),
        visible: signal(true),
        ...overrides
    };
}

describe("CartesianHorizontalBarLayoutEngine", () => {
    it("computes horizontal bar layout with category on Y and value on X", () => {
        const barSeries = createMockBarSeries();
        const xAxis = createMockXAxis();
        const yAxis = createMockYAxis();

        const scene = CartesianHorizontalBarLayoutEngine.computeLayout({
            containerHeight: 300,
            containerWidth: 500,
            effectiveSeries: [barSeries],
            xAxis,
            yAxis
        });

        expect(scene.orientation).toBe("horizontal");
        expect(scene.interactionAxis).toBe("y");
        expect(scene.xAxisType).toBe("linear");
        expect(scene.yAxisType).toBe("category");
        expect(scene.series.length).toBe(1);

        const barScene = scene.series[0] as import("../scene/cartesian-scene").ChartBarSeriesScene;
        expect(barScene.bars.length).toBe(2);

        // Verify bars extend horizontally (height = category band size, width = value distance)
        const bar1 = barScene.bars[0];
        expect(bar1.x).toBe(scene.plotRect.x);
        expect(bar1.width).toBeGreaterThan(0);
        expect(bar1.height).toBeGreaterThan(0);
        expect(bar1.orientation).toBe("horizontal");
        expect(bar1.cornerRadii?.topRight).toBe(4);
        expect(bar1.cornerRadii?.bottomRight).toBe(4);
        expect(bar1.cornerRadii?.topLeft).toBe(0);
        expect(bar1.cornerRadii?.bottomLeft).toBe(0);

        // Verify interaction buckets are sorted by anchor.y (top to bottom)
        expect(scene.interactionBuckets.length).toBe(2);
        expect(scene.interactionBuckets[0].anchor.y).toBeLessThan(scene.interactionBuckets[1].anchor.y);
    });

    it("computes horizontal grouped bars with multiple slots along physical Y", () => {
        const barSeries1 = createMockBarSeries({ id: "b1", name: signal("Series 1") });
        const barSeries2 = createMockBarSeries({ id: "b2", name: signal("Series 2"), color: signal("#ef4444") });
        const xAxis = createMockXAxis();
        const yAxis = createMockYAxis();

        const scene = CartesianHorizontalBarLayoutEngine.computeLayout({
            containerHeight: 400,
            containerWidth: 600,
            effectiveSeries: [barSeries1, barSeries2],
            xAxis,
            yAxis
        });

        const s1 = scene.series[0] as import("../scene/cartesian-scene").ChartBarSeriesScene;
        const s2 = scene.series[1] as import("../scene/cartesian-scene").ChartBarSeriesScene;

        // Grouped bars in same category must have different Y coordinates
        expect(s1.bars[0].y).not.toBe(s2.bars[0].y);
        expect(s1.bars[0].height).toBeLessThan(400 / 2);
    });

    it("computes horizontal stacked bars along physical X", () => {
        const barSeries1 = createMockBarSeries({
            id: "b1",
            stack: signal("grp"),
            data: signal([{ cat: "Q1", val: 100 }])
        });
        const barSeries2 = createMockBarSeries({
            id: "b2",
            stack: signal("grp"),
            data: signal([{ cat: "Q1", val: 50 }])
        });
        const xAxis = createMockXAxis();
        const yAxis = createMockYAxis();

        const scene = CartesianHorizontalBarLayoutEngine.computeLayout({
            containerHeight: 300,
            containerWidth: 500,
            effectiveSeries: [barSeries1, barSeries2],
            xAxis,
            yAxis
        });

        const s1 = scene.series[0] as import("../scene/cartesian-scene").ChartBarSeriesScene;
        const s2 = scene.series[1] as import("../scene/cartesian-scene").ChartBarSeriesScene;

        // Stacked bars share category Y
        expect(s1.bars[0].y).toBe(s2.bars[0].y);
        // Second stack segment starts where first segment ends (X accumulation)
        expect(s2.bars[0].x).toBeCloseTo(s1.bars[0].x + s1.bars[0].width, 1);
        // Inner stack segment has 0 corner radii, outer stack segment has rounded right corners
        expect(s1.bars[0].cornerRadii?.topRight).toBe(0);
        expect(s2.bars[0].cornerRadii?.topRight).toBe(4);
    });

    it("computes horizontal 100% stacked bars summing to 100% along physical X", () => {
        const barSeries1 = createMockBarSeries({
            id: "b1",
            stack: signal("grp"),
            stackMode: signal("percent" as const),
            data: signal([{ cat: "Q1", val: 60 }])
        });
        const barSeries2 = createMockBarSeries({
            id: "b2",
            stack: signal("grp"),
            stackMode: signal("percent" as const),
            data: signal([{ cat: "Q1", val: 40 }])
        });
        const xAxis = createMockXAxis();
        const yAxis = createMockYAxis();

        const scene = CartesianHorizontalBarLayoutEngine.computeLayout({
            containerHeight: 300,
            containerWidth: 500,
            effectiveSeries: [barSeries1, barSeries2],
            xAxis,
            yAxis
        });

        const s1 = scene.series[0] as import("../scene/cartesian-scene").ChartBarSeriesScene;
        const s2 = scene.series[1] as import("../scene/cartesian-scene").ChartBarSeriesScene;

        expect(s1.bars[0].stackPercentage).toBe(60);
        expect(s2.bars[0].stackPercentage).toBe(40);
        // Total combined width should span the entire plot width
        const totalBarWidth = s1.bars[0].width + s2.bars[0].width;
        expect(totalBarWidth).toBeCloseTo(scene.plotRect.width, 0);
    });

    it("computes horizontal range bars with 4-corner rounded rects and interval bounds", () => {
        const rangeBarSeries = createMockRangeBarSeries();
        const xAxis = createMockXAxis();
        const yAxis = createMockYAxis();

        const scene = CartesianHorizontalBarLayoutEngine.computeLayout({
            containerHeight: 300,
            containerWidth: 500,
            effectiveSeries: [rangeBarSeries],
            xAxis,
            yAxis
        });

        expect(scene.orientation).toBe("horizontal");
        const rangeScene = scene.series[0] as import("../scene/cartesian-scene").ChartRangeBarSeriesScene;
        const rBar1 = rangeScene.bars[0];

        expect(rBar1.fromValuePixel).toBeDefined();
        expect(rBar1.toValuePixel).toBeDefined();
        expect(rBar1.cornerRadii?.topLeft).toBe(4);
        expect(rBar1.cornerRadii?.topRight).toBe(4);
        expect(rBar1.cornerRadii?.bottomLeft).toBe(4);
        expect(rBar1.cornerRadii?.bottomRight).toBe(4);
    });

    it("handles zero-value horizontal bars with 4px visual bounds tolerance", () => {
        const barSeries = createMockBarSeries({
            data: signal([{ cat: "Q1", val: 0 }])
        });
        const xAxis = createMockXAxis();
        const yAxis = createMockYAxis();

        const scene = CartesianHorizontalBarLayoutEngine.computeLayout({
            containerHeight: 300,
            containerWidth: 500,
            effectiveSeries: [barSeries],
            xAxis,
            yAxis
        });

        const target = scene.hitTargets[0];
        expect(target.bounds).toBeUndefined();
        expect(target.visualBounds?.width).toBe(4);
    });

    it("omits non-finite values in unstacked horizontal bars", () => {
        const barSeries = createMockBarSeries({
            data: signal([
                { cat: "Q1", val: 100 },
                { cat: "Q2", val: Number.NaN },
                { cat: "Q3", val: null }
            ])
        });
        const xAxis = createMockXAxis();
        const yAxis = createMockYAxis();

        const scene = CartesianHorizontalBarLayoutEngine.computeLayout({
            containerHeight: 300,
            containerWidth: 500,
            effectiveSeries: [barSeries],
            xAxis,
            yAxis
        });

        const barScene = scene.series[0] as import("../scene/cartesian-scene").ChartBarSeriesScene;
        expect(barScene.bars.length).toBe(1);
        expect(barScene.bars[0].yValue).toBe(100);
        expect(barScene.bars[0].xValue).toBe("Q1");
    });

    it("emits diagnostics when non-linear X axis or non-category Y axis is configured", () => {
        const barSeries = createMockBarSeries();
        const xAxis = createMockXAxis({ type: signal("category") });
        const yAxis = createMockYAxis({ type: signal("linear") });
        const warned = new Set<string>();

        CartesianHorizontalBarLayoutEngine.computeLayout({
            containerHeight: 300,
            containerWidth: 500,
            effectiveSeries: [barSeries],
            warnedDiagnosticSignatures: warned,
            xAxis,
            yAxis
        });

        expect(warned.size).toBe(2);
    });

    it("clamps horizontal baseline to plot left when explicit X domain is positive-only", () => {
        const barSeries = createMockBarSeries({
            data: signal([{ cat: "Q1", val: 75 }])
        });
        const xAxis = createMockXAxis({
            min: signal(50),
            max: signal(100)
        });
        const yAxis = createMockYAxis();

        const scene = CartesianHorizontalBarLayoutEngine.computeLayout({
            containerHeight: 300,
            containerWidth: 500,
            effectiveSeries: [barSeries],
            xAxis,
            yAxis
        });

        const barScene = scene.series[0] as import("../scene/cartesian-scene").ChartBarSeriesScene;
        const bar = barScene.bars[0];
        // Baseline must be clamped to plot left (plotRect.x), not offscreen left
        expect(bar.valueStartPixel).toBe(scene.plotRect.x);
        expect(bar.x).toBe(scene.plotRect.x);
        expect(bar.width).toBeCloseTo(scene.plotRect.width / 2, 1); // 75 is halfway between 50 and 100
    });

    it("clamps horizontal baseline to plot right when explicit X domain is negative-only", () => {
        const barSeries = createMockBarSeries({
            data: signal([{ cat: "Q1", val: -75 }])
        });
        const xAxis = createMockXAxis({
            min: signal(-100),
            max: signal(-50)
        });
        const yAxis = createMockYAxis();

        const scene = CartesianHorizontalBarLayoutEngine.computeLayout({
            containerHeight: 300,
            containerWidth: 500,
            effectiveSeries: [barSeries],
            xAxis,
            yAxis
        });

        const barScene = scene.series[0] as import("../scene/cartesian-scene").ChartBarSeriesScene;
        const bar = barScene.bars[0];
        // Baseline must be clamped to plot right (plotRect.x + plotRect.width)
        expect(bar.valueStartPixel).toBe(scene.plotRect.x + scene.plotRect.width);
        expect(bar.x + bar.width).toBeCloseTo(scene.plotRect.x + scene.plotRect.width, 1);
        expect(bar.width).toBeCloseTo(scene.plotRect.width / 2, 1);
    });

    it("retains zero marks at plot bounds when explicit domain excludes zero", () => {
        const barSeriesPos = createMockBarSeries({
            data: signal([{ cat: "Q1", val: 0 }])
        });
        const xAxisPos = createMockXAxis({
            min: signal(10),
            max: signal(20)
        });
        const scenePos = CartesianHorizontalBarLayoutEngine.computeLayout({
            containerHeight: 300,
            containerWidth: 500,
            effectiveSeries: [barSeriesPos],
            xAxis: xAxisPos,
            yAxis: createMockYAxis()
        });
        expect(scenePos.hasRenderableData).toBe(true);
        const barPos = (scenePos.series[0] as import("../scene/cartesian-scene").ChartBarSeriesScene).bars[0];
        expect(barPos.valueStartPixel).toBe(scenePos.plotRect.x);
        expect(barPos.valueEndPixel).toBe(scenePos.plotRect.x);
        expect(barPos.width).toBe(0);

        const barSeriesNeg = createMockBarSeries({
            data: signal([{ cat: "Q1", val: 0 }])
        });
        const xAxisNeg = createMockXAxis({
            min: signal(-20),
            max: signal(-10)
        });
        const sceneNeg = CartesianHorizontalBarLayoutEngine.computeLayout({
            containerHeight: 300,
            containerWidth: 500,
            effectiveSeries: [barSeriesNeg],
            xAxis: xAxisNeg,
            yAxis: createMockYAxis()
        });
        expect(sceneNeg.hasRenderableData).toBe(true);
        const barNeg = (sceneNeg.series[0] as import("../scene/cartesian-scene").ChartBarSeriesScene).bars[0];
        expect(barNeg.valueStartPixel).toBe(sceneNeg.plotRect.x + sceneNeg.plotRect.width);
        expect(barNeg.valueEndPixel).toBe(sceneNeg.plotRect.x + sceneNeg.plotRect.width);
        expect(barNeg.width).toBe(0);
    });

    it("does NOT widen zero-valued stacked contributions while unstacked zero marks get 4px visual bounds", () => {
        const stackSeries1 = createMockBarSeries({
            id: "s1",
            stack: signal("grp"),
            data: signal([{ cat: "Q1", val: 0 }])
        });
        const stackSeries2 = createMockBarSeries({
            id: "s2",
            stack: signal("grp"),
            data: signal([{ cat: "Q1", val: 50 }])
        });
        const unstackedSeries = createMockBarSeries({
            id: "u1",
            data: signal([{ cat: "Q1", val: 0 }])
        });

        const stackedScene = CartesianHorizontalBarLayoutEngine.computeLayout({
            containerHeight: 300,
            containerWidth: 500,
            effectiveSeries: [stackSeries1, stackSeries2],
            xAxis: createMockXAxis(),
            yAxis: createMockYAxis()
        });

        const stackedZeroHit = stackedScene.hitTargets.find(h => h.seriesId === "s1");
        expect(stackedZeroHit).toBeDefined();
        expect(stackedZeroHit?.bounds).toBeUndefined();
        // Stacked zero contribution must NOT have fake 4px widened visualBounds
        expect(stackedZeroHit?.visualBounds?.width).toBe(0);

        const unstackedScene = CartesianHorizontalBarLayoutEngine.computeLayout({
            containerHeight: 300,
            containerWidth: 500,
            effectiveSeries: [unstackedSeries],
            xAxis: createMockXAxis(),
            yAxis: createMockYAxis()
        });

        const unstackedZeroHit = unstackedScene.hitTargets[0];
        expect(unstackedZeroHit.bounds).toBeUndefined();
        // Unstacked zero mark keeps 4px tolerance
        expect(unstackedZeroHit.visualBounds?.width).toBe(4);
    });

    it("respects keyField for unstacked horizontal bar and range bar identity", () => {
        const barSeries = createMockBarSeries({
            data: signal([
                { id: "row-a", cat: "SameCategory", val: 10 },
                { id: "row-b", cat: "SameCategory", val: 20 }
            ]),
            keyField: signal("id")
        });

        const scene = CartesianHorizontalBarLayoutEngine.computeLayout({
            containerHeight: 300,
            containerWidth: 500,
            effectiveSeries: [barSeries],
            xAxis: createMockXAxis(),
            yAxis: createMockYAxis()
        });

        const barScene = scene.series[0] as import("../scene/cartesian-scene").ChartBarSeriesScene;
        expect(barScene.bars.length).toBe(2);
        expect(barScene.bars[0].animationKey).toContain("row-a");
        expect(barScene.bars[1].animationKey).toContain("row-b");
        expect(barScene.bars[0].animationKey).not.toBe(barScene.bars[1].animationKey);

        const rangeSeries = createMockRangeBarSeries({
            data: signal([
                { id: "range-a", cat: "SameCategory", from: 5, to: 15 },
                { id: "range-b", cat: "SameCategory", from: 20, to: 30 }
            ]),
            keyField: signal("id")
        });

        const rangeScene = CartesianHorizontalBarLayoutEngine.computeLayout({
            containerHeight: 300,
            containerWidth: 500,
            effectiveSeries: [rangeSeries],
            xAxis: createMockXAxis(),
            yAxis: createMockYAxis()
        });

        const rScene = rangeScene.series[0] as import("../scene/cartesian-scene").ChartRangeBarSeriesScene;
        expect(rScene.bars.length).toBe(2);
        expect(rScene.bars[0].animationKey).toContain("range-a");
        expect(rScene.bars[1].animationKey).toContain("range-b");
        expect(rScene.bars[0].animationKey).not.toBe(rScene.bars[1].animationKey);
    });

    it("omits invalid Range Bar endpoints and handles equal 0-0 range correctly", () => {
        const rangeSeries = createMockRangeBarSeries({
            data: signal([
                { cat: "Q1", from: 10, to: Number.NaN },
                { cat: "Q2", from: Number.POSITIVE_INFINITY, to: 50 },
                { cat: "Q3", from: null, to: null },
                { cat: "Q4", from: "invalid", to: 100 },
                { cat: "Q5", from: 0, to: 0 }
            ])
        });

        const scene = CartesianHorizontalBarLayoutEngine.computeLayout({
            containerHeight: 300,
            containerWidth: 500,
            effectiveSeries: [rangeSeries],
            xAxis: createMockXAxis(),
            yAxis: createMockYAxis()
        });

        expect(scene.hasRenderableData).toBe(true);
        const rScene = scene.series[0] as import("../scene/cartesian-scene").ChartRangeBarSeriesScene;
        expect(rScene.bars.length).toBe(1);
        expect(rScene.bars[0].xValue).toBe("Q5");
        expect(rScene.bars[0].fromValue).toBe(0);
        expect(rScene.bars[0].toValue).toBe(0);
    });

    it("evaluates hasRenderableData correctly for all-invalid vs single-valid horizontal datasets", () => {
        const invalidBar = createMockBarSeries({
            data: signal([
                { cat: "Q1", val: Number.NaN },
                { cat: "Q2", val: null }
            ])
        });
        const invalidScene = CartesianHorizontalBarLayoutEngine.computeLayout({
            containerHeight: 300,
            containerWidth: 500,
            effectiveSeries: [invalidBar],
            xAxis: createMockXAxis(),
            yAxis: createMockYAxis()
        });
        expect(invalidScene.hasRenderableData).toBe(false);

        const validZeroBar = createMockBarSeries({
            data: signal([{ cat: "Q1", val: 0 }])
        });
        const validScene = CartesianHorizontalBarLayoutEngine.computeLayout({
            containerHeight: 300,
            containerWidth: 500,
            effectiveSeries: [validZeroBar],
            xAxis: createMockXAxis(),
            yAxis: createMockYAxis()
        });
        expect(validScene.hasRenderableData).toBe(true);
    });

    it("maintains canonical retained stack entry mapping for duplicate categories", () => {
        const s1 = createMockBarSeries({
            id: "s1",
            stack: signal("grp"),
            data: signal([
                { cat: "Q1", val: 10 },
                { cat: "Q1", val: 99 }
            ])
        });
        const s2 = createMockBarSeries({
            id: "s2",
            stack: signal("grp"),
            data: signal([{ cat: "Q1", val: 20 }])
        });

        const scene = CartesianHorizontalBarLayoutEngine.computeLayout({
            containerHeight: 300,
            containerWidth: 500,
            effectiveSeries: [s1, s2],
            xAxis: createMockXAxis(),
            yAxis: createMockYAxis()
        });

        const s1Scene = scene.series[0] as import("../scene/cartesian-scene").ChartBarSeriesScene;
        const s2Scene = scene.series[1] as import("../scene/cartesian-scene").ChartBarSeriesScene;

        // Stack engine retains deduplicated canonical category entries
        expect(s1Scene.bars.length).toBe(1);
        expect(s2Scene.bars.length).toBe(1);
        expect(s1Scene.bars[0].yValue).toBe(10);
        expect(s2Scene.bars[0].yValue).toBe(20);
        expect(s1Scene.bars[0].stackStartValue).toBe(0);
        expect(s1Scene.bars[0].stackEndValue).toBe(10);
        expect(s2Scene.bars[0].stackStartValue).toBe(10);
        expect(s2Scene.bars[0].stackEndValue).toBe(30);
    });

    it("supports multiple X value axes bound to separate horizontal bar series", () => {
        const barSeries1 = createMockBarSeries({
            id: "b-usd",
            name: signal("Revenue USD"),
            data: signal([{ cat: "Q1", val: 500 }]),
            xAxisId: signal("x-usd")
        });
        const barSeries2 = createMockBarSeries({
            id: "b-units",
            name: signal("Units Sold"),
            data: signal([{ cat: "Q1", val: 50 }]),
            xAxisId: signal("x-units")
        });
        const xAxisUsd = createMockXAxis({
            axisId: signal("x-usd"),
            title: signal("USD ($)"),
            position: signal("bottom"),
            min: signal(0),
            max: signal(1000)
        });
        const xAxisUnits = createMockXAxis({
            axisId: signal("x-units"),
            title: signal("Units"),
            position: signal("top"),
            min: signal(0),
            max: signal(100)
        });
        const yAxis = createMockYAxis({
            title: signal("Quarters")
        });

        const scene = CartesianHorizontalBarLayoutEngine.computeLayout({
            containerHeight: 300,
            containerWidth: 500,
            effectiveSeries: [barSeries1, barSeries2],
            xAxes: [xAxisUsd, xAxisUnits],
            yAxes: [yAxis]
        });

        expect(scene.axes.length).toBe(3); // 2 X axes + 1 Y axis
        const s1 = scene.series[0] as import("../scene/cartesian-scene").ChartBarSeriesScene;
        const s2 = scene.series[1] as import("../scene/cartesian-scene").ChartBarSeriesScene;

        expect(s1.bars.length).toBe(1);
        expect(s2.bars.length).toBe(1);

        // 500 on [0, 1000] is 50% width
        expect(s1.bars[0].width).toBeCloseTo(scene.plotRect.width / 2, 1);
        // 50 on [0, 100] is 50% width
        expect(s2.bars[0].width).toBeCloseTo(scene.plotRect.width / 2, 1);

        // Hit targets carry axis identity
        const hit1 = scene.hitTargets.find(h => h.seriesId === "b-usd");
        const hit2 = scene.hitTargets.find(h => h.seriesId === "b-units");
        expect(hit1?.xAxisId).toBe("x-usd");
        expect(hit1?.xAxisTitle).toBe("USD ($)");
        expect(hit2?.xAxisId).toBe("x-units");
        expect(hit2?.xAxisTitle).toBe("Units");
    });
});
