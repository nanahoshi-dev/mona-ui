import { describe, expect, it } from "vitest";
import type { ChartLabelMeasurement } from "../../models/chart-polar.models";
import type {
    CartesianXYChartScene,
    ChartScene,
    PolarAxisChartScene,
    PolarSectorChartScene,
    TreemapChartScene
} from "../scene/chart-scene";
import { ChartLabelMeasurementPruner } from "./chart-label-measurement-pruner";

describe("ChartLabelMeasurementPruner (HAX-F07)", () => {
    it("retains active Cartesian axis keys and prunes inactive Cartesian and Polar keys", () => {
        const measurements = new Map<string, ChartLabelMeasurement>([
            ["axis:x:Q1", { height: 16, width: 30 }],
            ["axis:x:Q2", { height: 16, width: 30 }],
            ["axis:x:Stale", { height: 16, width: 30 }],
            ["axis:y:100", { height: 16, width: 40 }],
            ["sector:slice-1", { height: 20, width: 50 }],
            ["angular:0", { height: 14, width: 25 }]
        ]);

        const cartesianScene: Partial<CartesianXYChartScene> = {
            axes: [
                {
                    axis: "x",
                    axisLine: true,
                    gridLines: false,
                    position: "bottom",
                    ticks: [
                        { coordinate: 50, formattedValue: "Q1", index: 0, labelVisible: true, tickKey: "axis:x:Q1", value: "Q1" },
                        { coordinate: 150, formattedValue: "Q2", index: 1, labelVisible: true, tickKey: "axis:x:Q2", value: "Q2" }
                    ],
                    title: "",
                    visible: true
                },
                {
                    axis: "y",
                    axisLine: true,
                    gridLines: true,
                    position: "left",
                    ticks: [
                        { coordinate: 100, formattedValue: "100", index: 0, labelVisible: true, tickKey: "axis:y:100", value: 100 }
                    ],
                    title: "",
                    visible: true
                }
            ],
            cartesianKind: "xy",
            coordinateSystem: "cartesian"
        };

        ChartLabelMeasurementPruner.prune(measurements, cartesianScene as ChartScene);

        expect(measurements.has("axis:x:Q1")).toBe(true);
        expect(measurements.has("axis:x:Q2")).toBe(true);
        expect(measurements.has("axis:y:100")).toBe(true);
        // Stale Cartesian and Polar keys must be removed
        expect(measurements.has("axis:x:Stale")).toBe(false);
        expect(measurements.has("sector:slice-1")).toBe(false);
        expect(measurements.has("angular:0")).toBe(false);
    });

    it("prunes Cartesian keys when transitioning to Polar Sector scene", () => {
        const measurements = new Map<string, ChartLabelMeasurement>([
            ["axis:x:Q1", { height: 16, width: 30 }],
            ["axis:y:100", { height: 16, width: 40 }],
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
        expect(measurements.has("axis:x:Q1")).toBe(false);
        expect(measurements.has("axis:y:100")).toBe(false);
        // Active slice retained, stale slice pruned
        expect(measurements.has("sector:slice-1")).toBe(true);
        expect(measurements.has("sector:slice-stale")).toBe(false);
    });

    it("prunes Cartesian and Polar keys when transitioning to Hierarchical (Treemap) scene", () => {
        const measurements = new Map<string, ChartLabelMeasurement>([
            ["axis:x:Q1", { height: 16, width: 30 }],
            ["axis:y:100", { height: 16, width: 40 }],
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
