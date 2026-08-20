import { describe, expect, it } from "vitest";
import { CartesianBrushMarkIndex } from "./cartesian-brush-mark-index";
import type { SceneHitTarget } from "../scene/scene-geometry";

describe("CartesianBrushMarkIndex", () => {
    it("should spatial query marks using center policy", () => {
        const index = new CartesianBrushMarkIndex();
        const hit1: Partial<SceneHitTarget> = {
            animationKey: "m1",
            seriesId: "s1",
            point: { x: 100, y: 100 }
        };
        const hit2: Partial<SceneHitTarget> = {
            animationKey: "m2",
            seriesId: "s1",
            point: { x: 200, y: 200 }
        };

        index.build([hit1 as SceneHitTarget, hit2 as SceneHitTarget]);

        // Brush covering only hit1
        const results = index.query(
            { x: 50, y: 50, width: 100, height: 100 },
            "center",
            "xy"
        );

        expect(results).toHaveLength(1);
        expect(results[0].animationKey).toBe("m1");
    });

    it("should filter by xAxisId and yAxisId when specified", () => {
        const index = new CartesianBrushMarkIndex();
        const hit1: Partial<SceneHitTarget> = {
            animationKey: "m1",
            seriesId: "s1",
            xAxisId: "x1",
            yAxisId: "y1",
            point: { x: 100, y: 100 }
        };
        const hit2: Partial<SceneHitTarget> = {
            animationKey: "m2",
            seriesId: "s2",
            xAxisId: "x2",
            yAxisId: "y2",
            point: { x: 100, y: 100 }
        };

        index.build([hit1 as SceneHitTarget, hit2 as SceneHitTarget]);

        const results = index.query(
            { x: 50, y: 50, width: 100, height: 100 },
            "center",
            "xy",
            "x1",
            "y1"
        );

        expect(results).toHaveLength(1);
        expect(results[0].animationKey).toBe("m1");
    });
});
