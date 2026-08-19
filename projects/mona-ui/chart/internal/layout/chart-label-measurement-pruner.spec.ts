import { describe, expect, it } from "vitest";
import type { ChartLabelMeasurement } from "../../models/chart-polar.models";
import type {
    CartesianXYChartScene,
    ChartScene,
    PolarSectorChartScene,
    TreemapChartScene
} from "../scene/chart-scene";
import { ChartLabelMeasurementPruner } from "./chart-label-measurement-pruner";
import { createCartesianAxisMeasurementKey } from "./cartesian-axis-measurement-key";

describe("ChartLabelMeasurementPruner (HAX-F07 / PZVF-011)", () => {
    it("retains active Cartesian axis keys and prunes inactive Cartesian and Polar keys", () => {
        const keyQ1 = createCartesianAxisMeasurementKey("x", "x-main", "category", "Q1");
        const keyQ2 = createCartesianAxisMeasurementKey("x", "x-main", "category", "Q2");
        const keyStale = createCartesianAxisMeasurementKey("x", "x-main", "category", "Stale");
        const keyY100 = createCartesianAxisMeasurementKey("y", "y-revenue", "linear", 100);
        const keyInactiveAxis = createCartesianAxisMeasurementKey("y", "y-removed", "linear", 50);

        const measurements = new Map<string, ChartLabelMeasurement>([
            [keyQ1, { height: 16, width: 30 }],
            [keyQ2, { height: 16, width: 30 }],
            [keyStale, { height: 16, width: 30 }],
            [keyY100, { height: 16, width: 40 }],
            [keyInactiveAxis, { height: 16, width: 40 }],
            ["sector:slice-1", { height: 20, width: 50 }],
            ["angular:0", { height: 14, width: 25 }]
        ]);

        const cartesianScene: Partial<CartesianXYChartScene> = {
            axes: [
                {
                    axis: "x",
                    axisId: "x-main",
                    axisLine: true,
                    gridLines: false,
                    position: "bottom",
                    ticks: [
                        { coordinate: 50, formattedValue: "Q1", index: 0, labelVisible: true, tickKey: keyQ1, value: "Q1" },
                        { coordinate: 150, formattedValue: "Q2", index: 1, labelVisible: true, tickKey: keyQ2, value: "Q2" }
                    ],
                    title: "",
                    visible: true
                },
                {
                    axis: "y",
                    axisId: "y-revenue",
                    axisLine: true,
                    gridLines: true,
                    position: "left",
                    ticks: [
                        { coordinate: 100, formattedValue: "100", index: 0, labelVisible: true, tickKey: keyY100, value: 100 }
                    ],
                    title: "",
                    visible: true
                }
            ],
            cartesianKind: "xy",
            coordinateSystem: "cartesian"
        };

        ChartLabelMeasurementPruner.prune(measurements, cartesianScene as ChartScene);

        expect(measurements.has(keyQ1)).toBe(true);
        expect(measurements.has(keyQ2)).toBe(true);
        expect(measurements.has(keyY100)).toBe(true);
        // Stale tick on active axis, tick on inactive axis, and Polar keys must be removed
        expect(measurements.has(keyStale)).toBe(false);
        expect(measurements.has(keyInactiveAxis)).toBe(false);
        expect(measurements.has("sector:slice-1")).toBe(false);
        expect(measurements.has("angular:0")).toBe(false);
    });

    it("handles complex axis IDs and ISO timestamp tick values containing colons", () => {
        const timeKey = createCartesianAxisMeasurementKey("x", "telemetry/time:sensor-1", "time", "2026-08-19T00:00:00.000Z");
        const measurements = new Map<string, ChartLabelMeasurement>([
            [timeKey, { height: 16, width: 120 }]
        ]);

        const cartesianScene: Partial<CartesianXYChartScene> = {
            axes: [
                {
                    axis: "x",
                    axisId: "telemetry/time:sensor-1",
                    axisLine: true,
                    gridLines: false,
                    position: "bottom",
                    ticks: [
                        {
                            coordinate: 50,
                            formattedValue: "2026-08-19",
                            index: 0,
                            labelVisible: true,
                            tickKey: timeKey,
                            value: "2026-08-19T00:00:00.000Z"
                        }
                    ],
                    title: "",
                    visible: true
                }
            ],
            cartesianKind: "xy",
            coordinateSystem: "cartesian"
        };

        ChartLabelMeasurementPruner.prune(measurements, cartesianScene as ChartScene);
        expect(measurements.has(timeKey)).toBe(true);
    });

    it("prunes Cartesian keys when transitioning to Polar Sector scene", () => {
        const keyQ1 = createCartesianAxisMeasurementKey("x", "default-x", "category", "Q1");
        const keyY100 = createCartesianAxisMeasurementKey("y", "default-y", "linear", 100);

        const measurements = new Map<string, ChartLabelMeasurement>([
            [keyQ1, { height: 16, width: 30 }],
            [keyY100, { height: 16, width: 40 }],
            ["sector:slice-1", { height: 20, width: 50 }],
            ["sector:slice-stale", { height: 20, width: 50 }]
        ]);

        const sectorScene: Partial<PolarSectorChartScene> = {
            coordinateSystem: "polar",
            polarKind: "sector",
            series: [
                {
                    id: "pie-1",
                    slices: [
                        {
                            percentage: 100,
                            sliceId: "slice-1",
                            startAngle: 0,
                            endAngle: Math.PI * 2,
                            value: 100
                        } as any
                    ],
                    type: "pie"
                } as any
            ]
        };

        ChartLabelMeasurementPruner.prune(measurements, sectorScene as ChartScene);

        // Cartesian keys must be pruned
        expect(measurements.has(keyQ1)).toBe(false);
        expect(measurements.has(keyY100)).toBe(false);
        // Active slice retained, stale slice pruned
        expect(measurements.has("sector:slice-1")).toBe(true);
        expect(measurements.has("sector:slice-stale")).toBe(false);
    });

    it("prunes Cartesian and Polar keys when transitioning to Hierarchical (Treemap) scene", () => {
        const keyQ1 = createCartesianAxisMeasurementKey("x", "default-x", "category", "Q1");
        const keyY100 = createCartesianAxisMeasurementKey("y", "default-y", "linear", 100);

        const measurements = new Map<string, ChartLabelMeasurement>([
            [keyQ1, { height: 16, width: 30 }],
            [keyY100, { height: 16, width: 40 }],
            ["sector:slice-1", { height: 20, width: 50 }],
            ["angular:0", { height: 14, width: 25 }]
        ]);

        const treemapScene: Partial<TreemapChartScene> = {
            coordinateSystem: "hierarchical",
            hierarchicalKind: "treemap"
        } as any;

        ChartLabelMeasurementPruner.prune(measurements, treemapScene as ChartScene);

        expect(measurements.size).toBe(0);
    });
});
