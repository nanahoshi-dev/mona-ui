import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type {
    ChartBarSeriesRegistration,
    ChartLineSeriesRegistration,
    ChartXAxisRegistration,
    ChartYAxisRegistration
} from "../context/chart-registration-context";
import { CartesianAxisRegistryResolver } from "./cartesian-axis-registry-resolver";
import { CartesianSeriesAxisBindingResolver } from "./cartesian-series-axis-binding-resolver";

describe("CartesianSeriesAxisBindingResolver", () => {
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

    const createMockBarSeries = (overrides: Partial<ChartBarSeriesRegistration> = {}): ChartBarSeriesRegistration => ({
        borderRadius: signal(undefined),
        color: signal("#3b82f6"),
        data: signal(undefined),
        element: { nativeElement: {} as HTMLElement },
        field: signal("val"),
        fillOpacity: signal(undefined),
        id: "series-bar",
        name: signal("Bar Series"),
        orientation: signal("vertical"),
        stack: signal(undefined),
        stackMode: signal("normal"),
        type: "bar",
        valueFormatter: signal(undefined),
        visible: signal(true),
        xAxisId: signal(undefined),
        xField: signal(undefined),
        yAxisId: signal(undefined),
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

    it("should bind series to default primary axes when no explicit axis IDs are configured", () => {
        const x1 = createMockXAxis();
        const y1 = createMockYAxis();
        const axisResolution = CartesianAxisRegistryResolver.resolve([x1], [y1]);

        const s1 = createMockBarSeries({ id: "s1" });
        const bindingResolution = CartesianSeriesAxisBindingResolver.resolve([s1], axisResolution);

        expect(bindingResolution.warnings.length).toBe(0);
        const binding = bindingResolution.bindings.get("s1");
        expect(binding).toBeDefined();
        expect(binding?.xAxisId).toBe("default-x");
        expect(binding?.yAxisId).toBe("default-y");
        expect(binding?.isValid).toBe(true);

        expect(bindingResolution.seriesByXAxis.get("default-x")?.length).toBe(1);
        expect(bindingResolution.seriesByYAxis.get("default-y")?.length).toBe(1);
    });

    it("should bind series to specified xAxisId and yAxisId", () => {
        const x1 = createMockXAxis({ axisId: signal("x1") });
        const x2 = createMockXAxis({ axisId: signal("x2"), position: signal("top") });
        const y1 = createMockYAxis({ axisId: signal("y1") });
        const y2 = createMockYAxis({ axisId: signal("y2"), position: signal("right") });
        const axisResolution = CartesianAxisRegistryResolver.resolve([x1, x2], [y1, y2]);

        const s1 = createMockBarSeries({ id: "s1", xAxisId: signal("x1"), yAxisId: signal("y1") });
        const s2 = createMockLineSeries({ id: "s2", xAxisId: signal("x2"), yAxisId: signal("y2") });

        const bindingResolution = CartesianSeriesAxisBindingResolver.resolve([s1, s2], axisResolution);
        expect(bindingResolution.warnings.length).toBe(0);

        const b1 = bindingResolution.bindings.get("s1")!;
        expect(b1.xAxisId).toBe("x1");
        expect(b1.yAxisId).toBe("y1");

        const b2 = bindingResolution.bindings.get("s2")!;
        expect(b2.xAxisId).toBe("x2");
        expect(b2.yAxisId).toBe("y2");

        expect(bindingResolution.seriesByXAxis.get("x1")?.map(s => s.id)).toEqual(["s1"]);
        expect(bindingResolution.seriesByXAxis.get("x2")?.map(s => s.id)).toEqual(["s2"]);
        expect(bindingResolution.seriesByYAxis.get("y1")?.map(s => s.id)).toEqual(["s1"]);
        expect(bindingResolution.seriesByYAxis.get("y2")?.map(s => s.id)).toEqual(["s2"]);
    });

    it("should mark binding invalid and produce warning diagnostics when target axis does not exist", () => {
        const x1 = createMockXAxis({ axisId: signal("x1") });
        const y1 = createMockYAxis({ axisId: signal("y1") });
        const axisResolution = CartesianAxisRegistryResolver.resolve([x1], [y1]);

        const s1 = createMockBarSeries({ id: "s1", xAxisId: signal("non-existent-x"), yAxisId: signal("non-existent-y") });
        const bindingResolution = CartesianSeriesAxisBindingResolver.resolve([s1], axisResolution);

        expect(bindingResolution.warnings.length).toBe(2);
        expect(bindingResolution.warnings[0]).toContain('unknown X axis "non-existent-x"');
        expect(bindingResolution.warnings[1]).toContain('unknown Y axis "non-existent-y"');

        const b1 = bindingResolution.bindings.get("s1")!;
        expect(b1.xAxisId).toBeUndefined();
        expect(b1.yAxisId).toBeUndefined();
        expect(b1.isValid).toBe(false);
        expect(bindingResolution.unboundSeries.map(s => s.id)).toEqual(["s1"]);
    });
});
