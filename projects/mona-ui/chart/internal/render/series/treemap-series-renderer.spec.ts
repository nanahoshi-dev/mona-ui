import { describe, expect, it, vi } from "vitest";
import type { ChartTreemapSeriesScene } from "../../scene/hierarchical-scene";
import { TreemapSeriesRenderer } from "./treemap-series-renderer";

describe("TreemapSeriesRenderer", () => {
    it("renders parent and terminal leaf nodes onto 2D canvas context", () => {
        const fillRectSpy = vi.fn();
        const strokeRectSpy = vi.fn();
        const saveSpy = vi.fn();
        const restoreSpy = vi.fn();

        const mockContext = {
            fillStyle: "",
            fillRect: fillRectSpy,
            globalAlpha: 1,
            lineWidth: 1,
            restore: restoreSpy,
            save: saveSpy,
            strokeStyle: "",
            strokeRect: strokeRectSpy
        } as unknown as CanvasRenderingContext2D;

        const seriesScene: ChartTreemapSeriesScene = {
            id: "tm-1",
            labels: [],
            layoutSignature: "sig",
            name: "Treemap",
            nodes: [
                {
                    aggregateValue: 100,
                    animationKey: "k:parent",
                    borderRadius: 0,
                    bounds: { height: 200, width: 300, x: 0, y: 0 },
                    childCount: 1,
                    contentBounds: { height: 180, width: 300, x: 0, y: 20 },
                    dataIndex: 0,
                    datum: {},
                    depth: 1,
                    descendantCount: 1,
                    fillColor: "#3b82f6",
                    formattedLabel: "Parent",
                    formattedPath: ["Parent"],
                    formattedValue: "100",
                    headerBounds: { height: 20, width: 300, x: 0, y: 0 },
                    isCollapsed: false,
                    isLeaf: false,
                    label: "Parent",
                    labelKind: "parent",
                    nodeId: "root/l:s:Parent",
                    path: ["Parent"],
                    renderOpacity: 1,
                    renderOrder: 0,
                    showLabel: true,
                    showValue: false,
                    siblingIndex: 0,
                    sourceIndexPath: [0],
                    textColor: "#ffffff",
                    treeHeight: 1
                },
                {
                    aggregateValue: 100,
                    animationKey: "k:child",
                    borderRadius: 0,
                    bounds: { height: 180, width: 300, x: 0, y: 20 },
                    childCount: 0,
                    contentBounds: { height: 180, width: 300, x: 0, y: 20 },
                    dataIndex: 1,
                    datum: {},
                    depth: 2,
                    descendantCount: 0,
                    fillColor: "#3b82f6",
                    formattedLabel: "Child",
                    formattedPath: ["Parent", "Child"],
                    formattedValue: "100",
                    isCollapsed: false,
                    isLeaf: true,
                    label: "Child",
                    labelKind: "terminal",
                    nodeId: "root/l:s:Parent/l:s:Child",
                    parentId: "root/l:s:Parent",
                    path: ["Parent", "Child"],
                    renderOpacity: 1,
                    renderOrder: 1,
                    showLabel: true,
                    showValue: true,
                    siblingIndex: 0,
                    sourceIndexPath: [0, 0],
                    textColor: "#ffffff",
                    treeHeight: 0
                }
            ],
            renderOpacity: 1,
            sort: "descending",
            style: {
                baseColor: "#3b82f6",
                borderRadius: 0,
                fillOpacity: 1,
                parentFillOpacity: 0.15,
                strokeColor: "#ffffff",
                strokeWidth: 1
            },
            tile: "squarify",
            topologySignature: "top",
            type: "treemap"
        };

        TreemapSeriesRenderer.render(mockContext, seriesScene);

        expect(saveSpy).toHaveBeenCalledTimes(2);
        expect(restoreSpy).toHaveBeenCalledTimes(2);
        expect(fillRectSpy).toHaveBeenCalled();
        expect(strokeRectSpy).toHaveBeenCalled();
    });
});
