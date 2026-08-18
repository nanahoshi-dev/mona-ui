import { describe, expect, it } from "vitest";
import type { ChartTreemapSeriesScene, SceneTreemapNode } from "../../scene/hierarchical-scene";
import { TreemapAnimationAdapter } from "./treemap-animation-adapter";

describe("TreemapAnimationAdapter", () => {
    const adapter = new TreemapAnimationAdapter();

    const nodeA: SceneTreemapNode = {
        aggregateValue: 100,
        animationKey: "k:a",
        borderRadius: 0,
        bounds: { height: 100, width: 100, x: 0, y: 0 },
        childCount: 0,
        contentBounds: { height: 100, width: 100, x: 0, y: 0 },
        dataIndex: 0,
        datum: {},
        depth: 1,
        descendantCount: 0,
        fillColor: "#3b82f6",
        formattedLabel: "A",
        formattedPath: ["A"],
        formattedValue: "100",
        isCollapsed: false,
        isLeaf: true,
        label: "A",
        labelKind: "terminal",
        nodeId: "a",
        path: ["A"],
        renderOpacity: 1,
        renderOrder: 0,
        showLabel: true,
        showValue: true,
        siblingIndex: 0,
        sourceIndexPath: [0],
        textColor: "#ffffff",
        treeHeight: 0
    };

    const nodeAUpdated: SceneTreemapNode = {
        ...nodeA,
        aggregateValue: 200,
        bounds: { height: 200, width: 200, x: 50, y: 50 },
        contentBounds: { height: 200, width: 200, x: 50, y: 50 }
    };

    const scene1: ChartTreemapSeriesScene = {
        id: "tm-1",
        labels: [],
        layoutSignature: "sig1",
        name: "Treemap",
        nodes: [nodeA],
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
        topologySignature: "top1",
        type: "treemap"
    };

    const scene2: ChartTreemapSeriesScene = {
        ...scene1,
        layoutSignature: "sig2",
        nodes: [nodeAUpdated]
    };

    it("interpolates bounding geometry and aggregate value during update transition", () => {
        const plan = adapter.createPlan(scene1, scene2, {
            options: { data: true, duration: 300, easing: "ease-out", enabled: true, initial: true, visibility: true },
            trigger: "data"
        });

        const sampledMid = plan.sample(0.5);
        expect(sampledMid).not.toBeNull();
        expect(sampledMid!.nodes.length).toBe(1);

        const midNode = sampledMid!.nodes[0];
        expect(midNode.bounds.x).toBe(25);
        expect(midNode.bounds.y).toBe(25);
        expect(midNode.bounds.width).toBe(150);
        expect(midNode.bounds.height).toBe(150);
        expect(midNode.aggregateValue).toBe(150);
    });

    it("fades in entering nodes from 0 opacity to 1", () => {
        const plan = adapter.createPlan(null, scene1, {
            options: { data: true, duration: 300, easing: "ease-out", enabled: true, initial: true, visibility: true },
            trigger: "initial"
        });

        const sampled0 = plan.sample(0);
        expect(sampled0!.nodes[0].renderOpacity).toBe(0);

        const sampledHalf = plan.sample(0.5);
        expect(sampledHalf!.nodes[0].renderOpacity).toBeCloseTo(0.5);

        const sampledFull = plan.sample(1);
        expect(sampledFull!.nodes[0].renderOpacity).toBe(1);
    });
});
