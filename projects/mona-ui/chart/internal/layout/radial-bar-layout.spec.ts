import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type { ChartRadialBarSeriesRegistration } from "../context/chart-registration-context";
import { ChartStyleResolver } from "../style/chart-style-resolver";
import { RadialBarLayout } from "./radial-bar-layout";

function createMockRadialBarSeries(
    overrides?: Partial<Record<keyof ChartRadialBarSeriesRegistration, unknown>>
): ChartRadialBarSeriesRegistration {
    const hiddenSet = new Set<string>();
    return {
        barGap: signal(4),
        barThickness: signal(undefined),
        categoryField: signal("category"),
        categoryFormatter: signal(undefined),
        colorField: signal(undefined),
        colors: signal(undefined),
        cornerRadius: signal(undefined),
        data: signal(undefined),
        datumVisibilityRevision: signal(0),
        element: { nativeElement: null as unknown as HTMLElement },
        endAngle: signal(360),
        field: signal("value"),
        fillMode: signal("solid"),
        fillOpacity: signal(1),
        id: "rb-1",
        innerRadiusRatio: signal(0.2),
        isDatumVisible: (id: string) => !hiddenSet.has(id),
        keyField: signal(undefined),
        max: signal(undefined),
        min: signal(undefined),
        name: signal("Radial Bar"),
        outerRadiusRatio: signal(0.9),
        showTrack: signal(true),
        startAngle: signal(0),
        strokeColor: signal(""),
        strokeWidth: signal(undefined),
        toggleDatumVisibility: (id: string) => {
            if (hiddenSet.has(id)) {
                hiddenSet.delete(id);
                return true;
            }
            hiddenSet.add(id);
            return false;
        },
        trackColor: signal(""),
        trackOpacity: signal(undefined),
        type: "radialBar",
        userClass: signal(""),
        valueFormatter: signal(undefined),
        visible: signal(true),
        ...overrides
    } as unknown as ChartRadialBarSeriesRegistration;
}

describe("RadialBarLayout", () => {
    const styleResolver = new ChartStyleResolver();

    it("computes concentric rings from outermost to innermost", () => {
        const series = createMockRadialBarSeries({
            data: signal([
                { category: "A", value: 30 },
                { category: "B", value: 60 }
            ]),
            innerRadiusRatio: signal(0.2),
            outerRadiusRatio: signal(0.8)
        });

        const scene = RadialBarLayout.computeScene({
            containerHeight: 400,
            containerWidth: 400,
            rootData: [],
            series,
            styleResolver
        });

        expect(scene.arcMode).toBe("radialBar");
        expect(scene.hasRenderableData).toBe(true);
        expect(scene.series.length).toBe(1);

        const seriesScene = scene.series[0];
        if (seriesScene.type !== "radialBar") {
            throw new Error("Expected radialBar series scene");
        }
        expect(seriesScene.marks.length).toBe(2);
        expect(seriesScene.tracks.length).toBe(2);

        // Outermost ring corresponds to first datum "A"
        const markA = seriesScene.marks[0];
        const markB = seriesScene.marks[1];
        expect(markA.category).toBe("A");
        expect(markB.category).toBe("B");
        expect(markA.outerRadius).toBeGreaterThan(markB.outerRadius);
    });

    it("returns empty renderable marks and targets when series is invisible", () => {
        const series = createMockRadialBarSeries({
            data: signal([
                { category: "A", value: 30 },
                { category: "B", value: 60 }
            ]),
            visible: signal(false)
        });

        const scene = RadialBarLayout.computeScene({
            containerHeight: 400,
            containerWidth: 400,
            rootData: [],
            series,
            styleResolver
        });

        expect(scene.hasRenderableData).toBe(false);
        expect(scene.hitTargets.length).toBe(0);
        expect(scene.interactionBuckets.length).toBe(0);

        const seriesScene = scene.series[0];
        if (seriesScene.type === "radialBar") {
            expect(seriesScene.marks.length).toBe(0);
            expect(seriesScene.tracks.length).toBe(0);
        }
    });

    it("reserves half stroke width from outer radius when strokeWidth is specified", () => {
        const seriesWithoutStroke = createMockRadialBarSeries({
            data: signal([{ category: "A", value: 50 }]),
            outerRadiusRatio: signal(1.0),
            strokeWidth: signal(0)
        });

        const seriesWithStroke = createMockRadialBarSeries({
            data: signal([{ category: "A", value: 50 }]),
            outerRadiusRatio: signal(1.0),
            strokeWidth: signal(10)
        });

        const scene1 = RadialBarLayout.computeScene({
            containerHeight: 200,
            containerWidth: 200,
            rootData: [],
            series: seriesWithoutStroke,
            styleResolver
        });

        const scene2 = RadialBarLayout.computeScene({
            containerHeight: 200,
            containerWidth: 200,
            rootData: [],
            series: seriesWithStroke,
            styleResolver
        });

        expect(scene1.outerRadius).toBe(100);
        expect(scene2.outerRadius).toBe(95); // 100 - 10/2
    });
});
