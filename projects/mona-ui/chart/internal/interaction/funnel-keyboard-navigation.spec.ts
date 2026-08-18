import { describe, expect, it } from "vitest";
import { FunnelKeyboardNavigation } from "./funnel-keyboard-navigation";
import type { CartesianFunnelChartScene } from "../scene/funnel-scene";
import { FunnelHitIndex } from "./funnel-hit-index";

describe("FunnelKeyboardNavigation", () => {
    function createMockScene(orientation: "horizontal" | "vertical" = "vertical"): CartesianFunnelChartScene {
        const hitTargets = [
            { animationKey: "f:0", dataIndex: 0, datum: {}, index: 0, itemId: "0", seriesId: "f-1", seriesName: "Funnel", seriesType: "funnel" as const, xKey: "0", xValue: "A" },
            { animationKey: "f:1", dataIndex: 1, datum: {}, index: 1, itemId: "1", seriesId: "f-1", seriesName: "Funnel", seriesType: "funnel" as const, xKey: "1", xValue: "B" },
            { animationKey: "f:2", dataIndex: 2, datum: {}, index: 2, itemId: "2", seriesId: "f-1", seriesName: "Funnel", seriesType: "funnel" as const, xKey: "2", xValue: "C" }
        ];

        return {
            axes: [],
            cartesianKind: "funnel",
            coordinateSystem: "cartesian",
            hasRenderableData: true,
            height: 300,
            hitIndex: new FunnelHitIndex({ entries: [], gap: 10, orientation, plotRect: { height: 300, width: 200, x: 0, y: 0 }, slotSpan: 90 }),
            hitTargets,
            interactionBuckets: [],
            legendItems: [],
            orientation,
            plotRect: { height: 300, width: 200, x: 0, y: 0 },
            sequenceSignature: "sig",
            series: [{
                id: "f-1",
                labels: [],
                name: "Funnel",
                orientation,
                sequenceSignature: "sig",
                stages: [
                    { animationKey: "f:0" } as any,
                    { animationKey: "f:1" } as any,
                    { animationKey: "f:2" } as any
                ],
                style: { baseColor: "#3b82f6", fillOpacity: 1, strokeColor: "", strokeWidth: 0 },
                type: "funnel"
            }],
            width: 200
        };
    }

    it("navigates vertically with ArrowDown / ArrowUp / Home / End", () => {
        const scene = createMockScene("vertical");
        const createKeyEvent = (key: string) => ({ key, preventDefault: () => {} } as KeyboardEvent);

        // ArrowDown from none (-1) -> 0
        const r1 = FunnelKeyboardNavigation.handleKeyDown(createKeyEvent("ArrowDown"), scene, -1);
        expect(r1?.bucketIndex).toBe(0);

        // ArrowDown from 0 -> 1
        const r2 = FunnelKeyboardNavigation.handleKeyDown(createKeyEvent("ArrowDown"), scene, 0);
        expect(r2?.bucketIndex).toBe(1);

        // ArrowDown from 2 -> clamps at 2
        const r3 = FunnelKeyboardNavigation.handleKeyDown(createKeyEvent("ArrowDown"), scene, 2);
        expect(r3?.bucketIndex).toBe(2);

        // ArrowUp from 2 -> 1
        const r4 = FunnelKeyboardNavigation.handleKeyDown(createKeyEvent("ArrowUp"), scene, 2);
        expect(r4?.bucketIndex).toBe(1);

        // Home -> 0
        const r5 = FunnelKeyboardNavigation.handleKeyDown(createKeyEvent("Home"), scene, 2);
        expect(r5?.bucketIndex).toBe(0);

        // End -> 2
        const r6 = FunnelKeyboardNavigation.handleKeyDown(createKeyEvent("End"), scene, 0);
        expect(r6?.bucketIndex).toBe(2);
    });

    it("navigates horizontally with ArrowRight / ArrowLeft / Home / End", () => {
        const scene = createMockScene("horizontal");
        const createKeyEvent = (key: string) => ({ key, preventDefault: () => {} } as KeyboardEvent);

        // ArrowRight from none (-1) -> 0
        const r1 = FunnelKeyboardNavigation.handleKeyDown(createKeyEvent("ArrowRight"), scene, -1);
        expect(r1?.bucketIndex).toBe(0);

        // ArrowRight from 0 -> 1
        const r2 = FunnelKeyboardNavigation.handleKeyDown(createKeyEvent("ArrowRight"), scene, 0);
        expect(r2?.bucketIndex).toBe(1);

        // ArrowLeft from 1 -> 0
        const r3 = FunnelKeyboardNavigation.handleKeyDown(createKeyEvent("ArrowLeft"), scene, 1);
        expect(r3?.bucketIndex).toBe(0);
    });
});
