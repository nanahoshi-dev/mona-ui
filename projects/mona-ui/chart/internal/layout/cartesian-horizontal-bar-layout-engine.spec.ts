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
        data: signal([{ cat: "Q1", val: 100 }, { cat: "Q2", val: 200 }]),
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
        xField: signal("cat"),
        ...overrides
    };
}

function createMockRangeBarSeries(overrides: Partial<ChartRangeBarSeriesRegistration> = {}): ChartRangeBarSeriesRegistration {
    return {
        borderRadius: signal(4),
        color: signal("#10b981"),
        data: signal([{ cat: "Q1", from: 50, to: 120 }, { cat: "Q2", from: 80, to: 180 }]),
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
        xField: signal("cat"),
        ...overrides
    };
}

function createMockXAxis(overrides: Partial<ChartXAxisRegistration> = {}): ChartXAxisRegistration {
    return {
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
            palette: ["#3b82f6"],
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
            palette: ["#3b82f6", "#ef4444"],
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
            palette: ["#3b82f6", "#10b981"],
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
            palette: ["#3b82f6", "#10b981"],
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
            palette: ["#10b981"],
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
            palette: ["#3b82f6"],
            xAxis,
            yAxis
        });

        const target = scene.hitTargets[0];
        expect(target.bounds?.width).toBe(0);
        expect(target.visualBounds?.width).toBe(4);
    });
});
