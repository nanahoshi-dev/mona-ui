import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type {
    ChartBarSeriesRegistration,
    ChartLineSeriesRegistration,
    ChartXAxisRegistration,
    ChartYAxisRegistration
} from "../context/chart-registration-context";
import { CartesianAxisRegistryResolver } from "./cartesian-axis-registry-resolver";
import { CartesianMultiAxisCoordinator } from "./cartesian-multi-axis-coordinator";
import { CartesianSeriesAxisBindingResolver } from "./cartesian-series-axis-binding-resolver";

describe("CartesianMultiAxisCoordinator", () => {
    const createMockXAxis = (overrides: Partial<ChartXAxisRegistration> = {}): ChartXAxisRegistration => ({
        axisId: signal(undefined),
        axisLine: signal(true),
        exponent: signal(1),
        field: signal(undefined),
        formatter: signal(undefined),
        gridLines: signal(undefined),
        labelMaxWidth: signal(undefined),
        labelPadding: signal(undefined),
        labelRotation: signal(undefined),
        labels: signal(true),
        labelTemplate: signal(undefined),
        logBase: signal(10),
        max: signal(undefined),
        min: signal(undefined),
        nice: signal(true),
        position: signal("bottom"),
        registrationId: "mock-x",
        symlogConstant: signal(1),
        tickCount: signal(undefined),
        tickMarks: signal(false),
        tickSize: signal(undefined),
        title: signal(""),
        titlePadding: signal(undefined),
        type: signal("category"),
        visible: signal(true),
        ...overrides
    });

    const createMockYAxis = (overrides: Partial<ChartYAxisRegistration> = {}): ChartYAxisRegistration => ({
        axisId: signal(undefined),
        axisLine: signal(true),
        exponent: signal(1),
        formatter: signal(undefined),
        gridLines: signal(undefined),
        labelMaxWidth: signal(undefined),
        labelPadding: signal(undefined),
        labelRotation: signal(undefined),
        labels: signal(true),
        labelTemplate: signal(undefined),
        logBase: signal(10),
        max: signal(undefined),
        min: signal(undefined),
        nice: signal(true),
        position: signal("left"),
        registrationId: "mock-y",
        symlogConstant: signal(1),
        tickCount: signal(undefined),
        tickMarks: signal(false),
        tickSize: signal(undefined),
        title: signal(""),
        titlePadding: signal(undefined),
        type: signal("linear"),
        visible: signal(true),
        ...overrides
    });

    const createMockLineSeries = (overrides: Partial<ChartLineSeriesRegistration> = {}): ChartLineSeriesRegistration => ({
        color: signal("#10b981"),
        curve: signal("linear"),
        data: signal(undefined),
        element: { nativeElement: {} as HTMLElement },
        field: signal("val"),
        id: "series-line",
        name: signal("Line Series"),
        pointRadius: signal(undefined),
        strokeWidth: signal(undefined),
        type: "line",
        visible: signal(true),
        xAxisId: signal(undefined),
        xField: signal(undefined),
        yAxisId: signal(undefined),
        ...overrides
    });

    it("should coordinate dual Y-axes on left and right sides", () => {
        const x1 = createMockXAxis({ axisId: signal("x-main"), field: signal("month") });
        const y1 = createMockYAxis({ axisId: signal("y-temp"), position: signal("left"), title: signal("Temperature (°C)") });
        const y2 = createMockYAxis({ axisId: signal("y-precip"), position: signal("right"), title: signal("Precipitation (mm)") });

        const s1 = createMockLineSeries({ field: signal("temp"), id: "s-temp", yAxisId: signal("y-temp") });
        const s2 = createMockLineSeries({ field: signal("precip"), id: "s-precip", yAxisId: signal("y-precip") });

        const data = [
            { month: "Jan", precip: 50, temp: 5 },
            { month: "Feb", precip: 40, temp: 8 },
            { month: "Mar", precip: 30, temp: 12 }
        ];

        const axisResolution = CartesianAxisRegistryResolver.resolve([x1], [y1, y2]);
        const bindingResolution = CartesianSeriesAxisBindingResolver.resolve([s1, s2], axisResolution);

        const res = CartesianMultiAxisCoordinator.coordinate({
            axisResolution,
            bindingResolution,
            chartHeight: 300,
            chartWidth: 600,
            labelMeasurements: new Map(),
            rootData: data,
            rootXField: "month"
        });

        expect(res.axisScenes.length).toBe(3);
        const yLeft = res.axisScenes.find(a => a.axisId === "y-temp");
        const yRight = res.axisScenes.find(a => a.axisId === "y-precip");
        const xBottom = res.axisScenes.find(a => a.axisId === "x-main");

        expect(yLeft).toBeDefined();
        expect(yRight).toBeDefined();
        expect(yLeft?.position).toBe("left");
        expect(yRight?.position).toBe("right");

        // Scale registry holds independent scales for each axis
        expect(res.scaleRegistry.getYScale("y-temp")).toBeDefined();
        expect(res.scaleRegistry.getYScale("y-precip")).toBeDefined();

        // Left and right gutters are accounted for in plotRect
        expect(res.plotRect.x).toBeGreaterThan(16);
        expect(res.plotRect.width).toBeLessThan(600 - 32);
    });

    it("should stack multiple axes outward on the same side with increasing side offsets", () => {
        const y1 = createMockYAxis({ axisId: signal("y1"), position: signal("left") });
        const y2 = createMockYAxis({ axisId: signal("y2"), position: signal("left") });
        const axisResolution = CartesianAxisRegistryResolver.resolve([], [y1, y2]);
        const bindingResolution = CartesianSeriesAxisBindingResolver.resolve([], axisResolution);

        const res = CartesianMultiAxisCoordinator.coordinate({
            axisResolution,
            bindingResolution,
            chartHeight: 300,
            chartWidth: 600,
            labelMeasurements: new Map(),
            rootData: []
        });

        const scene1 = res.axisScenes.find(a => a.axisId === "y1")!;
        const scene2 = res.axisScenes.find(a => a.axisId === "y2")!;

        expect(scene1.sideOffset).toBe(0);
        expect(scene2.sideOffset).toBeGreaterThan(0);
        expect(scene2.sideOffset).toBe((scene1.gutter ?? 0) + 8); // axisSpacing = 8
    });

    it("should center category ticks in the middle of each category band (Bug 2)", () => {
        const x1 = createMockXAxis({ axisId: signal("x-cat"), field: signal("month"), type: signal("category") });
        const y1 = createMockYAxis({ axisId: signal("y-val") });
        const s1 = createMockLineSeries({ field: signal("val"), id: "s1" });

        const data = [
            { month: "Jan", val: 10 },
            { month: "Feb", val: 20 },
            { month: "Mar", val: 30 }
        ];

        const axisResolution = CartesianAxisRegistryResolver.resolve([x1], [y1]);
        const bindingResolution = CartesianSeriesAxisBindingResolver.resolve([s1], axisResolution);

        const res = CartesianMultiAxisCoordinator.coordinate({
            axisResolution,
            bindingResolution,
            chartHeight: 300,
            chartWidth: 600,
            labelMeasurements: new Map(),
            rootData: data,
            rootXField: "month"
        });

        const xScene = res.axisScenes.find(a => a.axisId === "x-cat")!;
        const xScale = res.scaleRegistry.getXScale("x-cat")! as import("../scale/cartesian-scale-factory").BandScale;
        const bandwidth = xScale.bandwidth();

        expect(bandwidth).toBeGreaterThan(0);
        expect(xScene.ticks.length).toBe(3);

        for (const tick of xScene.ticks) {
            const bandStart = xScale.map(String(tick.value))!;
            expect(tick.coordinate).toBeCloseTo(bandStart + bandwidth / 2, 5);
        }
    });

    it("should allocate title padding, extent, and breathing room for axes with title (Bug 3)", () => {
        const xNoTitle = createMockXAxis({ axisId: signal("x1"), title: signal("") });
        const xWithTitle = createMockXAxis({ axisId: signal("x2"), title: signal("Monthly Period") });
        const y1 = createMockYAxis({ axisId: signal("y1") });

        const axisResolution = CartesianAxisRegistryResolver.resolve([xNoTitle, xWithTitle], [y1]);
        const bindingResolution = CartesianSeriesAxisBindingResolver.resolve([], axisResolution);

        const res = CartesianMultiAxisCoordinator.coordinate({
            axisResolution,
            bindingResolution,
            chartHeight: 300,
            chartWidth: 600,
            labelMeasurements: new Map(),
            rootData: [{ x1: "A", x2: "A" }]
        });

        const sceneNoTitle = res.axisScenes.find(a => a.axisId === "x1")!;
        const sceneWithTitle = res.axisScenes.find(a => a.axisId === "x2")!;

        expect(sceneWithTitle.gutter ?? 0).toBeGreaterThanOrEqual((sceneNoTitle.gutter ?? 0) + 30);
    });

    it("should keep plotRect and Y-axis gutter stable between unmeasured initial render and measured DOM layout (preventing Bug 1 horizontal axis shift)", () => {
        const x1 = createMockXAxis({ axisId: signal("x-axis"), field: signal("month"), type: signal("category") });
        const y1 = createMockYAxis({
            axisId: signal("y-axis"),
            formatter: signal((val: unknown) => `$${Number(val).toLocaleString()}`)
        });
        const s1 = createMockLineSeries({ field: signal("val"), id: "s1" });

        const data = [
            { month: "Jan", val: 1200 },
            { month: "Feb", val: 3400 },
            { month: "Mar", val: 6800 },
            { month: "Apr", val: 8900 }
        ];

        const axisResolution = CartesianAxisRegistryResolver.resolve([x1], [y1]);
        const bindingResolution = CartesianSeriesAxisBindingResolver.resolve([s1], axisResolution);

        // Pass 1: Pre-measurement initial render (empty measurements map)
        const initialRes = CartesianMultiAxisCoordinator.coordinate({
            axisResolution,
            bindingResolution,
            chartHeight: 400,
            chartWidth: 600,
            labelMeasurements: new Map(),
            rootData: data,
            rootXField: "month"
        });

        const initialYScene = initialRes.axisScenes.find(a => a.axisId === "y-axis")!;
        const initialXScene = initialRes.axisScenes.find(a => a.axisId === "x-axis")!;

        // Simulate ResizeObserver measuring DOM label elements accurately
        const measurements = new Map<string, { height: number; width: number }>();
        for (const tick of [...initialYScene.ticks, ...initialXScene.ticks]) {
            if (tick.tickKey) {
                measurements.set(tick.tickKey, {
                    height: tick.unrotatedHeight ?? 16,
                    width: tick.unrotatedWidth ?? 40
                });
            }
        }

        // Pass 2: Post-measurement layout pass
        const measuredRes = CartesianMultiAxisCoordinator.coordinate({
            axisResolution,
            bindingResolution,
            chartHeight: 400,
            chartWidth: 600,
            labelMeasurements: measurements,
            rootData: data,
            rootXField: "month"
        });

        const measuredYScene = measuredRes.axisScenes.find(a => a.axisId === "y-axis")!;
        const measuredXScene = measuredRes.axisScenes.find(a => a.axisId === "x-axis")!;

        // Plot position and dimensions must be rock-solid identical (0 drift)
        expect(measuredRes.plotRect.x).toBe(initialRes.plotRect.x);
        expect(measuredRes.plotRect.y).toBe(initialRes.plotRect.y);
        expect(measuredRes.plotRect.width).toBe(initialRes.plotRect.width);
        expect(measuredRes.plotRect.height).toBe(initialRes.plotRect.height);

        // Axis gutters must be identical
        expect(measuredYScene.gutter).toBe(initialYScene.gutter);
        expect(measuredXScene.gutter).toBe(initialXScene.gutter);
    });

    it("should guarantee scale ranges in ScaleRegistry match the committed plotRect exactly (MAX-005)", () => {
        const x1 = createMockXAxis({ axisId: signal("x1") });
        const y1 = createMockYAxis({ axisId: signal("y1") });
        const axisResolution = CartesianAxisRegistryResolver.resolve([x1], [y1]);
        const bindingResolution = CartesianSeriesAxisBindingResolver.resolve([], axisResolution);

        const res = CartesianMultiAxisCoordinator.coordinate({
            axisResolution,
            bindingResolution,
            chartHeight: 400,
            chartWidth: 600,
            labelMeasurements: new Map(),
            rootData: [{ x1: "A", y1: 100 }]
        });

        const xScale = res.scaleRegistry.getXScale("x1")!;
        const yScale = res.scaleRegistry.getYScale("y1")!;

        expect(xScale.range()).toEqual([res.plotRect.x, res.plotRect.x + res.plotRect.width]);
        expect(yScale.range()).toEqual([res.plotRect.y + res.plotRect.height, res.plotRect.y]);
    });
});
