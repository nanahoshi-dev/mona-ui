import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type { ChartHeatmapSeriesRegistration } from "../context/chart-registration-context";
import { ChartStyleResolver } from "../style/chart-style-resolver";
import { HeatmapLayoutEngine } from "./heatmap-layout-engine";

describe("HeatmapLayoutEngine", () => {
    const styleResolver = new ChartStyleResolver();

    function createMockSeries(overrides: Partial<Record<string, unknown>> = {}): ChartHeatmapSeriesRegistration {
        return {
            borderRadius: signal<number | undefined>(undefined),
            cellGap: signal(2),
            color: signal("#3b82f6"),
            colorMode: signal("sequential"),
            colors: signal(undefined),
            data: signal(undefined),
            field: signal("val"),
            fillOpacity: signal<number | undefined>(undefined),
            id: "heatmap-1",
            keyField: signal(undefined),
            max: signal<number | undefined>(undefined),
            midpoint: signal<number | undefined>(undefined),
            min: signal<number | undefined>(undefined),
            name: signal("Activity"),
            showValues: signal(false),
            strokeColor: signal(""),
            strokeWidth: signal<number | undefined>(undefined),
            type: "heatmap",
            valueFormatter: signal(undefined),
            visible: signal(true),
            xCategories: signal(undefined),
            xField: signal("day"),
            yCategories: signal(undefined),
            yField: signal("hour"),
            ...overrides
        } as ChartHeatmapSeriesRegistration;
    }

    it("should compute scene with correct band dimensions and cell geometry", () => {
        const rootData = [
            { day: "Mon", hour: "10am", val: 10 },
            { day: "Mon", hour: "11am", val: 20 },
            { day: "Tue", hour: "10am", val: 30 },
            { day: "Tue", hour: "11am", val: 40 }
        ];

        const series = createMockSeries();
        const scene = HeatmapLayoutEngine.computeScene({
            containerHeight: 400,
            containerWidth: 600,
            rootData,
            series,
            styleResolver
        });

        expect(scene.cartesianKind).toBe("heatmap");
        expect(scene.coordinateSystem).toBe("cartesian");
        expect(scene.hasRenderableData).toBe(true);
        expect(scene.xCategories.length).toBe(2);
        expect(scene.yCategories.length).toBe(2);
        expect(scene.series.length).toBe(1);

        const hmSeries = scene.series[0];
        expect(hmSeries.cells.length).toBe(4);
        expect(scene.hitTargets.length).toBe(4);

        // Check bounds
        const cell = hmSeries.cells[0];
        expect(cell.width).toBeGreaterThan(0);
        expect(cell.height).toBeGreaterThan(0);
        expect(cell.x).toBeGreaterThanOrEqual(scene.plotRect.x);
        expect(cell.y).toBeGreaterThanOrEqual(scene.plotRect.y);
    });

    it("should center axis ticks in cell bands", () => {
        const rootData = [
            { day: "Mon", hour: "10am", val: 10 },
            { day: "Tue", hour: "10am", val: 20 }
        ];

        const series = createMockSeries();
        const scene = HeatmapLayoutEngine.computeScene({
            containerHeight: 400,
            containerWidth: 600,
            rootData,
            series,
            styleResolver
        });

        const xAxis = scene.axes.find(a => a.axis === "x");
        const yAxis = scene.axes.find(a => a.axis === "y");

        expect(xAxis).toBeDefined();
        expect(yAxis).toBeDefined();
        expect(xAxis?.ticks.length).toBe(2);
        expect(yAxis?.ticks.length).toBe(1);

        // Ticks should fall inside the plotRect
        for (const tick of xAxis!.ticks) {
            expect(tick.coordinate).toBeGreaterThanOrEqual(scene.plotRect.x);
            expect(tick.coordinate).toBeLessThanOrEqual(scene.plotRect.x + scene.plotRect.width);
        }
    });

    it("should support sparse matrices by materializing only valid cell entries", () => {
        const rootData = [
            { day: "Mon", hour: "10am", val: 10 },
            // Mon 11am missing
            { day: "Tue", hour: "11am", val: 40 }
        ];

        const series = createMockSeries({
            xCategories: signal(["Mon", "Tue"]),
            yCategories: signal(["10am", "11am"])
        });

        const scene = HeatmapLayoutEngine.computeScene({
            containerHeight: 400,
            containerWidth: 600,
            rootData,
            series,
            styleResolver
        });

        expect(scene.xCategories.length).toBe(2);
        expect(scene.yCategories.length).toBe(2);
        expect(scene.series[0].cells.length).toBe(2);
        expect(scene.cellIndex.cellCount).toBe(2);

        // Target at Mon (0), 10am (0) should exist
        expect(scene.cellIndex.get(0, 0)).toBeDefined();
        // Target at Mon (0), 11am (1) should be undefined
        expect(scene.cellIndex.get(0, 1)).toBeUndefined();
    });

    it("should handle hidden series or empty dimensions gracefully", () => {
        const series = createMockSeries({
            visible: signal(false)
        });

        const scene = HeatmapLayoutEngine.computeScene({
            containerHeight: 400,
            containerWidth: 600,
            rootData: [{ day: "Mon", hour: "10am", val: 10 }],
            series,
            styleResolver
        });

        expect(scene.hasRenderableData).toBe(false);
        expect(scene.series.length).toBe(0);
    });
});
