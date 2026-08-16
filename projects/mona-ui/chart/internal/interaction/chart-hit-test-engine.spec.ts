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

    const mockCartesianScene: ChartScene = {
        axes: [],
        coordinateSystem: "cartesian",
        hasRenderableData: true,
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
        legendItems: [],
        plotRect: { height: 260, width: 400, x: 40, y: 20 },
        series: [],
        width: 500
    };

    it("should hit test a bar rectangle", () => {
        const hit = ChartHitTestEngine.testHit({ x: 60, y: 150 }, mockCartesianScene, false);
        expect(hit.activeHitTarget?.seriesId).toBe("s1");
        expect(hit.activeHits.length).toBe(1);
    });

    it("should hit test a line point by proximity", () => {
        const hit = ChartHitTestEngine.testHit({ x: 148, y: 42 }, mockCartesianScene, false);
        expect(hit.activeHitTarget?.seriesId).toBe("s2");
        expect(hit.activeHitTarget?.xValue).toBe("Feb");
    });

    it("should return all matching series hits in shared mode", () => {
        const hit = ChartHitTestEngine.testHit({ x: 60, y: 60 }, mockCartesianScene, true);
        expect(hit.activeHits.length).toBe(2);
        expect(hit.activeHits.map(h => h.seriesId)).toContain("s1");
        expect(hit.activeHits.map(h => h.seriesId)).toContain("s2");
    });

    it("should return null hit target for out-of-bounds pointer", () => {
        const hit = ChartHitTestEngine.testHit({ x: 10, y: 10 }, mockCartesianScene, false);
        expect(hit.activeHitTarget).toBeNull();
    });

    describe("polar hit testing", () => {
        const center = { x: 200, y: 200 };
        // Donut from r=50 to r=100
        // Slice 1: 0 to Math.PI (12 o'clock to 6 o'clock on the right)
        // Slice 2: Math.PI to 2*Math.PI (6 o'clock to 12 o'clock on the left)
        const polarHit1: SceneHitTarget = {
            arc: {
                center,
                endAngle: Math.PI,
                innerRadius: 50,
                outerRadius: 100,
                padAngle: 0,
                startAngle: 0
            },
            category: "RightHalf",
            datum: { id: "p1" },
            index: 0,
            seriesId: "polar-1",
            seriesName: "Donut",
            seriesType: "donut",
            sliceId: "polar-1:slice:0",
            xKey: "polar-1:slice:0",
            xValue: "RightHalf",
            yValue: 50
        };

        const polarHit2: SceneHitTarget = {
            arc: {
                center,
                endAngle: 2 * Math.PI,
                innerRadius: 50,
                outerRadius: 100,
                padAngle: 0,
                startAngle: Math.PI
            },
            category: "LeftHalf",
            datum: { id: "p2" },
            index: 1,
            seriesId: "polar-1",
            seriesName: "Donut",
            seriesType: "donut",
            sliceId: "polar-1:slice:1",
            xKey: "polar-1:slice:1",
            xValue: "LeftHalf",
            yValue: 50
        };

        const mockPolarScene: ChartScene = {
            center,
            coordinateSystem: "polar",
            hasRenderableData: true,
            height: 400,
            hitTargets: [polarHit1, polarHit2],
            interactionBuckets: [],
            legendItems: [],
            plotRect: { height: 400, width: 400, x: 0, y: 0 },
            series: [],
            width: 400
        };

        it("should detect pointer inside the right-half slice", () => {
            // Pointer at 3 o'clock: x = 200 + 75 = 275, y = 200
            const hit = ChartHitTestEngine.testHit({ x: 275, y: 200 }, mockPolarScene, false);
            expect(hit.activeHitTarget?.category).toBe("RightHalf");
        });

        it("should detect pointer inside the left-half slice", () => {
            // Pointer at 9 o'clock: x = 200 - 75 = 125, y = 200
            const hit = ChartHitTestEngine.testHit({ x: 125, y: 200 }, mockPolarScene, false);
            expect(hit.activeHitTarget?.category).toBe("LeftHalf");
        });

        it("should return NO hit when pointer is inside the donut hole", () => {
            // Pointer at center (radius 0 < 50)
            const hitCenter = ChartHitTestEngine.testHit({ x: 200, y: 200 }, mockPolarScene, false);
            expect(hitCenter.activeHitTarget).toBeNull();

            // Pointer inside hole radius = 25 < 50
            const hitHole = ChartHitTestEngine.testHit({ x: 225, y: 200 }, mockPolarScene, false);
            expect(hitHole.activeHitTarget).toBeNull();
        });

        it("should return NO hit when pointer is outside the outer radius", () => {
            // Radius = 120 > 100
            const hitOutside = ChartHitTestEngine.testHit({ x: 320, y: 200 }, mockPolarScene, false);
            expect(hitOutside.activeHitTarget).toBeNull();
        });
    });
});
