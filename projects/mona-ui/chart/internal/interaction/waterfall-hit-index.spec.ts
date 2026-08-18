import { describe, expect, it } from "vitest";
import { WaterfallHitIndex } from "./waterfall-hit-index";
import type { SceneWaterfallBar } from "../scene/waterfall-scene";
import type { SceneHitTarget } from "../scene/scene-geometry";

describe("WaterfallHitIndex", () => {
    it("queries candidate bar bounding box with zero-change tolerance", () => {
        const plotRect = { height: 200, width: 200, x: 0, y: 0 };

        const bar0: SceneWaterfallBar = {
            animationKey: "w:0",
            barEnd: 100,
            barStart: 0,
            borderRadius: 4,
            bounds: { height: 50, width: 40, x: 20, y: 50 },
            category: "A",
            color: "#10b981",
            cumulativeAfter: 100,
            cumulativeBefore: 0,
            dataIndex: 0,
            datum: {},
            formattedCategory: "A",
            formattedCumulativeAfter: "100",
            formattedCumulativeBefore: "0",
            formattedValue: "100",
            fromY: 100,
            isZeroChange: false,
            itemId: "w:0",
            kind: "change",
            renderOrder: 0,
            toY: 50,
            visualKind: "increase"
        };

        const bar1Zero: SceneWaterfallBar = {
            animationKey: "w:1",
            barEnd: 100,
            barStart: 100,
            borderRadius: 4,
            bounds: { height: 1, width: 40, x: 80, y: 50 },
            category: "B",
            color: "#6b7280",
            cumulativeAfter: 100,
            cumulativeBefore: 100,
            dataIndex: 1,
            datum: {},
            formattedCategory: "B",
            formattedCumulativeAfter: "100",
            formattedCumulativeBefore: "100",
            formattedValue: "100",
            fromY: 50,
            isZeroChange: true,
            itemId: "w:1",
            kind: "change",
            renderOrder: 1,
            toY: 50,
            visualKind: "neutral"
        };

        const target0: SceneHitTarget = {
            animationKey: "w:0",
            bounds: bar0.bounds,
            dataIndex: 0,
            datum: {},
            index: 0,
            itemId: "w:0",
            seriesId: "w-1",
            seriesName: "Waterfall",
            seriesType: "waterfall",
            xKey: "w:0",
            xValue: "A"
        };

        const target1: SceneHitTarget = {
            animationKey: "w:1",
            bounds: bar1Zero.bounds,
            dataIndex: 1,
            datum: {},
            index: 1,
            itemId: "w:1",
            seriesId: "w-1",
            seriesName: "Waterfall",
            seriesType: "waterfall",
            xKey: "w:1",
            xValue: "B"
        };

        const hitIndex = new WaterfallHitIndex(
            plotRect,
            [bar0, bar1Zero],
            [target0, target1]
        );

        // Inside bar 0
        expect(hitIndex.query({ x: 30, y: 70 })).toBe(target0);

        // Outside bar 0
        expect(hitIndex.query({ x: 10, y: 70 })).toBeNull();

        // Inside zero-change bar 1 with tolerance (y=50 +- 4)
        expect(hitIndex.query({ x: 90, y: 52 })).toBe(target1);
        expect(hitIndex.query({ x: 90, y: 48 })).toBe(target1);

        // Outside plotRect
        expect(hitIndex.query({ x: 250, y: 70 })).toBeNull();
    });
});
