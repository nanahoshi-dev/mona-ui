import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type {
    ChartAngularAxisRegistration,
    ChartRadialAxisRegistration,
    ChartRoseSeriesRegistration
} from "../context/chart-registration-context";
import { ChartStyleResolver } from "../style/chart-style-resolver";
import { RoseLayout } from "./rose-layout";

function createMockRoseSeries(
    overrides?: Partial<Record<keyof ChartRoseSeriesRegistration, unknown>>
): ChartRoseSeriesRegistration {
    const hiddenSet = new Set<string>();
    return {
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
        id: "rose-1",
        innerRadiusRatio: signal(0),
        isDatumVisible: (id: string) => !hiddenSet.has(id),
        keyField: signal(undefined),
        name: signal("Rose"),
        outerRadiusRatio: signal(0.9),
        padAngle: signal(2),
        scaleMode: signal("area"),
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
        type: "rose",
        userClass: signal(""),
        valueFormatter: signal(undefined),
        visible: signal(true),
        ...overrides
    } as unknown as ChartRoseSeriesRegistration;
}

describe("RoseLayout", () => {
    const styleResolver = new ChartStyleResolver();

    it("computes equal angular slots with radial extent reflecting value", () => {
        const series = createMockRoseSeries({
            data: signal([
                { category: "N", value: 100 },
                { category: "E", value: 50 },
                { category: "S", value: 25 },
                { category: "W", value: 75 }
            ])
        });

        const scene = RoseLayout.computeScene({
            containerHeight: 400,
            containerWidth: 400,
            rootData: [],
            series,
            styleResolver
        });

        expect(scene.arcMode).toBe("rose");
        expect(scene.hasRenderableData).toBe(true);
        expect(scene.series.length).toBe(1);

        const seriesScene = scene.series[0];
        if (seriesScene.type !== "rose") {
            throw new Error("Expected rose series scene");
        }
        expect(seriesScene.marks.length).toBe(4);
        expect(seriesScene.angularCategories.length).toBe(4);

        // N has max value (100) -> outerRadius equals outerRadius
        const markN = seriesScene.marks[0];
        const markE = seriesScene.marks[1];
        expect(markN.outerRadius).toBe(scene.outerRadius);
        expect(markE.outerRadius).toBeLessThan(markN.outerRadius);
    });

    it("returns empty marks and targets when series is invisible", () => {
        const series = createMockRoseSeries({
            data: signal([
                { category: "N", value: 100 },
                { category: "E", value: 50 }
            ]),
            visible: signal(false)
        });

        const scene = RoseLayout.computeScene({
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

    it("generates angular and radial axis scenes when axis registrations are present", () => {
        const series = createMockRoseSeries({
            data: signal([
                { category: "N", value: 100 },
                { category: "E", value: 50 }
            ])
        });

        const angularAxis: ChartAngularAxisRegistration = {
            axisLine: signal(true),
            formatter: signal(undefined),
            gridLines: signal(true),
            labelOffset: signal(8),
            labels: signal(true),
            labelTemplate: signal(undefined),
            rotation: signal(0),
            tickCount: signal(undefined),
            userClass: signal(""),
            visible: signal(true)
        };

        const radialAxis: ChartRadialAxisRegistration = {
            axisLine: signal(true),
            formatter: signal(undefined),
            gridLines: signal(true),
            gridShape: signal("circle"),
            labelAngle: signal(0),
            labelOffset: signal(4),
            labels: signal(true),
            labelTemplate: signal(undefined),
            max: signal(100),
            min: signal(0),
            nice: signal(true),
            tickCount: signal(5),
            userClass: signal(""),
            visible: signal(true)
        };

        const scene = RoseLayout.computeScene({
            angularAxis,
            containerHeight: 400,
            containerWidth: 400,
            radialAxis,
            rootData: [],
            series,
            styleResolver
        });

        expect(scene.angularAxis).toBeDefined();
        expect(scene.radialAxis).toBeDefined();
        expect(scene.angularAxis?.ticks.length).toBe(2);
        expect(scene.radialAxis?.ticks.length).toBeGreaterThan(0);
    });
});
