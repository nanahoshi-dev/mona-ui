import { describe, expect, it } from "vitest";
import type { ChartScene } from "../scene/chart-scene";
import type { SceneHitTarget } from "../scene/scene-geometry";
import { ChartHitTestEngine } from "./chart-hit-test-engine";

describe("ChartHitTestEngine", () => {
    const hitTarget1: SceneHitTarget = {
        bounds: { height: 100, width: 30, x: 50, y: 100 },
        datum: { id: 1, val: 50 },
        index: 0,
        seriesId: "s1",
        seriesName: "Bar Series",
        seriesType: "bar",
        visualBounds: { height: 100, width: 30, x: 50, y: 100 },
        xKey: "Jan",
        xValue: "Jan",
        yValue: 50
    };

    const hitTarget2: SceneHitTarget = {
        datum: { id: 2, val: 80 },
        index: 0,
        point: { x: 65, y: 50 },
        radius: 16,
        seriesId: "s2",
        seriesName: "Line Series",
        seriesType: "line",
        xKey: "Jan",
        xValue: "Jan",
        yValue: 80
    };

    const hitTarget3: SceneHitTarget = {
        datum: { id: 3, val: 90 },
        index: 1,
        point: { x: 150, y: 40 },
        radius: 16,
        seriesId: "s2",
        seriesName: "Line Series",
        seriesType: "line",
        xKey: "Feb",
        xValue: "Feb",
        yValue: 90
    };

    const mockScene: ChartScene = {
        axes: [],
        coordinateSystem: "cartesian",
        height: 300,
        hitTargets: [hitTarget1, hitTarget2, hitTarget3],
        interactionBuckets: [
            {
                centerX: 65,
                hits: [hitTarget1, hitTarget2],
                xKey: "Jan",
                xValue: "Jan"
            },
            {
                centerX: 150,
                hits: [hitTarget3],
                xKey: "Feb",
                xValue: "Feb"
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

