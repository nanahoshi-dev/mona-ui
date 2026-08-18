import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type { ChartFunnelSeriesRegistration } from "../context/chart-registration-context";
import { ChartStyleResolver } from "../style/chart-style-resolver";
import { computeFunnelLabelRect, FunnelLayoutEngine } from "./funnel-layout-engine";

describe("FunnelLayoutEngine", () => {
    const styleResolver = new ChartStyleResolver();

    it("computes empty scene with hasRenderableData false", () => {
        const empty = FunnelLayoutEngine.computeEmptyScene(400, 300);
        expect(empty.hasRenderableData).toBe(false);
        expect(empty.series).toEqual([]);
        expect(empty.hitTargets).toEqual([]);
        expect(empty.plotRect).toEqual({ height: 284, width: 384, x: 8, y: 8 });
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
            element: { nativeElement: undefined as any },
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

    it("caps requested gap in dense scenarios so stages always have renderable positive span", () => {
        const data = [
            { stage: "S1", value: 100 },
            { stage: "S2", value: 90 },
            { stage: "S3", value: 80 },
            { stage: "S4", value: 70 },
            { stage: "S5", value: 60 }
        ];

        // Total height = 100, requested gap = 50 (would consume 200px if uncapped)
        const registration: ChartFunnelSeriesRegistration = {
            categoryField: signal("stage"),
            data: signal(data),
            datumVisibilityRevision: signal(0),
            element: { nativeElement: undefined as any },
            field: signal("value"),
            gap: signal(50),
            id: "f-1",
            isDatumVisible: () => true,
            labelContent: signal("value"),
            name: signal("Funnel"),
            orientation: signal("vertical"),
            toggleDatumVisibility: () => true,
            type: "funnel",
            visible: signal(true),
            widthRatio: signal(1.0)
        };

        const plotRect = { height: 100, width: 100, x: 0, y: 0 };
        const scene = FunnelLayoutEngine.layout(registration, plotRect, 100, 100, styleResolver);

        expect(scene.hasRenderableData).toBe(true);
        // Effective gap should be capped to (100 * 0.5) / 4 = 12.5
        // Slot span should be (100 - 12.5 * 4) / 5 = 10
        const stages = scene.series[0].stages;
        expect(stages.length).toBe(5);
        expect(stages[0].bounds.height).toBe(10);
        expect(stages[1].bounds.y).toBe(22.5);
    });

    it("computes safe inscribed label rects inside polygon bounds", () => {
        const verticalPoly = [
            { x: 20, y: 0 },
            { x: 180, y: 0 },
            { x: 140, y: 100 },
            { x: 60, y: 100 }
        ] as const;

        const labelRect = computeFunnelLabelRect(verticalPoly, "vertical");
        // Safe X: max(20, 60) = 60
        // Safe Right: min(180, 140) = 140 -> safe width = 80
        // Safe Y: 0, safe height: 100
        expect(labelRect).toEqual({
            height: 100,
            width: 80,
            x: 60,
            y: 0
        });
    });
});
