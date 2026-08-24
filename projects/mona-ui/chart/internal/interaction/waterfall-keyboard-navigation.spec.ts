import { describe, expect, it } from "vitest";
import { WaterfallKeyboardNavigation } from "./waterfall-keyboard-navigation";
import type { CartesianWaterfallChartScene, ChartWaterfallSeriesStyle, SceneWaterfallBar } from "../scene/waterfall-scene";
import { WaterfallHitIndex } from "./waterfall-hit-index";

describe("WaterfallKeyboardNavigation", () => {
    function createMockScene(): CartesianWaterfallChartScene {
        const hitTargets = [
            { animationKey: "w:0", dataIndex: 0, datum: {}, index: 0, itemId: "w:0", seriesId: "w-1", seriesName: "Waterfall", seriesType: "waterfall" as const, xKey: "w:0", xValue: "A" },
            { animationKey: "w:1", dataIndex: 1, datum: {}, index: 1, itemId: "w:1", seriesId: "w-1", seriesName: "Waterfall", seriesType: "waterfall" as const, xKey: "w:1", xValue: "B" },
            { animationKey: "w:2", dataIndex: 2, datum: {}, index: 2, itemId: "w:2", seriesId: "w-1", seriesName: "Waterfall", seriesType: "waterfall" as const, xKey: "w:2", xValue: "C" }
        ];

        return {
            axes: [],
            cartesianKind: "waterfall",
            coordinateSystem: "cartesian",
            hasRenderableData: true,
            height: 300,
            hitIndex: new WaterfallHitIndex({ entries: [], plotRect: { height: 300, width: 300, x: 0, y: 0 } }),
            hitTargets,
            interactionBuckets: [],
            kindSignature: "",
            legendItems: [],
            plotRect: { height: 300, width: 300, x: 0, y: 0 },
            sequenceSignature: "sig",
            series: [{
                bars: [
                    { animationKey: "w:0" } as unknown as SceneWaterfallBar,
                    { animationKey: "w:1" } as unknown as SceneWaterfallBar,
                    { animationKey: "w:2" } as unknown as SceneWaterfallBar
                ],
                connectors: [],
                id: "w-1",
                kindSignature: "",
                labels: [],
                name: "Waterfall",
                sequenceSignature: "sig",
                style: {} as unknown as ChartWaterfallSeriesStyle,
                type: "waterfall"
            }],
            width: 300,
            xAxisType: "category"
        };
    }

    it("navigates horizontally with ArrowRight / ArrowLeft / Home / End", () => {
        const scene = createMockScene();

        const createKeyEvent = (key: string) => ({ key, preventDefault: () => {} } as KeyboardEvent);

        // ArrowRight from none (-1) -> 0
        const r1 = WaterfallKeyboardNavigation.handleKeyDown(createKeyEvent("ArrowRight"), scene, -1);
        expect(r1?.bucketIndex).toBe(0);

        // ArrowRight from 0 -> 1
        const r2 = WaterfallKeyboardNavigation.handleKeyDown(createKeyEvent("ArrowRight"), scene, 0);
        expect(r2?.bucketIndex).toBe(1);

        // ArrowLeft from 1 -> 0
        const r3 = WaterfallKeyboardNavigation.handleKeyDown(createKeyEvent("ArrowLeft"), scene, 1);
        expect(r3?.bucketIndex).toBe(0);

        // Home -> 0
        const r4 = WaterfallKeyboardNavigation.handleKeyDown(createKeyEvent("Home"), scene, 2);
        expect(r4?.bucketIndex).toBe(0);

        // End -> 2
        const r5 = WaterfallKeyboardNavigation.handleKeyDown(createKeyEvent("End"), scene, 0);
        expect(r5?.bucketIndex).toBe(2);
    });
});
