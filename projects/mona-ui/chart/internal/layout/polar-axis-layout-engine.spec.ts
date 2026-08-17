import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type {
    ChartAngularAxisRegistration,
    ChartContinuousPolarSeriesRegistration,
    ChartRadarSeriesRegistration,
    ChartRadialAxisRegistration
} from "../context/chart-registration-context";
import type { PolarAxisChartScene } from "../scene/chart-scene";
import { ChartStyleResolver } from "../style/chart-style-resolver";
import { PolarAxisLayoutEngine } from "./polar-axis-layout-engine";

describe("PolarAxisLayoutEngine", () => {
    const styleResolver = new ChartStyleResolver();

    function createMockRadarSeries(
        overrides: Partial<ChartRadarSeriesRegistration> = {}
    ): ChartRadarSeriesRegistration {
        return {
            categoryField: signal("metric"),
            color: signal("#8b5cf6"),
            connectNulls: signal(false),
            curve: signal("linear"),
            data: signal(undefined),
            element: { nativeElement: {} as HTMLElement },
            field: signal("score"),
            fillMode: signal("gradient"),
            fillOpacity: signal(0.25),
            id: "radar-1",
            name: signal("Player A"),
            pointRadius: signal(3.5),
            showPoints: signal(true),
            strokeWidth: signal(2),
            type: "radar",
            valueFormatter: signal(undefined),
            visible: signal(true),
            ...overrides
        };
    }

    function createMockPolarSeries(
        overrides: Partial<ChartContinuousPolarSeriesRegistration> = {}
    ): ChartContinuousPolarSeriesRegistration {
        return {
            angleField: signal("angle"),
            color: signal("#3b82f6"),
            connectNulls: signal(false),
            curve: signal("linear"),
            data: signal(undefined),
            element: { nativeElement: {} as HTMLElement },
            field: signal("gain"),
            fillMode: signal("solid"),
            fillOpacity: signal(0.2),
            id: "polar-1",
            name: signal("Antenna"),
            pointRadius: signal(3),
            showPoints: signal(true),
            strokeWidth: signal(2),
            type: "polar",
            valueFormatter: signal(undefined),
            visible: signal(true),
            ...overrides
        };
    }

    function createMockAngularAxis(
        overrides: Partial<ChartAngularAxisRegistration> = {}
    ): ChartAngularAxisRegistration {
        return {
            axisLine: signal(true),
            formatter: signal(undefined),
            gridLines: signal(true),
            labelOffset: signal(10),
            labelTemplate: signal(undefined),
            labels: signal(true),
            rotation: signal(0),
            tickCount: signal(undefined),
            visible: signal(true),
            ...overrides
        };
    }

    function createMockRadialAxis(
        overrides: Partial<ChartRadialAxisRegistration> = {}
    ): ChartRadialAxisRegistration {
        return {
            axisLine: signal(true),
            formatter: signal(undefined),
            gridLines: signal(true),
            gridShape: signal("auto"),
            labelAngle: signal(0),
            labelOffset: signal(6),
            labelTemplate: signal(undefined),
            labels: signal(true),
            max: signal(undefined),
            min: signal(undefined),
            nice: signal(true),
            tickCount: signal(5),
            visible: signal(true),
            ...overrides
        };
    }

    it("should compute radar layout with category angular ticks and polygon grid", () => {
        const series = createMockRadarSeries();
        const rootData = [
            { metric: "Speed", score: 90 },
            { metric: "Power", score: 80 },
            { metric: "Stamina", score: 70 },
            { metric: "Agility", score: 85 }
        ];

        const scene: PolarAxisChartScene = PolarAxisLayoutEngine.computeScene({
            angularAxis: createMockAngularAxis(),
            containerHeight: 400,
            containerWidth: 400,
            radialAxis: createMockRadialAxis(),
            rootData,
            series: [series],
            styleResolver
        });

        expect(scene.coordinateSystem).toBe("polar");
        expect(scene.polarKind).toBe("axis");
        expect(scene.axisMode).toBe("radar");
        expect(scene.hasRenderableData).toBe(true);
        expect(scene.angularAxis.ticks.length).toBe(4);
        expect(scene.angularAxis.ticks[0].formattedValue).toBe("Speed");
        expect(scene.radialAxis.gridShape).toBe("polygon");
        expect(scene.series.length).toBe(1);
        expect(scene.hitTargets.length).toBe(4);
        expect(scene.interactionBuckets.length).toBe(4);
    });

    it("should compute polar layout with degrees angular ticks and circle grid", () => {
        const series = createMockPolarSeries();
        const rootData = [
            { angle: 0, gain: 10 },
            { angle: 90, gain: 30 },
            { angle: 180, gain: 20 },
            { angle: 270, gain: 40 }
        ];

        const scene: PolarAxisChartScene = PolarAxisLayoutEngine.computeScene({
            angularAxis: createMockAngularAxis({ tickCount: signal(12) }),
            containerHeight: 400,
            containerWidth: 400,
            radialAxis: createMockRadialAxis(),
            rootData,
            series: [series],
            styleResolver
        });

        expect(scene.axisMode).toBe("polar");
        expect(scene.angularAxis.ticks.length).toBe(12);
        expect(scene.radialAxis.gridShape).toBe("circle");
        expect(scene.series[0].points.length).toBe(4);
    });

    it("should honor explicit min/max and custom gridShape", () => {
        const series = createMockRadarSeries();
        const rootData = [
            { metric: "A", score: 10 },
            { metric: "B", score: 20 }
        ];

        const scene: PolarAxisChartScene = PolarAxisLayoutEngine.computeScene({
            angularAxis: createMockAngularAxis({ rotation: signal(45) }),
            containerHeight: 400,
            containerWidth: 400,
            radialAxis: createMockRadialAxis({
                gridShape: signal("circle"),
                max: signal(100),
                min: signal(-50)
            }),
            rootData,
            series: [series],
            styleResolver
        });

        expect(scene.angularAxis.rotation).toBe(45);
        expect(scene.radialAxis.gridShape).toBe("circle");
        expect(scene.radialAxis.domain[0]).toBe(-50);
        expect(scene.radialAxis.domain[1]).toBe(100);
    });

    it("should reserve visual extent for large pointRadius and strokeWidth", () => {
        const series = createMockRadarSeries({
            pointRadius: signal(12),
            showPoints: signal(true),
            strokeWidth: signal(6)
        });
        const rootData = [
            { metric: "A", score: 10 },
            { metric: "B", score: 20 },
            { metric: "C", score: 30 }
        ];

        const sceneWithLargeMarkers = PolarAxisLayoutEngine.computeScene({
            angularAxis: createMockAngularAxis(),
            containerHeight: 400,
            containerWidth: 400,
            radialAxis: createMockRadialAxis(),
            rootData,
            series: [series],
            styleResolver
        });

        const seriesSmall = createMockRadarSeries({
            pointRadius: signal(2),
            showPoints: signal(true),
            strokeWidth: signal(1)
        });

        const sceneWithSmallMarkers = PolarAxisLayoutEngine.computeScene({
            angularAxis: createMockAngularAxis(),
            containerHeight: 400,
            containerWidth: 400,
            radialAxis: createMockRadialAxis(),
            rootData,
            series: [seriesSmall],
            styleResolver
        });

        expect(sceneWithLargeMarkers.outerRadius).toBeLessThan(sceneWithSmallMarkers.outerRadius);
    });

    it("should apply auto-skip to angular tick label visibility when angular tick count is high", () => {
        const series = createMockPolarSeries();
        const rootData = [{ angle: 0, gain: 10 }];

        const scene = PolarAxisLayoutEngine.computeScene({
            angularAxis: createMockAngularAxis({ tickCount: signal(24) }),
            containerHeight: 400,
            containerWidth: 400,
            radialAxis: createMockRadialAxis(),
            rootData,
            series: [series],
            styleResolver
        });

        expect(scene.angularAxis.ticks.length).toBe(24);
        const visibleTicks = scene.angularAxis.ticks.filter(t => t.visible);
        // Step of 2 when tickCount <= 24 -> 12 visible
        expect(visibleTicks.length).toBe(12);
    });

    it("should generate stable tick keys for angular and radial ticks", () => {
        const series = createMockRadarSeries();
        const rootData = [
            { metric: "Strength", score: 80 },
            { metric: "Agility", score: 90 }
        ];

        const scene = PolarAxisLayoutEngine.computeScene({
            angularAxis: createMockAngularAxis(),
            containerHeight: 400,
            containerWidth: 400,
            radialAxis: createMockRadialAxis(),
            rootData,
            series: [series],
            styleResolver
        });

        expect(scene.angularAxis.ticks[0].tickKey).toBe("cat:Strength");
        expect(scene.radialAxis.ticks[0].tickKey).toContain("val:");
        expect(scene.radialAxis.ticks[0].visible).toBe(true);
    });
});
