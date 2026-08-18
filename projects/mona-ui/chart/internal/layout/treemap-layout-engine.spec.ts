import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type { ChartTreemapSeriesRegistration } from "../context/chart-registration-context";
import { ChartStyleResolver } from "../style/chart-style-resolver";
import { TreemapLayoutEngine } from "./treemap-layout-engine";

function createMockTreemapRegistration(
    data?: readonly unknown[] | unknown,
    overrides: Partial<{
        [K in keyof ChartTreemapSeriesRegistration]: ChartTreemapSeriesRegistration[K] extends (...args: any[]) => any
            ? ChartTreemapSeriesRegistration[K]
            : any;
    }> = {}
): ChartTreemapSeriesRegistration {
    const hiddenSet = new Set<string>();

    return {
        borderRadius: signal(0),
        childrenField: signal("children"),
        color: signal("#3b82f6"),
        colorField: signal(undefined),
        colors: signal(undefined),
        data: signal(data),
        datumVisibilityRevision: signal(0),
        fillOpacity: signal(1),
        id: "tm-series-1",
        isDatumVisible: (itemId: string) => !hiddenSet.has(itemId),
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
        toggleDatumVisibility: (itemId: string) => {
            if (hiddenSet.has(itemId)) {
                hiddenSet.delete(itemId);
            } else {
                hiddenSet.add(itemId);
            }
            return !hiddenSet.has(itemId);
        },
        type: "treemap",
        valueField: signal("value"),
        valueFormatter: signal(undefined),
        visible: signal(true),
        ...overrides
    } as unknown as ChartTreemapSeriesRegistration;
}

describe("TreemapLayoutEngine", () => {
    const styleResolver = new ChartStyleResolver();
    const plotRect = { height: 400, width: 600, x: 0, y: 0 };

    it("lays out nested hierarchy with positive values and squarify tiling", () => {
        const data = [
            {
                name: "Compute",
                children: [
                    { name: "API", value: 60 },
                    { name: "Workers", value: 40 }
                ]
            },
            {
                name: "Storage",
                children: [
                    { name: "Database", value: 100 }
                ]
            }
        ];

        const reg = createMockTreemapRegistration(data);
        const scene = TreemapLayoutEngine.layout(reg, plotRect, 600, 400, styleResolver);

        expect(scene.hasRenderableData).toBe(true);
        expect(scene.coordinateSystem).toBe("hierarchical");
        expect(scene.hierarchicalKind).toBe("treemap");
        expect(scene.series).toHaveLength(1);

        const seriesScene = scene.series[0];
        expect(seriesScene.nodes.length).toBe(5); // 2 parents + 3 leaves
        expect(scene.legendItems).toHaveLength(2); // Compute & Storage

        // Compute bounds check
        const computeNode = seriesScene.nodes.find(n => n.formattedLabel === "Compute");
        expect(computeNode).toBeDefined();
        expect(computeNode!.bounds.width).toBeGreaterThan(0);
        expect(computeNode!.bounds.height).toBeGreaterThan(0);
        expect(computeNode!.headerBounds).toBeDefined();
        expect(computeNode!.headerBounds!.height).toBe(20);

        // API node bounds check
        const apiNode = seriesScene.nodes.find(n => n.formattedLabel === "API");
        expect(apiNode).toBeDefined();
        expect(apiNode!.isLeaf).toBe(true);
        expect(apiNode!.bounds.width).toBeGreaterThan(0);
        expect(apiNode!.bounds.height).toBeGreaterThan(0);
    });

    it("supports different tiling modes (binary, dice, slice, slice-dice)", () => {
        const data = [
            { name: "A", value: 50 },
            { name: "B", value: 50 }
        ];

        const regSlice = createMockTreemapRegistration(data, { tile: signal("slice") });
        const sceneSlice = TreemapLayoutEngine.layout(regSlice, plotRect, 600, 400, styleResolver);
        expect(sceneSlice.hasRenderableData).toBe(true);
        expect(sceneSlice.series[0].tile).toBe("slice");

        const regDice = createMockTreemapRegistration(data, { tile: signal("dice") });
        const sceneDice = TreemapLayoutEngine.layout(regDice, plotRect, 600, 400, styleResolver);
        expect(sceneDice.hasRenderableData).toBe(true);
        expect(sceneDice.series[0].tile).toBe("dice");
    });

    it("respects maxDepth property to prune deep levels", () => {
        const data = [
            {
                name: "Level 1",
                children: [
                    {
                        name: "Level 2",
                        children: [
                            { name: "Level 3", value: 100 }
                        ]
                    }
                ]
            }
        ];

        const reg = createMockTreemapRegistration(data, { maxDepth: signal(2) });
        const scene = TreemapLayoutEngine.layout(reg, plotRect, 600, 400, styleResolver);

        const seriesScene = scene.series[0];
        const depth3Node = seriesScene.nodes.find(n => n.depth === 3);
        expect(depth3Node).toBeUndefined(); // Pruned
        const depth2Node = seriesScene.nodes.find(n => n.depth === 2);
        expect(depth2Node).toBeDefined();
    });

    it("respects maxLabels cap by prioritizing parent headers then largest terminal areas", () => {
        const children = Array.from({ length: 30 }, (_, i) => ({
            name: `Item ${i}`,
            value: (i + 1) * 10
        }));

        const data = [
            { name: "Parent Group", children }
        ];

        const reg = createMockTreemapRegistration(data, { maxLabels: signal(5) });
        const scene = TreemapLayoutEngine.layout(reg, plotRect, 600, 400, styleResolver);

        const labels = scene.series[0].labels;
        expect(labels.length).toBeLessThanOrEqual(5);
        expect(labels.some(l => l.kind === "parent")).toBe(true); // Parent label prioritized
    });

    it("builds bidirectional navigation index for keyboard navigation", () => {
        const data = [
            {
                name: "Compute",
                children: [
                    { name: "API", value: 60 },
                    { name: "Workers", value: 40 }
                ]
            }
        ];

        const reg = createMockTreemapRegistration(data);
        const scene = TreemapLayoutEngine.layout(reg, plotRect, 600, 400, styleResolver);

        const navIndex = scene.navigationIndex;
        expect(navIndex.firstNodeId).toBeDefined();
        expect(navIndex.lastNodeId).toBeDefined();

        const computeEntry = navIndex.entries.get(navIndex.firstNodeId!);
        expect(computeEntry).toBeDefined();
        expect(computeEntry!.firstChildId).toBeDefined();
    });

    it("returns hasRenderableData=false when series is invisible or all-zero", () => {
        const data = [{ name: "Zero", value: 0 }];
        const reg = createMockTreemapRegistration(data);
        const scene = TreemapLayoutEngine.layout(reg, plotRect, 600, 400, styleResolver);

        expect(scene.hasRenderableData).toBe(false);
        expect(scene.series[0].nodes).toHaveLength(0);
    });

    it("falls back to rootData when series registration has undefined data", () => {
        const rootData = [
            {
                name: "Platform",
                children: [
                    { name: "Web", value: 80 },
                    { name: "Mobile", value: 40 }
                ]
            }
        ];
        const reg = createMockTreemapRegistration(undefined);
        const scene = TreemapLayoutEngine.layout(reg, plotRect, 600, 400, styleResolver, rootData);

        expect(scene.hasRenderableData).toBe(true);
        expect(scene.series[0].nodes.length).toBe(3); // 1 parent + 2 leaves
        expect(scene.legendItems).toHaveLength(1);
    });

    it("preserves all legend items with visible=false when a top-level branch is toggled off", () => {
        const data = [
            {
                name: "Frontend",
                children: [{ name: "Angular", value: 100 }]
            },
            {
                name: "Backend",
                children: [{ name: "Node", value: 100 }]
            }
        ];

        const hiddenSet = new Set<string>(["root/l:s:Frontend"]);
        const reg = createMockTreemapRegistration(data, {
            isDatumVisible: (id: string) => !hiddenSet.has(id)
        });

        const scene = TreemapLayoutEngine.layout(reg, plotRect, 600, 400, styleResolver);

        expect(scene.hasRenderableData).toBe(true);
        expect(scene.legendItems).toHaveLength(2);

        const frontendLegend = scene.legendItems.find(l => l.name === "Frontend");
        const backendLegend = scene.legendItems.find(l => l.name === "Backend");

        expect(frontendLegend).toBeDefined();
        expect(frontendLegend!.visible).toBe(false);

        expect(backendLegend).toBeDefined();
        expect(backendLegend!.visible).toBe(true);

        // Only Backend and Node are rendered in scene nodes
        expect(scene.series[0].nodes.length).toBe(2);
        expect(scene.series[0].nodes.some(n => n.formattedLabel === "Frontend")).toBe(false);
    });

    it("preserves all legend items with visible=false when all top-level branches are toggled off", () => {
        const data = [
            {
                name: "Frontend",
                children: [{ name: "Angular", value: 100 }]
            },
            {
                name: "Backend",
                children: [{ name: "Node", value: 100 }]
            }
        ];

        const hiddenSet = new Set<string>(["root/l:s:Frontend", "root/l:s:Backend"]);
        const reg = createMockTreemapRegistration(data, {
            isDatumVisible: (id: string) => !hiddenSet.has(id)
        });

        const scene = TreemapLayoutEngine.layout(reg, plotRect, 600, 400, styleResolver);

        expect(scene.hasRenderableData).toBe(false);
        expect(scene.legendItems).toHaveLength(2);
        expect(scene.legendItems[0].visible).toBe(false);
        expect(scene.legendItems[1].visible).toBe(false);
        expect(scene.series[0].nodes).toHaveLength(0);
    });
});
