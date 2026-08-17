import { describe, expect, it } from "vitest";
import type { PolarAxisChartScene } from "../scene/chart-scene";
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

    it("should navigate clockwise with ArrowRight and wrap around in polar axis charts", () => {
        const eventRight = new KeyboardEvent("keydown", { key: "ArrowRight" });
        const res = ChartKeyboardNavigation.handleKeyDown(eventRight, mockPolarAxisScene, 0, "s1");

        expect(res).not.toBeNull();
        expect(res?.bucketIndex).toBe(1);
        expect(res?.hitTarget).toBe(hitB1);

        // Wrap around from bucket 1 -> 0
        const wrapRes = ChartKeyboardNavigation.handleKeyDown(eventRight, mockPolarAxisScene, 1, "s1");
        expect(wrapRes?.bucketIndex).toBe(0);
    });

    it("should switch series with ArrowDown / ArrowUp within current bucket in polar axis charts", () => {
        const eventDown = new KeyboardEvent("keydown", { key: "ArrowDown" });
        const resDown = ChartKeyboardNavigation.handleKeyDown(eventDown, mockPolarAxisScene, 0, "s1");

        expect(resDown?.bucketIndex).toBe(0);
        expect(resDown?.seriesId).toBe("s2");
        expect(resDown?.hitTarget).toBe(hitA2);

        const eventUp = new KeyboardEvent("keydown", { key: "ArrowUp" });
        const resUp = ChartKeyboardNavigation.handleKeyDown(eventUp, mockPolarAxisScene, 0, "s2");

        expect(resUp?.bucketIndex).toBe(0);
        expect(resUp?.seriesId).toBe("s1");
        expect(resUp?.hitTarget).toBe(hitA1);
    });

    it("should handle Home and End keys", () => {
        const eventHome = new KeyboardEvent("keydown", { key: "Home" });
        const resHome = ChartKeyboardNavigation.handleKeyDown(eventHome, mockPolarAxisScene, 1, "s1");
        expect(resHome?.bucketIndex).toBe(0);

        const eventEnd = new KeyboardEvent("keydown", { key: "End" });
        const resEnd = ChartKeyboardNavigation.handleKeyDown(eventEnd, mockPolarAxisScene, 0, "s1");
        expect(resEnd?.bucketIndex).toBe(1);
    });
});
