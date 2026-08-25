import { describe, expect, it } from "vitest";
import type { SceneHitTarget } from "../scene/scene-geometry";
import { TreemapHitIndex } from "./treemap-hit-index";

describe("TreemapHitIndex", () => {
    const plotRect = { height: 400, width: 600, x: 0, y: 0 };

    it("returns null when point is outside plotRect", () => {
        const hitIndex = new TreemapHitIndex(plotRect, []);
        expect(hitIndex.query({ x: -10, y: 50 })).toBeNull();
        expect(hitIndex.query({ x: 700, y: 50 })).toBeNull();
        expect(hitIndex.query({ x: 50, y: -10 })).toBeNull();
        expect(hitIndex.query({ x: 50, y: 500 })).toBeNull();
    });

    it("returns the deepest nested child node when point falls inside overlapping parent and child", () => {
        const parentTarget: SceneHitTarget = {
            bounds: { height: 200, width: 300, x: 0, y: 0 },
            datum: {},
            hierarchy: {
                aggregateValue: 100,
                childCount: 1,
                dataIndex: 0,
                depth: 1,
                descendantCount: 1,
                formattedLabel: "Parent",
                formattedPath: ["Parent"],
                formattedValue: "100",
                isCollapsed: false,
                isLeaf: false,
                label: "Parent",
                nodeId: "parent",
                path: ["Parent"],
                siblingIndex: 0,
                sourceIndexPath: [0],
                treeHeight: 1
            },
            index: 0,
            seriesId: "tm-1",
            seriesName: "Treemap",
            seriesType: "treemap",
            xKey: "parent",
            xValue: "Parent"
        };

        const childTarget: SceneHitTarget = {
            bounds: { height: 180, width: 280, x: 10, y: 20 },
            datum: {},
            hierarchy: {
                aggregateValue: 100,
                childCount: 0,
                dataIndex: 1,
                depth: 2,
                descendantCount: 0,
                formattedLabel: "Child",
                formattedPath: ["Parent", "Child"],
                formattedValue: "100",
                isCollapsed: false,
                isLeaf: true,
                label: "Child",
                nodeId: "child",
                parentId: "parent",
                path: ["Parent", "Child"],
                siblingIndex: 0,
                sourceIndexPath: [0, 0],
                treeHeight: 0
            },
            index: 1,
            seriesId: "tm-1",
            seriesName: "Treemap",
            seriesType: "treemap",
            xKey: "child",
            xValue: "Child"
        };

        const hitIndex = new TreemapHitIndex(plotRect, [parentTarget, childTarget]);

        // Point in child bounds (x: 50, y: 50) should return childTarget (depth 2 > depth 1)
        const hitInsideChild = hitIndex.query({ x: 50, y: 50 });
        expect(hitInsideChild).toBe(childTarget);

        // Point in parent header bar (x: 5, y: 5) should return parentTarget (outside child bounds)
        const hitInParentHeader = hitIndex.query({ x: 5, y: 5 });
        expect(hitInParentHeader).toBe(parentTarget);
    });

    it("handles large numbers of nodes efficiently using spatial grid", () => {
        const targets: SceneHitTarget[] = [];
        const cols = 10;
        const rows = 10;
        const w = 600 / cols;
        const h = 400 / rows;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const idx = r * cols + c;
                targets.push({
                    bounds: { height: h, width: w, x: c * w, y: r * h },
                    datum: { id: idx },
                    hierarchy: {
                        aggregateValue: idx,
                        childCount: 0,
                        dataIndex: idx,
                        depth: 1,
                        descendantCount: 0,
                        formattedLabel: `Node ${idx}`,
                        formattedPath: [`Node ${idx}`],
                        formattedValue: `${idx}`,
                        isCollapsed: false,
                        isLeaf: true,
                        label: `Node ${idx}`,
                        nodeId: `node-${idx}`,
                        path: [`Node ${idx}`],
                        siblingIndex: idx,
                        sourceIndexPath: [idx],
                        treeHeight: 0
                    },
                    index: idx,
                    seriesId: "tm-1",
                    seriesName: "Treemap",
                    seriesType: "treemap",
                    xKey: `node-${idx}`,
                    xValue: `Node ${idx}`
                });
            }
        }

        const hitIndex = new TreemapHitIndex(plotRect, targets);

        // Query point at cell (col 3, row 4) -> x: 3.5 * 60 = 210, y: 4.5 * 40 = 180
        const queryPoint = { x: 210, y: 180 };
        const expectedIndex = 4 * 10 + 3; // 43
        const result = hitIndex.query(queryPoint);

        expect(result).toBeDefined();
        expect(result!.index).toBe(expectedIndex);
    });
});
