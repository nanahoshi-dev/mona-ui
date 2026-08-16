import { describe, expect, it } from "vitest";
import type { ChartScene } from "../scene/chart-scene";
import { ChartHitTestEngine } from "./chart-hit-test-engine";

describe("ChartHitTestEngine", () => {
    const mockScene: ChartScene = {
        axes: [],
        coordinateSystem: "cartesian",
        height: 300,
        hitTargets: [
            {
                bounds: { height: 100, width: 30, x: 50, y: 100 },
                datum: { id: 1, val: 50 },
                index: 0,
                seriesId: "s1",
                seriesName: "Bar Series",
                seriesType: "bar",
                xValue: "Jan",
                yValue: 50
            },
            {
                datum: { id: 2, val: 80 },
                index: 0,
                point: { x: 65, y: 50 },
                radius: 16,
                seriesId: "s2",
                seriesName: "Line Series",
                seriesType: "line",
                xValue: "Jan",
                yValue: 80
            },
            {
                datum: { id: 3, val: 90 },
                index: 1,
                point: { x: 150, y: 40 },
                radius: 16,
                seriesId: "s2",
                seriesName: "Line Series",
                seriesType: "line",
                xValue: "Feb",
                yValue: 90
            }
        ],
        plotRect: { height: 260, width: 400, x: 40, y: 20 },
        series: [],
        width: 500
    };

    it("should hit test a bar rectangle", () => {
        const hit = ChartHitTestEngine.testHit({ x: 60, y: 150 }, mockScene, false);
        expect(hit.activeHitTarget?.seriesId).toBe("s1");
        expect(hit.activeHits.length).toBe(1);
    });

    it("should hit test a line point by proximity", () => {
        const hit = ChartHitTestEngine.testHit({ x: 148, y: 42 }, mockScene, false);
        expect(hit.activeHitTarget?.seriesId).toBe("s2");
        expect(hit.activeHitTarget?.xValue).toBe("Feb");
    });

    it("should return all matching series hits in shared mode", () => {
        const hit = ChartHitTestEngine.testHit({ x: 60, y: 60 }, mockScene, true);
        expect(hit.activeHits.length).toBe(2);
        expect(hit.activeHits.map(h => h.seriesId)).toContain("s1");
        expect(hit.activeHits.map(h => h.seriesId)).toContain("s2");
    });

    it("should return null hit target for out-of-bounds pointer", () => {
        const hit = ChartHitTestEngine.testHit({ x: 10, y: 10 }, mockScene, false);
        expect(hit.activeHitTarget).toBeNull();
    });
});
