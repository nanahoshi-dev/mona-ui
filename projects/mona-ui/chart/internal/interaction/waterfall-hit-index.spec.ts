import { describe, expect, it } from "vitest";
import type { ChartRect } from "../../models/chart.models";
import type { SceneHitTarget } from "../scene/scene-geometry";
import { WaterfallHitIndex, type WaterfallHitEntry } from "./waterfall-hit-index";

describe("WaterfallHitIndex", () => {
    const plotRect: ChartRect = { height: 400, width: 600, x: 50, y: 50 };

    function createDummyTarget(id: string, x: number, y: number, w: number, h: number): SceneHitTarget {
        return {
            animationKey: `target:${id}`,
            bounds: { height: h, width: w, x, y },
            dataIndex: 0,
            datum: {},
            formattedCategory: id,
            formattedValue: "100",
            index: 0,
            itemId: id,
            point: { x: x + w / 2, y: y + h / 2 },
            renderOrder: 0,
            seriesId: "w-1",
            seriesName: "Waterfall",
            seriesType: "waterfall",
            value: 100,
            valueKind: "waterfall",
            visualBounds: { height: h, width: w, x, y },
            xKey: id,
            xValue: id,
            yValue: 100
        };
    }

    it("queries candidate bar bounding box with zero-change tolerance", () => {
        const target1 = createDummyTarget("step1", 100, 100, 40, 60);
        const targetZero = createDummyTarget("stepZero", 200, 150, 40, 1);

        const entries: WaterfallHitEntry[] = [
            {
                animationKey: "target:step1",
                bounds: target1.bounds!,
                isZeroChange: false,
                slotIndex: 0,
                target: target1
            },
            {
                animationKey: "target:stepZero",
                bounds: targetZero.bounds!,
                isZeroChange: true,
                slotIndex: 1,
                target: targetZero
            }
        ];

        const index = new WaterfallHitIndex({
            bandwidth: 40,
            entries,
            plotRect,
            step: 100
        });

        // Inside regular bar
        expect(index.query({ x: 120, y: 130 })).toBe(target1);

        // Outside regular bar X
        expect(index.query({ x: 90, y: 130 })).toBe(null);

        // Outside regular bar Y
        expect(index.query({ x: 120, y: 80 })).toBe(null);

        // Zero-change hairline: exact Y (150)
        expect(index.query({ x: 220, y: 150 })).toBe(targetZero);

        // Zero-change hairline: within ±4px tolerance
        expect(index.query({ x: 220, y: 147 })).toBe(targetZero);
        expect(index.query({ x: 220, y: 154 })).toBe(targetZero);

        // Zero-change hairline: outside tolerance
        expect(index.query({ x: 220, y: 144 })).toBe(null);
        expect(index.query({ x: 220, y: 158 })).toBe(null);

        // Outside plot area entirely
        expect(index.query({ x: 10, y: 10 })).toBe(null);
        expect(index.query({ x: 700, y: 700 })).toBe(null);
    });

    it("queries efficiently with large entry counts (1,000 and 10,000)", () => {
        const count = 1000;
        const step = 600 / count;
        const entries: WaterfallHitEntry[] = [];

        for (let i = 0; i < count; i++) {
            const x = plotRect.x + i * step;
            const target = createDummyTarget(`s-${i}`, x, 100, step * 0.8, 50);
            entries.push({
                animationKey: `target:s-${i}`,
                bounds: target.bounds!,
                isZeroChange: false,
                slotIndex: i,
                target
            });
        }

        const index = new WaterfallHitIndex({
            bandwidth: step * 0.8,
            entries,
            plotRect,
            step
        });

        // Query index 500
        const queryPoint = { x: plotRect.x + 500 * step + (step * 0.8) / 2, y: 125 };
        const result = index.query(queryPoint);
        expect(result).toBeDefined();
        expect(result?.itemId).toBe("s-500");
    });
});
