import { describe, expect, it } from "vitest";
import type { SceneHitTarget } from "../scene/scene-geometry";
import { CartesianMarkerSpatialIndex } from "./cartesian-marker-spatial-index";

describe("CartesianMarkerSpatialIndex", () => {
    it("should index points and return candidates within search radius", () => {
        const index = new CartesianMarkerSpatialIndex(32);

        const target1: SceneHitTarget = {
            datum: {},
            index: 0,
            point: { x: 50, y: 50 },
            radius: 10,
            seriesId: "s1",
            seriesName: "S1",
            seriesType: "scatter",
            visualRadius: 4,
            xKey: 1,
            xValue: 1,
            yValue: 10
        };

        const target2: SceneHitTarget = {
            datum: {},
            index: 1,
            point: { x: 300, y: 300 },
            radius: 10,
            seriesId: "s1",
            seriesName: "S1",
            seriesType: "scatter",
            visualRadius: 4,
            xKey: 2,
            xValue: 2,
            yValue: 20
        };

        index.insertAll([target1, target2]);

        const near1 = index.query({ x: 55, y: 52 }, 15);
        expect(near1).toContain(target1);
        expect(near1).not.toContain(target2);

        const near2 = index.query({ x: 295, y: 305 }, 20);
        expect(near2).toContain(target2);
        expect(near2).not.toContain(target1);

        const farMiss = index.query({ x: 150, y: 150 }, 20);
        expect(farMiss.length).toBe(0);
    });

    it("should handle large bubbles spanning multiple grid cells without duplication", () => {
        const index = new CartesianMarkerSpatialIndex(32);

        const largeBubble: SceneHitTarget = {
            datum: {},
            index: 0,
            point: { x: 100, y: 100 },
            radius: 40,
            seriesId: "b1",
            seriesName: "B1",
            seriesType: "bubble",
            visualRadius: 36,
            xKey: 1,
            xValue: 1,
            yValue: 100
        };

        index.insert(largeBubble);

        const queryAtEdge = index.query({ x: 135, y: 100 }, 10);
        expect(queryAtEdge).toContain(largeBubble);
        expect(queryAtEdge.length).toBe(1); // Deduped
    });
});
