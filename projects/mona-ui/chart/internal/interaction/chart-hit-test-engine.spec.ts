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
        cartesianKind: "xy",
        coordinateSystem: "cartesian",
        hasRenderableData: true,
        height: 300,
        hitTargets: [hitTarget1, hitTarget2, hitTarget3],
        interactionBuckets: [
            {
                anchor: { x: 65, y: 150 },
                hits: [hitTarget1, hitTarget2],
                order: 0,
                xKey: "Jan",
                xValue: "Jan"
            },
            {
                anchor: { x: 150, y: 150 },
                hits: [hitTarget3],
                order: 1,
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
            polarKind: "sector",
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

        it("should respect pad angle boundaries", () => {
            // Create an arc with significant pad angle
            const paddedHit: SceneHitTarget = {
                arc: {
                    center,
                    endAngle: Math.PI,
                    innerRadius: 50,
                    outerRadius: 100,
                    padAngle: 0.2, // ~11.5 degrees padding (5.7 deg on each edge)
                    startAngle: 0
                },
                category: "Padded",
                datum: {},
                index: 0,
                seriesId: "polar-pad",
                seriesName: "Donut",
                seriesType: "donut",
                sliceId: "pad:0",
                xKey: "pad:0",
                xValue: "Padded",
                yValue: 50
            };
            const sceneWithPad: ChartScene = {
                ...mockPolarScene,
                hitTargets: [paddedHit]
            };

            // Mid angle (3 o'clock, angle = PI/2) -> Hit
            const hitMid = ChartHitTestEngine.testHit({ x: 275, y: 200 }, sceneWithPad, false);
            expect(hitMid.activeHitTarget?.category).toBe("Padded");

            // Very close to 12 o'clock boundary (angle ~ 0.02 rad < halfPad 0.1 rad) -> inside pad dead zone -> No hit
            const nearEdgeX = 200 + 75 * Math.sin(0.02);
            const nearEdgeY = 200 - 75 * Math.cos(0.02);
            const hitEdge = ChartHitTestEngine.testHit({ x: nearEdgeX, y: nearEdgeY }, sceneWithPad, false);
            expect(hitEdge.activeHitTarget).toBeNull();
        });
    });

    describe("dense marker hit testing and two-phase selection (SB-008, SB-019, SB-022)", () => {
        const bottomMarker: SceneHitTarget = {
            datum: { id: 1 },
            index: 0,
            point: { x: 100, y: 100 },
            radius: 20, // visual radius 20
            renderOrder: 0, // bottom mark
            seriesId: "bottom-series",
            seriesName: "Bottom Bubble",
            seriesType: "bubble",
            visualRadius: 20,
            xKey: "10",
            xValue: 10,
            yValue: 20
        };

        const topMarker: SceneHitTarget = {
            datum: { id: 2 },
            index: 1,
            point: { x: 105, y: 100 },
            radius: 15, // visual radius 15
            renderOrder: 1, // top mark (rendered later)
            seriesId: "top-series",
            seriesName: "Top Bubble",
            seriesType: "bubble",
            visualRadius: 15,
            xKey: "10",
            xValue: 10,
            yValue: 25
        };

        const bucketLookup = new Map<string, any>([
            ["10", { anchor: { x: 100, y: 100 }, hits: [bottomMarker, topMarker], order: 0, xKey: "10", xValue: 10 }]
        ]);

        const markerScene: ChartScene = {
            axes: [],
            cartesianKind: "xy",
        coordinateSystem: "cartesian",
            hasRenderableData: true,
            height: 300,
            hitTargets: [bottomMarker, topMarker],
            interactionBucketLookup: bucketLookup,
            interactionBuckets: [
                { anchor: { x: 100, y: 100 }, hits: [bottomMarker, topMarker], order: 0, xKey: "10", xValue: 10 }
            ],
            legendItems: [],
            plotRect: { height: 260, width: 400, x: 40, y: 20 },
            series: [],
            width: 500
        };

        it("should prioritize top rendered mark when pointer is inside both visual radii (SB-019)", () => {
            // Pointer at (102, 100) is inside both markers:
            // dist to bottom (100, 100) = 2 < 20
            // dist to top (105, 100) = 3 < 15
            // Top mark has renderOrder 1 > 0, so top mark must win
            const hit = ChartHitTestEngine.testHit({ x: 102, y: 100 }, markerScene, false);
            expect(hit.activeHitTarget?.seriesId).toBe("top-series");
        });

        it("should select marker with direct visual radius hit over closer center proximity without containment", () => {
            // Pointer at (85, 100):
            // dist to bottom (100, 100) = 15 < visualRadius 20 -> inside bottom visual radius
            // dist to top (105, 100) = 20 > visualRadius 15 -> outside top visual radius
            const hit = ChartHitTestEngine.testHit({ x: 85, y: 100 }, markerScene, false);
            expect(hit.activeHitTarget?.seriesId).toBe("bottom-series");
        });

        it("should perform O(1) shared bucket lookup from interactionBucketLookup (SB-022)", () => {
            const hit = ChartHitTestEngine.testHit({ x: 102, y: 100 }, markerScene, true);
            expect(hit.activeHits.length).toBe(2);
            expect(hit.activeHits[0].seriesId).toBe("bottom-series");
            expect(hit.activeHits[1].seriesId).toBe("top-series");
        });
    });

    describe("Range Area & Range Bar Hit Testing", () => {
        const rangeBandHit: SceneHitTarget = {
            datum: { id: 1 },
            index: 0,
            point: { x: 100, y: 80 },
            radius: 6,
            range: {
                formattedFrom: "10",
                formattedTo: "30",
                fromValue: 10,
                highValue: 30,
                lowValue: 10,
                toValue: 30
            },
            rangeBand: {
                fromPoint: { x: 100, y: 130 },
                toPoint: { x: 100, y: 30 }
            },
            renderOrder: 0,
            seriesId: "range-area-1",
            seriesName: "Range Area 1",
            seriesType: "rangeArea",
            valueKind: "range",
            xKey: "Jan",
            xValue: "Jan"
        };

        const topRangeBandHit: SceneHitTarget = {
            datum: { id: 2 },
            index: 0,
            point: { x: 100, y: 80 },
            radius: 6,
            range: {
                formattedFrom: "15",
                formattedTo: "25",
                fromValue: 15,
                highValue: 25,
                lowValue: 15,
                toValue: 25
            },
            rangeBand: {
                fromPoint: { x: 100, y: 90 },
                toPoint: { x: 100, y: 70 }
            },
            renderOrder: 1,
            seriesId: "range-area-2",
            seriesName: "Range Area 2",
            seriesType: "rangeArea",
            valueKind: "range",
            xKey: "Jan",
            xValue: "Jan"
        };

        const zeroHeightBarHit: SceneHitTarget = {
            borderRadius: 4,
            bounds: { height: 4, width: 30, x: 85, y: 148 },
            datum: { id: 3 },
            index: 0,
            range: {
                formattedFrom: "20",
                formattedTo: "20",
                fromValue: 20,
                highValue: 20,
                lowValue: 20,
                toValue: 20
            },
            renderOrder: 2,
            seriesId: "range-bar-1",
            seriesName: "Range Bar 1",
            seriesType: "rangeBar",
            valueKind: "range",
            visualBounds: { height: 0, width: 30, x: 85, y: 150 },
            xKey: "Jan",
            xValue: "Jan"
        };

        const rangeScene: ChartScene = {
            axes: [],
            cartesianKind: "xy",
        coordinateSystem: "cartesian",
            hasRenderableData: true,
            height: 300,
            hitTargets: [rangeBandHit, topRangeBandHit, zeroHeightBarHit],
            interactionBuckets: [
                {
                    anchor: { x: 100, y: 80 },
                    hits: [rangeBandHit, topRangeBandHit, zeroHeightBarHit],
                    order: 0,
                    xKey: "Jan",
                    xValue: "Jan"
                }
            ],
            legendItems: [],
            plotRect: { height: 260, width: 400, x: 40, y: 20 },
            series: [],
            width: 500
        };

        it("should hit test Range Area band interior in non-shared mode (RNG-003)", () => {
            // Pointer at (100, 45) is inside rangeBand [30, 130] but outside topRangeBand [70, 90]
            const hit = ChartHitTestEngine.testHit({ x: 100, y: 45 }, rangeScene, false);
            expect(hit.activeHitTarget?.seriesId).toBe("range-area-1");
        });

        it("should prioritize top renderOrder on overlapping Range Area bands (RNG-006)", () => {
            // Pointer at (100, 80) is inside both bands; topRangeBand has renderOrder 1 > 0
            const hit = ChartHitTestEngine.testHit({ x: 100, y: 80 }, rangeScene, false);
            expect(hit.activeHitTarget?.seriesId).toBe("range-area-2");
        });

        it("should hit test zero-height Range Bar within expanded tolerance bounds (RNG-004)", () => {
            // Pointer at (95, 149) hits zero-height bar with bounds height: 4, y: 148
            const hit = ChartHitTestEngine.testHit({ x: 95, y: 149 }, rangeScene, false);
            expect(hit.activeHitTarget?.seriesId).toBe("range-bar-1");
        });

        it("should return all bucket hits with clamped vertical distance in shared mode", () => {
            const hit = ChartHitTestEngine.testHit({ x: 100, y: 70 }, rangeScene, true);
            expect(hit.activeHits.length).toBe(3);
            expect(hit.activeHitTarget).not.toBeNull();
        });
    });
});
