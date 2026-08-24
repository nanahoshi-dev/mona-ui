import { describe, expect, it, vi } from "vitest";
import type { ChartScene, PolarAxisChartScene } from "../scene/chart-scene";
import type { SceneHitTarget } from "../scene/scene-geometry";
import { ChartKeyboardNavigation } from "./chart-keyboard-navigation";

describe("ChartKeyboardNavigation", () => {
    const hitA1: SceneHitTarget = {
        category: "A",
        color: "#3b82f6",
        datum: { cat: "A", val: 10 },
        index: 0,
        seriesId: "s1",
        seriesName: "Series 1",
        seriesType: "radar",
        xKey: "A",
        xValue: "A",
        yValue: 10
    };
    const hitA2: SceneHitTarget = {
        category: "A",
        color: "#10b981",
        datum: { cat: "A", val: 20 },
        index: 0,
        seriesId: "s2",
        seriesName: "Series 2",
        seriesType: "radar",
        xKey: "A",
        xValue: "A",
        yValue: 20
    };
    const hitB1: SceneHitTarget = {
        category: "B",
        color: "#3b82f6",
        datum: { cat: "B", val: 30 },
        index: 1,
        seriesId: "s1",
        seriesName: "Series 1",
        seriesType: "radar",
        xKey: "B",
        xValue: "B",
        yValue: 30
    };

    const mockPolarAxisScene: PolarAxisChartScene = {
        angularAxis: {
            axisLine: true,
            gridLines: true,
            labelOffset: 10,
            labels: true,
            mode: "category",
            rotation: 0,
            ticks: [],
            visible: true
        },
        axisMode: "radar",
        center: { x: 200, y: 200 },
        coordinateSystem: "polar",
        hasRenderableData: true,
        height: 400,
        hitTargets: [hitA1, hitA2, hitB1],
        interactionBuckets: [
            {
                anchor: { x: 200, y: 100 },
                hits: [hitA1, hitA2],
                order: 0,
                xKey: "A",
                xValue: "A"
            },
            {
                anchor: { x: 300, y: 200 },
                hits: [hitB1],
                order: 1,
                xKey: "B",
                xValue: "B"
            }
        ],
        legendItems: [],
        outerRadius: 100,
        plotRect: { height: 368, width: 368, x: 16, y: 16 },
        polarKind: "axis",
        radialAxis: {
            axisLine: true,
            domain: [0, 100],
            gridLines: true,
            gridShape: "polygon",
            labelAngle: 0,
            labelOffset: 6,
            labels: true,
            ticks: [],
            visible: true
        },
        series: [],
        width: 400
    };

    const createKeyEvent = (key: string): KeyboardEvent =>
        ({ key, preventDefault: vi.fn() } as unknown as KeyboardEvent);

    it("should navigate clockwise with ArrowRight and wrap around in polar axis charts", () => {
        const eventRight = createKeyEvent("ArrowRight");
        const res = ChartKeyboardNavigation.handleKeyDown(eventRight, mockPolarAxisScene, 0, "s1");

        expect(res).not.toBeNull();
        expect(res?.bucketIndex).toBe(1);
        expect(res?.hitTarget).toBe(hitB1);

        // Wrap around from bucket 1 -> 0
        const wrapRes = ChartKeyboardNavigation.handleKeyDown(eventRight, mockPolarAxisScene, 1, "s1");
        expect(wrapRes?.bucketIndex).toBe(0);
    });

    it("should switch series with ArrowDown / ArrowUp within current bucket in polar axis charts", () => {
        const eventDown = createKeyEvent("ArrowDown");
        const resDown = ChartKeyboardNavigation.handleKeyDown(eventDown, mockPolarAxisScene, 0, "s1");

        expect(resDown?.bucketIndex).toBe(0);
        expect(resDown?.seriesId).toBe("s2");
        expect(resDown?.hitTarget).toBe(hitA2);

        const eventUp = createKeyEvent("ArrowUp");
        const resUp = ChartKeyboardNavigation.handleKeyDown(eventUp, mockPolarAxisScene, 0, "s2");

        expect(resUp?.bucketIndex).toBe(0);
        expect(resUp?.seriesId).toBe("s1");
        expect(resUp?.hitTarget).toBe(hitA1);
    });

    it("should handle Home and End keys", () => {
        const eventHome = createKeyEvent("Home");
        const resHome = ChartKeyboardNavigation.handleKeyDown(eventHome, mockPolarAxisScene, 1, "s1");
        expect(resHome?.bucketIndex).toBe(0);

        const eventEnd = createKeyEvent("End");
        const resEnd = ChartKeyboardNavigation.handleKeyDown(eventEnd, mockPolarAxisScene, 0, "s1");
        expect(resEnd?.bucketIndex).toBe(1);
    });

    it("should handle hierarchical treemap keyboard navigation", () => {
        const hitParent: SceneHitTarget = {
            animationKey: "k:parent",
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
                nodeId: "p1",
                path: ["Parent"],
                siblingIndex: 0,
                sourceIndexPath: [0],
                treeHeight: 1
            },
            index: 0,
            seriesId: "tm-1",
            seriesName: "Treemap",
            seriesType: "treemap",
            xKey: "p1",
            xValue: "Parent"
        };

        const hitChild: SceneHitTarget = {
            animationKey: "k:child",
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
                nodeId: "c1",
                parentId: "p1",
                path: ["Parent", "Child"],
                siblingIndex: 0,
                sourceIndexPath: [0, 0],
                treeHeight: 0
            },
            index: 1,
            seriesId: "tm-1",
            seriesName: "Treemap",
            seriesType: "treemap",
            xKey: "c1",
            xValue: "Child"
        };

        const treemapScene = {
            coordinateSystem: "hierarchical",
            hasRenderableData: true,
            height: 300,
            hierarchicalKind: "treemap",
            hitTargets: [hitParent, hitChild],
            interactionBuckets: [],
            legendItems: [],
            navigationIndex: {
                entries: new Map([
                    ["p1", { firstChildId: "c1", nodeId: "p1" }],
                    ["c1", { nodeId: "c1", parentId: "p1", previousDepthFirstId: "p1" }]
                ]),
                firstNodeId: "p1",
                lastNodeId: "c1"
            },
            plotRect: { height: 300, width: 500, x: 0, y: 0 },
            series: [],
            width: 500
        } as unknown as ChartScene;

        const eventEnterChild = createKeyEvent("ArrowRight");
        const res = ChartKeyboardNavigation.handleKeyDown(eventEnterChild, treemapScene, 0, "tm-1", "k:parent");
        expect(res).not.toBeNull();
        expect(res?.hitTarget).toBe(hitChild);

        const eventBackToParent = createKeyEvent("ArrowLeft");
        const resBack = ChartKeyboardNavigation.handleKeyDown(eventBackToParent, treemapScene, 0, "tm-1", "k:child");
        expect(resBack).not.toBeNull();
        expect(resBack?.hitTarget).toBe(hitParent);
    });
});
