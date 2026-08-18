import { describe, expect, it } from "vitest";
import type { ChartWaterfallSeriesScene, SceneWaterfallBar } from "../../scene/waterfall-scene";
import { WaterfallAnimationAdapter } from "./waterfall-animation-adapter";

describe("WaterfallAnimationAdapter", () => {
    const adapter = new WaterfallAnimationAdapter();

    const barA: SceneWaterfallBar = {
        animationKey: "w:a",
        barEnd: 100,
        barStart: 0,
        borderRadius: 4,
        bounds: { height: 100, width: 50, x: 10, y: 100 },
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
        fromY: 200,
        isZeroChange: false,
        itemId: "a",
        kind: "change",
        renderOpacity: 1,
        renderOrder: 0,
        toY: 100,
        visualKind: "increase"
    };

    const barAUpdated: SceneWaterfallBar = {
        ...barA,
        barEnd: 200,
        bounds: { height: 200, width: 50, x: 10, y: 0 },
        fromY: 200,
        toY: 0
    };

    const scene1: ChartWaterfallSeriesScene = {
        bars: [barA],
        connectors: [],
        id: "w-1",
        kindSignature: "change:increase",
        labels: [],
        name: "Waterfall",
        renderOpacity: 1,
        sequenceSignature: "sig1",
        style: {} as any,
        type: "waterfall"
    };

    const scene2: ChartWaterfallSeriesScene = {
        ...scene1,
        bars: [barAUpdated],
        sequenceSignature: "sig2"
    };

    it("interpolates semantic endpoints fromY and toY and derives bounds correctly", () => {
        const plan = adapter.createPlan(scene1, scene2, {
            options: { data: true, duration: 300, easing: "ease-out", enabled: true, initial: true, visibility: true },
            trigger: "data"
        });

        const sampledMid = plan.sample(0.5);
        expect(sampledMid).not.toBeNull();
        expect(sampledMid!.bars.length).toBe(1);

        const midBar = sampledMid!.bars[0];
        // fromY: 200 -> 200, at 0.5 = 200
        expect(midBar.fromY).toBe(200);
        // toY: 100 -> 0, at 0.5 = 50
        expect(midBar.toY).toBe(50);
        // bounds: y = min(200, 50) = 50, height = abs(200 - 50) = 150
        expect(midBar.bounds.y).toBe(50);
        expect(midBar.bounds.height).toBe(150);
        // Target-authoritative values preserved: barEnd is 200
        expect(midBar.barEnd).toBe(200);
    });

    it("fades in entering bars from 0 opacity collapsed at baseline fromY", () => {
        const plan = adapter.createPlan(null, scene1, {
            options: { data: true, duration: 300, easing: "ease-out", enabled: true, initial: true, visibility: true },
            trigger: "initial"
        });

        const sampled0 = plan.sample(0);
        expect(sampled0!.bars[0].renderOpacity).toBe(0);
        expect(sampled0!.bars[0].fromY).toBe(200);
        expect(sampled0!.bars[0].toY).toBe(200);
        expect(sampled0!.bars[0].bounds.height).toBe(0);

        const sampled1 = plan.sample(1);
        expect(sampled1!.bars[0].renderOpacity).toBe(1);
        expect(sampled1!.bars[0].toY).toBe(100);
        expect(sampled1!.bars[0].bounds.height).toBe(100);
    });
});
