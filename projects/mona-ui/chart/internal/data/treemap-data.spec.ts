import { describe, expect, it, vi } from "vitest";
import { TreemapDataProcessor } from "./treemap-data";
import { ChartStyleResolver } from "../style/chart-style-resolver";

describe("TreemapDataProcessor", () => {
    const styleResolver = new ChartStyleResolver();

    it("returns empty result when data is empty", () => {
        const res = TreemapDataProcessor.process({
            data: [],
            isDatumVisible: () => true,
            seriesId: "tm-1",
            seriesName: "Treemap",
            styleResolver
        });

        expect(res.allNodes).toHaveLength(0);
        expect(res.rootNodes).toHaveLength(0);
        expect(res.totalValue).toBe(0);
        expect(res.hasPositiveLeaf).toBe(false);
    });

    it("processes a multi-level nested hierarchy with leaf values", () => {
        const data = [
            {
                name: "Compute",
                children: [
                    { name: "API", value: 40 },
                    { name: "Workers", value: 60 }
                ]
            },
            {
                name: "Storage",
                children: [
                    { name: "Database", value: 100 }
                ]
            }
        ];

        const res = TreemapDataProcessor.process({
            data,
            isDatumVisible: () => true,
            seriesId: "tm-1",
            seriesName: "Treemap",
            styleResolver
        });

        expect(res.rootNodes).toHaveLength(2);
        expect(res.allNodes).toHaveLength(5); // 2 parents + 3 leaves
        expect(res.totalValue).toBe(200);
        expect(res.hasPositiveLeaf).toBe(true);

        const computeNode = res.rootNodes[0];
        expect(computeNode.depth).toBe(1);
        expect(computeNode.formattedLabel).toBe("Compute");
        expect(computeNode.children).toHaveLength(2);
        expect(computeNode.ownContribution).toBe(0); // Parent own contribution is 0

        const apiNode = computeNode.children[0];
        expect(apiNode.depth).toBe(2);
        expect(apiNode.formattedLabel).toBe("API");
        expect(apiNode.ownContribution).toBe(40);
        expect(apiNode.parentId).toBe(computeNode.nodeId);
        expect(apiNode.nodeId).toBe(`${computeNode.nodeId}/l:s:API`);
    });

    it("ignores internal node's own value when it has children", () => {
        const data = [
            {
                name: "Parent",
                value: 999, // Should be ignored in favor of children sum
                children: [
                    { name: "Child A", value: 30 },
                    { name: "Child B", value: 70 }
                ]
            }
        ];

        const res = TreemapDataProcessor.process({
            data,
            isDatumVisible: () => true,
            seriesId: "tm-1",
            seriesName: "Treemap",
            styleResolver
        });

        expect(res.totalValue).toBe(100);
        expect(res.rootNodes[0].ownContribution).toBe(0);
    });

    it("normalizes negative leaf values to 0 with diagnostic warning", () => {
        const warned = new Set<string>();
        const data = [
            { name: "Positive", value: 50 },
            { name: "Negative", value: -20 }
        ];

        const res = TreemapDataProcessor.process({
            data,
            isDatumVisible: () => true,
            seriesId: "tm-1",
            seriesName: "Treemap",
            styleResolver,
            warnedDiagnosticSignatures: warned
        });

        expect(res.totalValue).toBe(50);
        expect(res.rootNodes[1].ownContribution).toBe(0);
        expect(warned.has("tm-1:negative-val:root/l:s:Negative")).toBe(true);
    });

    it("handles all-zero hierarchy with hasPositiveLeaf=false", () => {
        const data = [
            { name: "A", value: 0 },
            { name: "B", value: 0 }
        ];

        const res = TreemapDataProcessor.process({
            data,
            isDatumVisible: () => true,
            seriesId: "tm-1",
            seriesName: "Treemap",
            styleResolver
        });

        expect(res.totalValue).toBe(0);
        expect(res.hasPositiveLeaf).toBe(false);
    });

    it("uses explicit keyField for node identity when provided", () => {
        const data = [
            { id: "node-comp", name: "Compute", children: [{ id: "node-api", name: "API", value: 50 }] }
        ];

        const res = TreemapDataProcessor.process({
            data,
            isDatumVisible: () => true,
            keyField: "id",
            seriesId: "tm-1",
            seriesName: "Treemap",
            styleResolver
        });

        expect(res.rootNodes[0].nodeId).toBe("k:s:node-comp");
        expect(res.rootNodes[0].children[0].nodeId).toBe("k:s:node-api");
    });

    it("falls back to path identity with diagnostic when duplicate keyField is encountered", () => {
        const warned = new Set<string>();
        const data = [
            { id: "dup", name: "Node 1", value: 10 },
            { id: "dup", name: "Node 2", value: 20 }
        ];

        const res = TreemapDataProcessor.process({
            data,
            isDatumVisible: () => true,
            keyField: "id",
            seriesId: "tm-1",
            seriesName: "Treemap",
            styleResolver,
            warnedDiagnosticSignatures: warned
        });

        expect(res.rootNodes[0].nodeId).toBe("k:s:dup");
        expect(res.rootNodes[1].nodeId).toBe("root/l:s:Node 2");
        expect(warned.has("tm-1:duplicate-key:dup")).toBe(true);
    });

    it("safely breaks cyclic hierarchy without infinite loop or throwing", () => {
        const warned = new Set<string>();
        const nodeA: any = { name: "A", children: [] };
        const nodeB: any = { name: "B", children: [] };
        nodeA.children.push(nodeB);
        nodeB.children.push(nodeA); // Cycle!

        const res = TreemapDataProcessor.process({
            data: [nodeA],
            isDatumVisible: () => true,
            seriesId: "tm-1",
            seriesName: "Treemap",
            styleResolver,
            warnedDiagnosticSignatures: warned
        });

        expect(res.allNodes).toHaveLength(2); // A and B, but B's cyclic child omitted
        expect(warned.has("tm-1:cycle:root/l:s:A/l:s:B:0")).toBe(true);
    });

    it("handles reused object instances across different branches with distinct path identities", () => {
        const sharedLeaf = { name: "Shared", value: 25 };
        const data = [
            { name: "Branch 1", children: [sharedLeaf] },
            { name: "Branch 2", children: [sharedLeaf] }
        ];

        const res = TreemapDataProcessor.process({
            data,
            isDatumVisible: () => true,
            seriesId: "tm-1",
            seriesName: "Treemap",
            styleResolver
        });

        expect(res.allNodes).toHaveLength(4);
        expect(res.rootNodes[0].children[0].nodeId).toBe("root/l:s:Branch 1/l:s:Shared");
        expect(res.rootNodes[1].children[0].nodeId).toBe("root/l:s:Branch 2/l:s:Shared");
        expect(res.totalValue).toBe(50);
    });

    it("inherits branch color down the hierarchy with colorField override capability", () => {
        const data = [
            {
                name: "Branch A",
                children: [
                    { name: "Child 1", value: 30 },
                    { name: "Child 2", customColor: "#ff0000", value: 40 }
                ]
            }
        ];

        const res = TreemapDataProcessor.process({
            colors: ["#3b82f6"],
            colorField: "customColor",
            data,
            isDatumVisible: () => true,
            seriesId: "tm-1",
            seriesName: "Treemap",
            styleResolver
        });

        const branch = res.rootNodes[0];
        expect(branch.color).toBe("#3b82f6");
        expect(branch.children[0].color).toBe("#3b82f6"); // Inherited
        expect(branch.children[1].color).toBe("#ff0000"); // Overridden
    });

    it("marks branch and all its descendants hidden when top-level branch is toggled hidden", () => {
        const data = [
            {
                name: "Compute",
                children: [{ name: "API", value: 50 }]
            },
            {
                name: "Storage",
                children: [{ name: "DB", value: 100 }]
            }
        ];

        const res = TreemapDataProcessor.process({
            data,
            isDatumVisible: (id: string) => !id.includes("Compute"),
            seriesId: "tm-1",
            seriesName: "Treemap",
            styleResolver
        });

        expect(res.rootNodes[0].visible).toBe(false);
        expect(res.rootNodes[0].children[0].visible).toBe(false);
        expect(res.rootNodes[1].visible).toBe(true);
        expect(res.rootNodes[1].children[0].visible).toBe(true);
        expect(res.totalValue).toBe(100); // Only visible branch contributes to total
    });
});
