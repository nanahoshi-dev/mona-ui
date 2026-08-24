import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type { ChartFunnelSeriesRegistration } from "../context/chart-registration-context";
import { ChartStyleResolver } from "../style/chart-style-resolver";
import { computeFunnelLabelRect, FunnelLayoutEngine } from "./funnel-layout-engine";

function createMockFunnelRegistration(
    data?: readonly unknown[] | unknown,
    overrides: Partial<{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [K in keyof ChartFunnelSeriesRegistration]: ChartFunnelSeriesRegistration[K] extends (...args: any[]) => any
            ? ChartFunnelSeriesRegistration[K]
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            : any;
    }> = {}
): ChartFunnelSeriesRegistration {
    const hiddenSet = new Set<string>();

    return {
        categoryField: signal("stage"),
        categoryFormatter: signal(undefined),
        color: signal(undefined),
        colorField: signal(undefined),
        colors: signal(undefined),
        data: signal(data),
        datumVisibilityRevision: signal(0),
        element: { nativeElement: undefined as unknown as HTMLElement },
        field: signal("value"),
        fillOpacity: signal(1),
        gap: signal(2),
        id: "f-1",
        isDatumVisible: (itemId: string) => !hiddenSet.has(itemId),
        keyField: signal(undefined),
        labelContent: signal("category-value"),
        labelTemplate: signal(undefined),
        maxLabels: signal(100),
        minLabelHeight: signal(undefined),
        minLabelWidth: signal(undefined),
        name: signal("Funnel"),
        orientation: signal("vertical"),
        showLabels: signal(true),
        strokeColor: signal(""),
        strokeWidth: signal(undefined),
        toggleDatumVisibility: (itemId: string) => {
            if (hiddenSet.has(itemId)) {
                hiddenSet.delete(itemId);
            } else {
                hiddenSet.add(itemId);
            }
            return !hiddenSet.has(itemId);
        },
        type: "funnel",
        valueFormatter: signal(undefined),
        visible: signal(true),
        widthRatio: signal(0.9),
        ...overrides
    } as unknown as ChartFunnelSeriesRegistration;
}

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

        const registration = createMockFunnelRegistration(data, {
            gap: signal(10),
            widthRatio: signal(1.0)
        });

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
        const registration = createMockFunnelRegistration(data, {
            gap: signal(50),
            labelContent: signal("value"),
            widthRatio: signal(1.0)
        });

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

    it("normalizes invalid orientation string to vertical with warning", () => {
        const warned = new Set<string>();
        const data = [{ stage: "S1", value: 100 }];

        const registration = createMockFunnelRegistration(data, {
            orientation: signal("slant" as unknown as import("../../models/chart-funnel.models").ChartFunnelOrientation)
        });

        const plotRect = { height: 200, width: 200, x: 0, y: 0 };
        const scene = FunnelLayoutEngine.layout(
            registration,
            plotRect,
            200,
            200,
            styleResolver,
            undefined,
            warned
        );

        expect(scene.orientation).toBe("vertical");
        expect(warned.has("f-1:invalid-orientation")).toBe(true);
    });

    it("normalizes non-finite numeric inputs (gap, widthRatio, maxLabels, minLabelWidth, minLabelHeight)", () => {
        const data = [{ stage: "S1", value: 100 }, { stage: "S2", value: 50 }];

        const registration = createMockFunnelRegistration(data, {
            gap: signal(NaN),
            maxLabels: signal(Infinity),
            minLabelHeight: signal(NaN),
            minLabelWidth: signal(-10),
            showLabels: signal(true),
            widthRatio: signal(NaN)
        });

        const plotRect = { height: 200, width: 200, x: 0, y: 0 };
        const scene = FunnelLayoutEngine.layout(registration, plotRect, 200, 200, styleResolver);

        expect(scene.hasRenderableData).toBe(true);
        expect(scene.series[0].stages.length).toBe(2);
        expect(scene.series[0].labels.length).toBe(2);
    });

    it("calculates readable label foreground color for contrast against stage background", () => {
        const data = [
            { stage: "Dark", value: 100 }
        ];

        const registration = createMockFunnelRegistration(data, {
            color: signal("#000000"), // Very dark background
            showLabels: signal(true)
        });

        const plotRect = { height: 200, width: 200, x: 0, y: 0 };
        const scene = FunnelLayoutEngine.layout(registration, plotRect, 200, 200, styleResolver);

        // Readable foreground for black background is white/light
        expect(scene.series[0].stages[0].textColor).toBe("#ffffff");
        expect(scene.series[0].labels[0].fillColor).toBe("#000000");
        expect(scene.series[0].labels[0].textColor).toBe("#ffffff");
    });
});
