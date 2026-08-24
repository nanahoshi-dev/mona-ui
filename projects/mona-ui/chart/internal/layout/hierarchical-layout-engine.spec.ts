import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type { ChartSeriesRegistration, ChartTreemapSeriesRegistration } from "../context/chart-registration-context";
import type { ChartTreemapSeriesScene } from "../scene/hierarchical-scene";
import { ChartStyleResolver } from "../style/chart-style-resolver";
import { ChartLayoutEngine, resolveChartCoordinateSystem } from "./chart-layout-engine";

function createMockTreemapRegistration(data?: readonly unknown[] | unknown): ChartTreemapSeriesRegistration {
    return {
        borderRadius: signal(0),
        childrenField: signal("children"),
        color: signal("#3b82f6"),
        colorField: signal(undefined),
        colors: signal(undefined),
        data: signal(data),
        datumVisibilityRevision: signal(0),
        fillOpacity: signal(1),
        id: "tm-1",
        isDatumVisible: () => true,
        keyField: signal(undefined),
        labelField: signal("name"),
        labelFormatter: signal(undefined),
        labelTemplate: signal(undefined),
        maxDepth: signal(undefined),
        maxLabels: signal(100),
        minLabelHeight: signal(18),
        minLabelWidth: signal(32),
        name: signal("Treemap"),
        paddingInner: signal(2),
        paddingOuter: signal(4),
        parentFillOpacity: signal(0.15),
        parentHeaderHeight: signal(20),
        showLabels: signal(true),
        showParentLabels: signal(true),
        showValues: signal(true),
        sort: signal("descending"),
        strokeColor: signal("#ffffff"),
        strokeWidth: signal(1),
        tile: signal("squarify"),
        toggleDatumVisibility: () => true,
        type: "treemap",
        valueField: signal("value"),
        valueFormatter: signal(undefined),
        visible: signal(true)
    } as unknown as ChartTreemapSeriesRegistration;
}

describe("HierarchicalLayoutEngine & ChartLayoutEngine (Hierarchical)", () => {
    const styleResolver = new ChartStyleResolver();

    it("resolves coordinate system to hierarchical for treemap series", () => {
        const reg = createMockTreemapRegistration([{ name: "A", value: 10 }]);
        const coord = resolveChartCoordinateSystem([reg]);
        expect(coord).toBe("hierarchical");
    });

    it("warns when treemap is mixed with Cartesian or Polar series", () => {
        const warned = new Set<string>();
        const tm = createMockTreemapRegistration([{ name: "A", value: 10 }]);
        const bar = { type: "bar" } as unknown as ChartSeriesRegistration;

        const coord = resolveChartCoordinateSystem([tm, bar], warned);
        expect(coord).toBe("hierarchical");
        expect(warned.has("mixed-hierarchical")).toBe(true);
    });

    it("routes through ChartLayoutEngine to HierarchicalLayoutEngine and produces TreemapChartScene", () => {
        const reg = createMockTreemapRegistration([
            { name: "Group 1", children: [{ name: "Leaf 1", value: 50 }] }
        ]);

        const scene = ChartLayoutEngine.computeScene({
            containerHeight: 300,
            containerWidth: 400,
            rootData: [],
            series: [reg],
            styleResolver
        });

        expect(scene.coordinateSystem).toBe("hierarchical");
        expect(scene.hasRenderableData).toBe(true);
        expect(scene.series).toHaveLength(1);
        expect(scene.series[0].type).toBe("treemap");
    });

    it("uses options.rootData when series registration has undefined data", () => {
        const reg = createMockTreemapRegistration(undefined);
        const rootData = [
            { name: "Group Root", children: [{ name: "Leaf Root", value: 100 }] }
        ];

        const scene = ChartLayoutEngine.computeScene({
            containerHeight: 300,
            containerWidth: 400,
            rootData,
            series: [reg],
            styleResolver
        });

        expect(scene.coordinateSystem).toBe("hierarchical");
        expect(scene.hasRenderableData).toBe(true);
        const seriesScene = scene.series[0] as ChartTreemapSeriesScene;
        expect(seriesScene.nodes).toHaveLength(2);
    });
});
