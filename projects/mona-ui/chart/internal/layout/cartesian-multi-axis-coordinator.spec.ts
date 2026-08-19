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
});
