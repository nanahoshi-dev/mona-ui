import { describe, expect, it } from "vitest";
import { FunnelHitIndex, isPointInConvexPolygon, type FunnelHitEntry } from "./funnel-hit-index";
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

        const target0: SceneHitTarget = {
            animationKey: "f:0",
            bounds: { height: 90, width: 100, x: 0, y: 0 },
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
            bounds: { height: 90, width: 60, x: 20, y: 110 },
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

        const entries: FunnelHitEntry[] = [
            {
                animationKey: "f:0",
                bounds: target0.bounds!,
                polygon: stage0Poly,
                slotIndex: 0,
                target: target0
            },
            {
                animationKey: "f:1",
                bounds: target1.bounds!,
                polygon: stage1Poly,
                slotIndex: 1,
                target: target1
            }
        ];

        const hitIndex = new FunnelHitIndex({
            entries,
            gap: 20,
            orientation: "vertical",
            plotRect,
            slotSpan: 90
        });

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

    it("queries exact polygon for sampled transition frames without slotIndex", () => {
        const plotRect = { height: 200, width: 100, x: 0, y: 0 };
        const stagePoly = [
            { x: 10, y: 10 },
            { x: 90, y: 10 },
            { x: 70, y: 90 },
            { x: 30, y: 90 }
        ] as const;

        const targetSampled: SceneHitTarget = {
            animationKey: "f:sampled",
            bounds: { height: 80, width: 80, x: 10, y: 10 },
            dataIndex: 0,
            datum: {},
            index: 0,
            itemId: "s0",
            seriesId: "f-1",
            seriesName: "Funnel",
            seriesType: "funnel",
            xKey: "s0",
            xValue: "Sampled"
        };

        const entries: FunnelHitEntry[] = [
            {
                animationKey: "f:sampled",
                bounds: targetSampled.bounds!,
                polygon: stagePoly,
                target: targetSampled
            }
        ];

        const hitIndex = new FunnelHitIndex({
            entries,
            gap: 20,
            orientation: "vertical",
            plotRect,
            slotSpan: 90
        });

        expect(hitIndex.query({ x: 50, y: 50 })).toBe(targetSampled);
        expect(hitIndex.query({ x: 15, y: 85 })).toBeNull();
    });
});
