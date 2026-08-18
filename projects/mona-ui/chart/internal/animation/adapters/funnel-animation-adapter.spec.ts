import { describe, expect, it } from "vitest";
import type { ChartFunnelSeriesScene, SceneFunnelStage } from "../../scene/funnel-scene";
import { FunnelAnimationAdapter } from "./funnel-animation-adapter";

describe("FunnelAnimationAdapter", () => {
    const adapter = new FunnelAnimationAdapter();

    const stageA: SceneFunnelStage = {
        animationKey: "f:a",
        bounds: { height: 100, width: 200, x: 0, y: 0 },
        category: "A",
        conversionRate: undefined,
        dataIndex: 0,
        datum: {},
        dropOff: undefined,
        fillColor: "#3b82f6",
        formattedCategory: "A",
        formattedValue: "100",
        polygon: [
            { x: 0, y: 0 },
            { x: 200, y: 0 },
            { x: 150, y: 100 },
            { x: 50, y: 100 }
        ],
        renderOpacity: 1,
        renderOrder: 0,
        sourceIndex: 0,
        stageId: "a",
        stageIndex: 0,
        textColor: "#ffffff",
        value: 100
    };

    const stageAUpdated: SceneFunnelStage = {
        ...stageA,
        bounds: { height: 100, width: 100, x: 50, y: 0 },
        polygon: [
            { x: 50, y: 0 },
            { x: 150, y: 0 },
            { x: 125, y: 100 },
            { x: 75, y: 100 }
        ],
        value: 200
    };

    const scene1: ChartFunnelSeriesScene = {
        id: "f-1",
        labels: [],
        name: "Funnel",
        orientation: "vertical",
        renderOpacity: 1,
        sequenceSignature: "sig1",
        stages: [stageA],
        style: { baseColor: "#3b82f6", fillOpacity: 1, strokeColor: "", strokeWidth: 0 },
        type: "funnel"
    };

    const scene2: ChartFunnelSeriesScene = {
        ...scene1,
        sequenceSignature: "sig2",
        stages: [stageAUpdated]
    };

    it("interpolates 4-vertex polygon geometry and bounds during update transition", () => {
        const plan = adapter.createPlan(scene1, scene2, {
            options: { data: true, duration: 300, easing: "ease-out", enabled: true, initial: true, visibility: true },
            trigger: "data"
        });

        const sampledMid = plan.sample(0.5);
        expect(sampledMid).not.toBeNull();
        expect(sampledMid!.stages.length).toBe(1);

        const midStage = sampledMid!.stages[0];
        // Mid polygon:
        // p0: (0 + 50)/2 = 25
        // p1: (200 + 150)/2 = 175
        // p2: (150 + 125)/2 = 137.5
        // p3: (50 + 75)/2 = 62.5
        expect(midStage.polygon[0].x).toBe(25);
        expect(midStage.polygon[1].x).toBe(175);
        expect(midStage.polygon[2].x).toBe(137.5);
        expect(midStage.polygon[3].x).toBe(62.5);

        // Bounds: width was 200 -> 100, at 0.5 = 150
        expect(midStage.bounds.width).toBe(150);
        // Value is target-authoritative: 200
        expect(midStage.value).toBe(200);
    });

    it("fades in entering stages from 0 opacity with collapsed polygon", () => {
        const plan = adapter.createPlan(null, scene1, {
            options: { data: true, duration: 300, easing: "ease-out", enabled: true, initial: true, visibility: true },
            trigger: "initial"
        });

        const sampled0 = plan.sample(0);
        expect(sampled0!.stages[0].renderOpacity).toBe(0);

        // At 0, collapsed polygon has width 0 at center (x = 100)
        expect(sampled0!.stages[0].polygon[0].x).toBe(100);
        expect(sampled0!.stages[0].polygon[1].x).toBe(100);

        const sampled1 = plan.sample(1);
        expect(sampled1!.stages[0].renderOpacity).toBe(1);
        expect(sampled1!.stages[0].polygon[0].x).toBe(0);
        expect(sampled1!.stages[0].polygon[1].x).toBe(200);
    });
});
