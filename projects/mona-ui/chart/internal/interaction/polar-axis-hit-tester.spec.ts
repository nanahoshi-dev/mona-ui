import { describe, expect, it } from "vitest";
import type { PolarAxisChartScene } from "../scene/chart-scene";
import type { SceneHitTarget } from "../scene/scene-geometry";
import { PolarAxisHitTester } from "./polar-axis-hit-tester";

describe("PolarAxisHitTester", () => {
    const hitPower: SceneHitTarget = {
        angle: 0,
        category: "Power",
        color: "#8b5cf6",
        datum: { metric: "Power", score: 80 },
        formattedCategory: "Power",
        formattedValue: "80",
        index: 0,
        point: { x: 200, y: 120 },
        radius: 8,
        seriesId: "radar-1",
        seriesName: "Player A",
        seriesType: "radar",
        xKey: "Power",
        xValue: "Power",
        yValue: 80
    };

    const hitSpeed: SceneHitTarget = {
        angle: Math.PI / 2,
        category: "Speed",
        color: "#8b5cf6",
        datum: { metric: "Speed", score: 90 },
        formattedCategory: "Speed",
        formattedValue: "90",
        index: 1,
        point: { x: 290, y: 200 },
        radius: 8,
        seriesId: "radar-1",
        seriesName: "Player A",
        seriesType: "radar",
        xKey: "Speed",
        xValue: "Speed",
        yValue: 90
    };

    const mockScene: PolarAxisChartScene = {
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
        hitTargets: [hitPower, hitSpeed],
        interactionBuckets: [
            {
                anchor: { x: 200, y: 100 },
                centerX: 200,
                hits: [hitPower],
                order: 0,
                xKey: "Power",
                xValue: "Power"
            },
            {
                anchor: { x: 300, y: 200 },
                centerX: 300,
                hits: [hitSpeed],
                order: 1,
                xKey: "Speed",
                xValue: "Speed"
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

    it("should hit test in shared mode to nearest spoke bucket", () => {
        // Pointer near 12 o'clock (angle ~0)
        const pointer = { x: 205, y: 130 };
        const res = PolarAxisHitTester.testHit(pointer, mockScene, true);

        expect(res.activeHitTarget).toBe(hitPower);
        expect(res.activeHits).toContain(hitPower);
    });

    it("should hit test in non-shared mode to exact point", () => {
        const pointer = { x: 288, y: 202 };
        const res = PolarAxisHitTester.testHit(pointer, mockScene, false);

        expect(res.activeHitTarget).toBe(hitSpeed);
        expect(res.activeHits).toContain(hitSpeed);
    });

    it("should return empty result when pointer is outside radius envelope", () => {
        const pointer = { x: 380, y: 380 };
        const res = PolarAxisHitTester.testHit(pointer, mockScene, true);

        expect(res.activeHitTarget).toBeNull();
        expect(res.activeHits.length).toBe(0);
    });
});
