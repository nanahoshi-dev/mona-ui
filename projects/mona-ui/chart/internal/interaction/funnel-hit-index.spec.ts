import { describe, expect, it } from "vitest";
import { FunnelHitIndex, isPointInConvexPolygon } from "./funnel-hit-index";
import type { SceneFunnelStage } from "../scene/funnel-scene";
import type { SceneHitTarget } from "../scene/scene-geometry";

describe("FunnelHitIndex", () => {
    it("isPointInConvexPolygon returns true inside and false outside", () => {
        const poly = [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 80, y: 50 },
            { x: 20, y: 50 }
        ];

        expect(isPointInConvexPolygon({ x: 50, y: 25 }, poly)).toBe(true);
        // Outside the trapezoid slope (e.g. top corner outside)
        expect(isPointInConvexPolygon({ x: 10, y: 45 }, poly)).toBe(false);
        expect(isPointInConvexPolygon({ x: 90, y: 45 }, poly)).toBe(false);
    });

    it("queries candidate slot and performs exact polygon containment check", () => {
        const plotRect = { height: 200, width: 100, x: 0, y: 0 };
        const stage0Poly = [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 80, y: 90 },
            { x: 20, y: 90 }
        ] as const;

        const stage1Poly = [
            { x: 20, y: 110 },
            { x: 80, y: 110 },
            { x: 80, y: 200 },
            { x: 20, y: 200 }
        ] as const;

        const stage0: SceneFunnelStage = {
            animationKey: "f:0",
            bounds: { height: 90, width: 100, x: 0, y: 0 },
            category: "A",
            dataIndex: 0,
            datum: {},
            fillColor: "#3b82f6",
            formattedCategory: "A",
            formattedValue: "100",
            polygon: stage0Poly,
            renderOrder: 0,
            sourceIndex: 0,
            stageId: "0",
            stageIndex: 0,
            textColor: "#ffffff",
            value: 100
        };

        const stage1: SceneFunnelStage = {
            animationKey: "f:1",
            bounds: { height: 90, width: 60, x: 20, y: 110 },
            category: "B",
            dataIndex: 1,
            datum: {},
            fillColor: "#10b981",
            formattedCategory: "B",
            formattedValue: "60",
            polygon: stage1Poly,
            renderOrder: 1,
            sourceIndex: 1,
            stageId: "1",
            stageIndex: 1,
            textColor: "#ffffff",
            value: 60
        };

        const target0: SceneHitTarget = {
            animationKey: "f:0",
            bounds: stage0.bounds,
            dataIndex: 0,
            datum: {},
            index: 0,
            itemId: "0",
            seriesId: "f-1",
            seriesName: "Funnel",
            seriesType: "funnel",
            xKey: "0",
            xValue: "A"
        };

        const target1: SceneHitTarget = {
            animationKey: "f:1",
            bounds: stage1.bounds,
            dataIndex: 1,
            datum: {},
            index: 1,
            itemId: "1",
            seriesId: "f-1",
            seriesName: "Funnel",
            seriesType: "funnel",
            xKey: "1",
            xValue: "B"
        };

        const hitIndex = new FunnelHitIndex(
            plotRect,
            "vertical",
            90, // slotSpan
            20, // gap
            [stage0, stage1],
            [target0, target1]
        );

        // Center of stage 0 -> target 0
        expect(hitIndex.query({ x: 50, y: 45 })).toBe(target0);

        // In corner outside trapezoid slope -> null
        expect(hitIndex.query({ x: 5, y: 80 })).toBeNull();

        // In gap between y=90 and y=110 -> null
        expect(hitIndex.query({ x: 50, y: 100 })).toBeNull();

        // Center of stage 1 -> target 1
        expect(hitIndex.query({ x: 50, y: 150 })).toBe(target1);

        // Outside plotRect -> null
        expect(hitIndex.query({ x: 150, y: 50 })).toBeNull();
    });
});
