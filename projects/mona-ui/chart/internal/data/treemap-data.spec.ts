import { describe, expect, it } from "vitest";
import { TreemapDataProcessor } from "./treemap-data";
import { TreemapIdentity } from "./treemap-identity";
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

    it("processes a multi-level nested hierarchy with leaf values and precomputes aggregates", () => {
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
                children: [{ name: "Database", value: 100 }]
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
        expect(computeNode.aggregateValue).toBe(100); // 40 + 60
        expect(computeNode.descendantCount).toBe(2);

        const apiNode = computeNode.children[0];
        expect(apiNode.depth).toBe(2);
        expect(apiNode.formattedLabel).toBe("API");
        expect(apiNode.ownContribution).toBe(40);
        expect(apiNode.aggregateValue).toBe(40);
        expect(apiNode.descendantCount).toBe(0);
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
        expect(res.rootNodes[0].aggregateValue).toBe(100);
    });

    it("normalizes negative leaf values to 0 with bounded diagnostic warning", () => {
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
        expect(warned.has("tm-1:negative-values")).toBe(true);
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
        const data = [{ id: "node-comp", name: "Compute", children: [{ id: "node-api", name: "API", value: 50 }] }];

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
        expect(warned.has("tm-1:duplicate-keys")).toBe(true);
    });

    it("safely breaks cyclic hierarchy without infinite loop or throwing", () => {
        const warned = new Set<string>();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nodeA: any = { name: "A", children: [] };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        expect(warned.has("tm-1:cycles")).toBe(true);
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

    it("assigns distinct theme palette colors to successive top-level branches by default", () => {
        const data = [
            {
                children: [{ name: "Angular", value: 50 }],
                name: "Frontend"
            },
            {
                children: [{ name: "NestJS", value: 60 }],
                name: "Backend"
            },
            {
                children: [{ name: "Postgres", value: 70 }],
                name: "Database"
            }
        ];

        const res = TreemapDataProcessor.process({
            data,
            isDatumVisible: () => true,
            seriesId: "tm-1",
            seriesName: "Treemap",
            styleResolver
        });

        expect(res.rootNodes[0].color).toBe(styleResolver.resolvePaletteColor(0));
        expect(res.rootNodes[0].children[0].color).toBe(styleResolver.resolvePaletteColor(0));
        expect(res.rootNodes[1].color).toBe(styleResolver.resolvePaletteColor(1));
        expect(res.rootNodes[1].children[0].color).toBe(styleResolver.resolvePaletteColor(1));
        expect(res.rootNodes[2].color).toBe(styleResolver.resolvePaletteColor(2));
        expect(res.rootNodes[2].children[0].color).toBe(styleResolver.resolvePaletteColor(2));
    });

    it("inherits branch color down the hierarchy with colorField override capability", () => {
        const data = [
            {
                name: "Branch A",
                children: [
                    { name: "Child 1", value: 30 },
                    { customColor: "#ff0000", name: "Child 2", value: 40 }
                ]
            }
        ];

        const res = TreemapDataProcessor.process({
            colorField: "customColor",
            colors: ["#3b82f6"],
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
                children: [{ name: "API", value: 50 }],
                name: "Compute"
            },
            {
                children: [{ name: "DB", value: 100 }],
                name: "Storage"
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

    it("ensures extractRetainedRootBranchIdentities and process produce identical root nodeIds even with nested key collisions", () => {
        const data = [
            {
                children: [{ id: "shared-key", name: "A child", value: 10 }],
                id: "root-a",
                name: "A"
            },
            {
                id: "shared-key",
                name: "B",
                value: 20
            }
        ];

        const rootIdentities = TreemapIdentity.extractRetainedRootBranchIdentities({
            data,
            keyField: "id",
            labelField: "name"
        });

        const res = TreemapDataProcessor.process({
            data,
            isDatumVisible: () => true,
            keyField: "id",
            labelField: "name",
            seriesId: "tm-1",
            seriesName: "Treemap",
            styleResolver
        });

        const rootIdsFromMap = Array.from(rootIdentities.keys());
        const rootIdsFromProcessor = res.rootNodes.map(n => n.nodeId);

        expect(rootIdsFromMap).toEqual(rootIdsFromProcessor);
        expect(rootIdsFromProcessor[0]).toBe("k:s:root-a");
        // Root B had a key collision with nested A child, so it fell back to path identity
        expect(rootIdsFromProcessor[1]).toBe("root/l:s:B");
        expect(rootIdsFromMap[1]).toBe("root/l:s:B");
    });

    it("distinguishes string vs numeric keys with same stringified value", () => {
        const data = [
            {
                children: [{ id: 1, name: "Num child", value: 10 }],
                id: "root-a",
                name: "A"
            },
            {
                id: "1",
                name: "B",
                value: 20
            }
        ];

        const rootIdentities = TreemapIdentity.extractRetainedRootBranchIdentities({
            data,
            keyField: "id",
            labelField: "name"
        });

        const res = TreemapDataProcessor.process({
            data,
            isDatumVisible: () => true,
            keyField: "id",
            labelField: "name",
            seriesId: "tm-1",
            seriesName: "Treemap",
            styleResolver
        });

        // 1 (number) and "1" (string) are distinct: k:n:1 vs k:s:1
        expect(res.rootNodes[1].nodeId).toBe("k:s:1");
        expect(rootIdentities.get("k:s:1")).toBeDefined();
    });
});
