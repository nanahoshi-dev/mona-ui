import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type {
    ChartCartesianSeriesRegistration,
    ChartXAxisRegistration,
    ChartYAxisRegistration
} from "../context/chart-registration-context";
import { ChartStyleResolver } from "../style/chart-style-resolver";
import { CartesianLayoutEngine } from "./cartesian-layout-engine";
import { CartesianHorizontalBarLayoutEngine } from "./cartesian-horizontal-bar-layout-engine";
import type { InternalCartesianViewportState } from "../viewport/cartesian-viewport-normalizer";

function createMockSeries(
    id: string = "s1",
    data: readonly { x: number; y: number }[] = [
        { x: 0, y: 10 },
        { x: 50, y: 25 },
        { x: 100, y: 50 }
    ]
): ChartCartesianSeriesRegistration {
    return {
        color: signal("#3f6be2"),
        data: signal(data),
        element: { nativeElement: {} as HTMLElement },
        field: signal("y"),
        id,
        name: signal(id),
        type: "line",
        visible: signal(true),
        xAxisId: signal(undefined),
        xField: signal("x"),
        yAxisId: signal(undefined)
    };
}

describe("Cartesian Stage Isolation and Fast-Path Layout", () => {
    const styleResolver = new ChartStyleResolver();
    const xAxis: ChartXAxisRegistration = {
        axisId: signal("x-1"),
        axisLine: signal(true),
        formatter: signal(undefined),
        gridLines: signal(true),
        labels: signal(true),
        labelTemplate: signal(undefined),
        max: signal(undefined),
        min: signal(undefined),
        nice: signal(false),
        position: signal("bottom"),
        registrationId: "x-1-reg",
        tickCount: signal(undefined),
        title: signal("X Axis"),
        type: signal("linear"),
        visible: signal(true)
    };

    const yAxis: ChartYAxisRegistration = {
        axisId: signal("y-1"),
        axisLine: signal(true),
        formatter: signal(undefined),
        gridLines: signal(true),
        labels: signal(true),
        labelTemplate: signal(undefined),
        max: signal(undefined),
        min: signal(undefined),
        nice: signal(false),
        position: signal("left"),
        registrationId: "y-1-reg",
        tickCount: signal(undefined),
        title: signal("Y Axis"),
        type: signal("linear"),
        visible: signal(true)
    };

    it("should compute full layout (Stage A, B, C) on initial compute", () => {
        const series = [createMockSeries()];
        const computation = CartesianLayoutEngine.compute({
            containerHeight: 300,
            containerWidth: 500,
            series,
            styleResolver,
            xAxis,
            xAxes: [xAxis],
            yAxis,
            yAxes: [yAxis]
        });

        expect(computation.runtime).toBeDefined();
        const runtime = computation.runtime!;
        expect(runtime.preparation).toBeDefined();
        expect(runtime.chrome).toBeDefined();
        expect(runtime.baseCoordinateSpace).toBeDefined();
        expect(computation.scene).toBeDefined();
        expect(computation.scene.series.length).toBe(1);
    });

    it("should execute fast-path viewport projection (Stage C only) without re-running preparation", () => {
        const series = [createMockSeries()];
        const computation = CartesianLayoutEngine.compute({
            containerHeight: 300,
            containerWidth: 500,
            series,
            styleResolver,
            xAxis,
            xAxes: [xAxis],
            yAxis,
            yAxes: [yAxis]
        });

        expect(computation.runtime).toBeDefined();
        const runtime = computation.runtime!;
        const initialPlotRect = runtime.plotRect;

        const viewport: InternalCartesianViewportState = {
            x: new Map([["x-1", { axis: "x", axisId: "x-1", kind: "continuous", min: 20, max: 80 }]]),
            y: new Map()
        };

        const fastProj = CartesianLayoutEngine.projectViewportFastPath(runtime, viewport);

        expect(fastProj.scene).toBeDefined();
        expect(fastProj.runtime).toBeDefined();
        // Runtime and chrome remain identical
        expect(fastProj.runtime!.chrome).toBe(runtime.chrome);
        expect(fastProj.runtime!.plotRect).toEqual(initialPlotRect);
        expect(fastProj.scene.viewport).toBeDefined();
    });

    it("should recompute Stage B (chrome only) via recomputeChrome on label measurements update", () => {
        const series = [createMockSeries()];
        const computation = CartesianLayoutEngine.compute({
            containerHeight: 300,
            containerWidth: 500,
            series,
            styleResolver,
            xAxis,
            xAxes: [xAxis],
            yAxis,
            yAxes: [yAxis]
        });

        expect(computation.runtime).toBeDefined();
        const runtime = computation.runtime!;

        const updatedMeasurements = new Map<string, { height: number; width: number }>([
            ["axis:y:y-1:linear:50", { height: 16, width: 80 }]
        ]);

        const updatedRuntime = CartesianLayoutEngine.recomputeChrome(
            runtime,
            500,
            300,
            updatedMeasurements
        );

        // Preparation is preserved (Stage A was not re-run)
        expect(updatedRuntime.preparation).toBe(runtime.preparation);
        // Base coordinate space was updated for new chrome
        expect(updatedRuntime.baseCoordinateSpace).toBeDefined();
        expect(updatedRuntime.chrome).not.toBe(runtime.chrome);
    });

    it("should reconcile viewport against baseCoordinateSpace before Stage C projection", () => {
        const series = [createMockSeries()];
        // Provide out-of-bounds viewport with span 60 in compute options
        const outOfBoundsViewport: InternalCartesianViewportState = {
            x: new Map([["x-1", { axis: "x", axisId: "x-1", kind: "continuous", min: -20, max: 40 }]]),
            y: new Map()
        };

        const computation = CartesianLayoutEngine.compute({
            containerHeight: 300,
            containerWidth: 500,
            series,
            styleResolver,
            viewport: outOfBoundsViewport,
            xAxis,
            xAxes: [xAxis],
            yAxis,
            yAxes: [yAxis]
        });

        expect(computation.scene.viewport).toBeDefined();
        const xWin = computation.scene.viewport?.axes.find(a => a.axisId === "x-1");
        expect(xWin).toBeDefined();
        if (xWin && xWin.kind === "continuous") {
            // Reconciler shifted clamped window to [0, 60]
            expect(xWin.min).toBe(0);
            expect(xWin.max).toBe(60);
        }
    });

    it("should support horizontal bar recomputeChrome and projectViewportFastPath", () => {
        const series = [createMockSeries()];
        const computation = CartesianHorizontalBarLayoutEngine.compute({
            containerHeight: 300,
            containerWidth: 500,
            series,
            styleResolver,
            xAxis,
            xAxes: [xAxis],
            yAxis,
            yAxes: [yAxis]
        });

        expect(computation.runtime).toBeDefined();
        const runtime = computation.runtime!;
        expect(runtime.orientation).toBe("horizontal");

        const recomputedRuntime = CartesianHorizontalBarLayoutEngine.recomputeChrome(
            runtime,
            500,
            300
        );
        expect(recomputedRuntime.preparation).toBe(runtime.preparation);

        const viewport: InternalCartesianViewportState = {
            x: new Map(),
            y: new Map([["y-1", { axis: "y", axisId: "y-1", kind: "continuous", min: 10, max: 40 }]])
        };

        const fastProj = CartesianHorizontalBarLayoutEngine.projectViewportFastPath(
            recomputedRuntime,
            viewport
        );
        expect(fastProj.scene.viewport).toBeDefined();
    });
});

