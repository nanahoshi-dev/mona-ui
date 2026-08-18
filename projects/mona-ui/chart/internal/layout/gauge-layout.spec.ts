import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type { ChartGaugeSeriesRegistration } from "../context/chart-registration-context";
import { ChartStyleResolver } from "../style/chart-style-resolver";
import { GaugeLayout } from "./gauge-layout";

function createMockGaugeSeries(
    overrides?: Partial<Record<keyof ChartGaugeSeriesRegistration, unknown>>
): ChartGaugeSeriesRegistration {
    return {
        centerTemplate: signal(undefined),
        color: signal("#3b82f6"),
        cornerRadius: signal(undefined),
        data: signal(undefined),
        element: { nativeElement: null as unknown as HTMLElement },
        endAngle: signal(120),
        field: signal("value"),
        fillMode: signal("solid"),
        fillOpacity: signal(1),
        hubRadius: signal(5),
        id: "gauge-1",
        indicator: signal("both"),
        innerRadiusRatio: signal(0.72),
        keyField: signal(undefined),
        max: signal(100),
        min: signal(0),
        name: signal("Gauge"),
        needleColor: signal("#1e293b"),
        needleLengthRatio: signal(0.78),
        needleWidth: signal(2),
        outerRadiusRatio: signal(0.9),
        showValue: signal(true),
        startAngle: signal(-120),
        trackColor: signal("#e2e8f0"),
        trackOpacity: signal(0.15),
        type: "gauge",
        userClass: signal(""),
        value: signal(60),
        valueFormatter: signal(undefined),
        visible: signal(true),
        ...overrides
    } as unknown as ChartGaugeSeriesRegistration;
}

describe("GaugeLayout", () => {
    const styleResolver = new ChartStyleResolver();

    it("computes gauge track, value arc, and needle", () => {
        const series = createMockGaugeSeries({
            indicator: signal("both"),
            value: signal(75)
        });

        const scene = GaugeLayout.computeScene({
            containerHeight: 400,
            containerWidth: 400,
            rootData: [],
            series,
            styleResolver
        });

        expect(scene.arcMode).toBe("gauge");
        expect(scene.hasRenderableData).toBe(true);
        expect(scene.series.length).toBe(1);

        const seriesScene = scene.series[0];
        if (seriesScene.type !== "gauge") {
            throw new Error("Expected gauge series scene");
        }
        expect(seriesScene.value.rawValue).toBe(75);
        expect(seriesScene.value.ratio).toBe(0.75);
        expect(seriesScene.needle).toBeDefined();
        expect(seriesScene.track).toBeDefined();
    });

    it("returns empty hit targets and hasRenderableData false when series is invisible", () => {
        const series = createMockGaugeSeries({
            value: signal(75),
            visible: signal(false)
        });

        const scene = GaugeLayout.computeScene({
            containerHeight: 400,
            containerWidth: 400,
            rootData: [],
            series,
            styleResolver
        });

        expect(scene.hasRenderableData).toBe(false);
        expect(scene.hitTargets.length).toBe(0);
        expect(scene.interactionBuckets.length).toBe(0);
    });

    it("handles no-data and invalid value gracefully", () => {
        const series = createMockGaugeSeries({
            data: signal([]),
            value: signal(undefined)
        });

        const scene = GaugeLayout.computeScene({
            containerHeight: 400,
            containerWidth: 400,
            rootData: [],
            series,
            styleResolver
        });

        expect(scene.hasRenderableData).toBe(false);
        expect(scene.hitTargets.length).toBe(0);
        expect(scene.interactionBuckets.length).toBe(0);
    });
});
