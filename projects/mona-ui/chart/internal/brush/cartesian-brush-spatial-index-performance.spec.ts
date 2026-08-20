import { describe, expect, it } from "vitest";
import { CartesianBrushMarkIndex } from "./cartesian-brush-mark-index";
import type { SceneHitTarget } from "../scene/scene-geometry";

describe("CartesianBrushMarkIndex Candidate-Local Spatial Indexing & Performance", () => {
    it("indexes marks by spatial cell and returns deterministic ordinal sort order", () => {
        const index = new CartesianBrushMarkIndex();
        const hits: SceneHitTarget[] = [
            {
                seriesId: "s1",
                seriesName: "Series 1",
                seriesType: "bar",
                index: 0,
                datum: null,
                xKey: 0,
                xValue: 0,
                visualBounds: { x: 10, y: 10, width: 20, height: 50 },
                point: { x: 20, y: 35 }
            },
            {
                seriesId: "s1",
                seriesName: "Series 1",
                seriesType: "bar",
                index: 1,
                datum: null,
                xKey: 1,
                xValue: 1,
                visualBounds: { x: 50, y: 10, width: 20, height: 50 },
                point: { x: 60, y: 35 }
            },
            {
                seriesId: "s1",
                seriesName: "Series 1",
                seriesType: "bar",
                index: 2,
                datum: null,
                xKey: 2,
                xValue: 2,
                visualBounds: { x: 100, y: 10, width: 20, height: 50 },
                point: { x: 110, y: 35 }
            }
        ];

        index.build(hits);

        // Query bounding box that only contains the first mark
        const query1 = index.query({ x: 5, y: 5, width: 30, height: 60 }, "contains");
        expect(query1.length).toBe(1);
        expect(query1[0].index).toBe(0);

        // Query bounding box that intersects marks 1 and 2
        const query2 = index.query({ x: 45, y: 5, width: 70, height: 60 }, "intersect");
        expect(query2.length).toBe(2);
        expect(query2[0].index).toBe(1);
        expect(query2[1].index).toBe(2);
    });

    it("respects marker radius visual bounds for scatter and line points", () => {
        const index = new CartesianBrushMarkIndex();
        const hit: SceneHitTarget = {
            seriesId: "s2",
            seriesName: "Scatter",
            seriesType: "scatter",
            index: 0,
            datum: null,
            xKey: 0,
            xValue: 0,
            radius: 8,
            visualRadius: 8,
            point: { x: 100, y: 100 }
        };

        index.build([hit]);

        // Query rectangle that includes point visual radius (92 to 108)
        const matched = index.query({ x: 90, y: 90, width: 25, height: 25 }, "contains");
        expect(matched.length).toBe(1);
        expect(matched[0].seriesId).toBe("s2");
    });
});
