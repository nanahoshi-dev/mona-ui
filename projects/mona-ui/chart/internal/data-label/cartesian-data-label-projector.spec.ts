import { describe, expect, it } from "vitest";
import { CartesianDataLabelProjector } from "./cartesian-data-label-projector";
import type { ChartSeriesRegistration } from "../context/chart-registration-context";
import type { ChartDataLabelTemplateDirective } from "../../directives/chart-data-label-template.directive";
import type { SceneHitTarget } from "../scene/scene-geometry";
import { signal } from "@angular/core";

describe("CartesianDataLabelProjector", () => {
    const plotRect = { x: 50, y: 50, width: 400, height: 300 };

    it("should not project data labels if series dataLabels is false or not enabled", () => {
        const series: Partial<ChartSeriesRegistration> = {
            dataLabels: signal(false),
            id: "s1"
        };
        const hit: Partial<SceneHitTarget> = {
            animationKey: "m1",
            index: 0,
            point: { x: 100, y: 100 },
            seriesId: "s1",
            yValue: 42
        };

        const scene = CartesianDataLabelProjector.project({
            defaultColor: "#000",
            font: "12px sans-serif",
            haloColor: "#fff",
            haloWidth: 2,
            hitTargets: [hit as SceneHitTarget],
            plotRect,
            selectedMarkIds: new Set(),
            seriesRegistrations: [series as ChartSeriesRegistration],
            templateMeasurements: new Map()
        });

        expect(scene.defaultLabels).toHaveLength(0);
        expect(scene.templateLabels).toHaveLength(0);
    });

    it("should project default canvas labels when dataLabels is true", () => {
        const series: Partial<ChartSeriesRegistration> = {
            dataLabels: signal(true),
            id: "s1"
        };
        const hit: Partial<SceneHitTarget> = {
            animationKey: "m1",
            index: 0,
            point: { x: 100, y: 100 },
            seriesId: "s1",
            yValue: 42
        };

        const scene = CartesianDataLabelProjector.project({
            defaultColor: "#111",
            font: "12px sans-serif",
            haloColor: "#fff",
            haloWidth: 2,
            hitTargets: [hit as SceneHitTarget],
            plotRect,
            selectedMarkIds: new Set(),
            seriesRegistrations: [series as ChartSeriesRegistration],
            templateMeasurements: new Map()
        });

        expect(scene.defaultLabels).toHaveLength(1);
        expect(scene.defaultLabels[0].text).toBe("42");
        expect(scene.defaultLabels[0].markId).toBe("m1");
    });

    it("should set selected = true in template data label context when markId is in selectedMarkIds", () => {
        const dummyTemplate = {} as unknown as ChartDataLabelTemplateDirective;
        const series: Partial<ChartSeriesRegistration> = {
            dataLabels: signal(true),
            dataLabelTemplate: signal(dummyTemplate),
            id: "s1"
        };
        const hit: Partial<SceneHitTarget> = {
            animationKey: "m1",
            index: 0,
            point: { x: 100, y: 100 },
            seriesId: "s1",
            yValue: 42
        };

        const scene = CartesianDataLabelProjector.project({
            defaultColor: "#111",
            font: "12px sans-serif",
            haloColor: "#fff",
            haloWidth: 2,
            hitTargets: [hit as SceneHitTarget],
            plotRect,
            selectedMarkIds: new Set(["m1"]),
            seriesRegistrations: [series as ChartSeriesRegistration],
            templateMeasurements: new Map([["s1:m1", { height: 20, width: 40 }]])
        });

        expect(scene.templateLabels).toHaveLength(1);
        expect(scene.templateLabels[0].context.selected).toBe(true);
        expect(scene.templateLabels[0].context.formattedValue).toBe("42");
    });

    it("should hide overlapping labels if allowOverlap is false", () => {
        const series: Partial<ChartSeriesRegistration> = {
            dataLabels: signal({ allowOverlap: false, position: "top" }),
            id: "s1"
        };
        // Two marks placed at identical pixel position
        const hit1: Partial<SceneHitTarget> = {
            animationKey: "m1",
            index: 0,
            point: { x: 100, y: 100 },
            seriesId: "s1",
            yValue: 42
        };
        const hit2: Partial<SceneHitTarget> = {
            animationKey: "m2",
            index: 1,
            point: { x: 100, y: 100 },
            seriesId: "s1",
            yValue: 43
        };

        const scene = CartesianDataLabelProjector.project({
            defaultColor: "#111",
            font: "12px sans-serif",
            haloColor: "#fff",
            haloWidth: 2,
            hitTargets: [hit1 as SceneHitTarget, hit2 as SceneHitTarget],
            plotRect,
            selectedMarkIds: new Set(),
            seriesRegistrations: [series as ChartSeriesRegistration],
            templateMeasurements: new Map()
        });

        // Second label collides with first and is hidden
        expect(scene.defaultLabels).toHaveLength(1);
        expect(scene.defaultLabels[0].markId).toBe("m1");
    });
});
