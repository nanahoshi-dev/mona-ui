import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type { ChartFunnelSeriesRegistration } from "../context/chart-registration-context";
import { ChartStyleResolver } from "../style/chart-style-resolver";
import { FunnelLayoutEngine } from "./funnel-layout-engine";

describe("FunnelLayoutEngine", () => {
    const styleResolver = new ChartStyleResolver();

    it("computes empty scene with hasRenderableData false", () => {
        const empty = FunnelLayoutEngine.computeEmptyScene(400, 300);
        expect(empty.hasRenderableData).toBe(false);
        expect(empty.series).toEqual([]);
        expect(empty.hitTargets).toEqual([]);
    });

    it("generates correct vertical trapezoid geometry with flat bottom on the last stage", () => {
        const data = [
            { stage: "Top", value: 100 },
            { stage: "Mid", value: 50 },
            { stage: "Bot", value: 20 }
        ];

        const registration: ChartFunnelSeriesRegistration = {
            categoryField: signal("stage"),
            data: signal(data),
            datumVisibilityRevision: signal(0),
            element: { nativeElement: document.createElement("div") },
            field: signal("value"),
            gap: signal(10),
            id: "f-1",
            isDatumVisible: () => true,
            labelContent: signal("category-value"),
            name: signal("Funnel"),
            orientation: signal("vertical"),
            toggleDatumVisibility: () => true,
            type: "funnel",
            visible: signal(true),
            widthRatio: signal(1.0)
        };

        const plotRect = { height: 290, width: 200, x: 0, y: 0 };
        const scene = FunnelLayoutEngine.layout(registration, plotRect, 200, 290, styleResolver);

        expect(scene.hasRenderableData).toBe(true);
        expect(scene.series.length).toBe(1);

        const stages = scene.series[0].stages;
        expect(stages.length).toBe(3);

        // 3 stages, gap = 10, total gap = 20. Available height = 290 - 20 = 270. Slot height = 90.
        // Stage 0: y in [0, 90]. Top width: 100/100 * 200 = 200 (x in [0, 200]). Bot width: 50/100 * 200 = 100 (x in [50, 150]).
        expect(stages[0].polygon).toEqual([
            { x: 0, y: 0 },
            { x: 200, y: 0 },
            { x: 150, y: 90 },
            { x: 50, y: 90 }
        ]);

        // Stage 1: y in [100, 190]. Top width: 100 (x in [50, 150]). Bot width: 20/100 * 200 = 40 (x in [80, 120]).
        expect(stages[1].polygon).toEqual([
            { x: 50, y: 100 },
            { x: 150, y: 100 },
            { x: 120, y: 190 },
            { x: 80, y: 190 }
        ]);

        // Stage 2 (last stage): y in [200, 290]. Top width: 40 (x in [80, 120]). Bot width: flat 40 (x in [80, 120]).
        expect(stages[2].polygon).toEqual([
            { x: 80, y: 200 },
            { x: 120, y: 200 },
            { x: 120, y: 290 },
            { x: 80, y: 290 }
        ]);
    });

    it("generates correct horizontal trapezoid geometry with flat right side on the last stage", () => {
        const data = [
            { stage: "First", value: 100 },
            { stage: "Last", value: 50 }
        ];

        const registration: ChartFunnelSeriesRegistration = {
            categoryField: signal("stage"),
            data: signal(data),
            datumVisibilityRevision: signal(0),
            element: { nativeElement: document.createElement("div") },
            field: signal("value"),
            gap: signal(10),
            id: "f-1",
            isDatumVisible: () => true,
            labelContent: signal("value"),
            name: signal("Funnel"),
            orientation: signal("horizontal"),
            toggleDatumVisibility: () => true,
            type: "funnel",
            visible: signal(true),
            widthRatio: signal(1.0)
        };

        const plotRect = { height: 100, width: 210, x: 0, y: 0 };
        const scene = FunnelLayoutEngine.layout(registration, plotRect, 210, 100, styleResolver);

        expect(scene.hasRenderableData).toBe(true);
        const stages = scene.series[0].stages;
        expect(stages.length).toBe(2);

        // 2 stages, gap = 10. Available width = 200. Slot width = 100.
        // Stage 0: x in [0, 100]. Leading height: 100/100 * 100 = 100 (y in [0, 100]). Trailing height: 50/100 * 100 = 50 (y in [25, 75]).
        expect(stages[0].polygon).toEqual([
            { x: 0, y: 0 },
            { x: 100, y: 25 },
            { x: 100, y: 75 },
            { x: 0, y: 100 }
        ]);

        // Stage 1 (last stage): x in [110, 210]. Leading height: 50 (y in [25, 75]). Trailing height: flat 50 (y in [25, 75]).
        expect(stages[1].polygon).toEqual([
            { x: 110, y: 25 },
            { x: 210, y: 25 },
            { x: 210, y: 75 },
            { x: 110, y: 75 }
        ]);
    });
});
