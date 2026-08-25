import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type { ChartDonutSeriesRegistration, ChartPieSeriesRegistration } from "../context/chart-registration-context";
import type { PolarSectorChartScene } from "../scene/chart-scene";
import { ChartStyleResolver } from "../style/chart-style-resolver";
import { PolarLayoutEngine } from "./polar-layout-engine";

describe("polar-layout-engine", () => {
    const styleResolver = new ChartStyleResolver();

    function createMockPieSeries(overrides: Partial<ChartPieSeriesRegistration> = {}): ChartPieSeriesRegistration {
        const hiddenSet = new Set<number>();
        return {
            categoryField: signal("category"),
            categoryFormatter: signal(undefined),
            colorField: signal(undefined),
            colors: signal(undefined),
            cornerRadius: signal(undefined),
            data: signal(undefined),
            element: { nativeElement: {} as HTMLElement },
            endAngle: signal(360),
            field: signal("value"),
            fillOpacity: signal(undefined),
            id: "pie-1",
            isSliceVisible: (idx: number) => !hiddenSet.has(idx),
            labelContent: signal("percentage"),
            labelPosition: signal("outside"),
            minLabelAngle: signal(12),
            name: signal("Pie"),
            outerRadiusRatio: signal(0.9),
            padAngle: signal(0),
            showLabels: signal(false),
            sliceLabelTemplate: signal(undefined),
            startAngle: signal(0),
            strokeColor: signal(""),
            strokeWidth: signal(undefined),
            toggleSliceVisibility: (idx: number) => {
                if (hiddenSet.has(idx)) {
                    hiddenSet.delete(idx);
                    return true;
                }
                hiddenSet.add(idx);
                return false;
            },
            type: "pie",
            valueFormatter: signal(undefined),
            visibilityRevision: signal(0),
            visible: signal(true),
            ...overrides
        };
    }

    function createMockDonutSeries(
        overrides: Partial<ChartDonutSeriesRegistration> = {}
    ): ChartDonutSeriesRegistration {
        return {
            ...createMockPieSeries(),
            centerTemplate: signal(undefined),
            id: "donut-1",
            innerRadiusRatio: signal(0.6),
            name: signal("Donut"),
            type: "donut",
            ...overrides
        };
    }

    it("should compute center and radii for square and rectangular containers", () => {
        const series = createMockPieSeries();
        const rootData = [
            { category: "A", value: 30 },
            { category: "B", value: 70 }
        ];

        // 500x300 container -> plotRect is (500 - 32) x (300 - 32) = 468 x 268
        const scene = PolarLayoutEngine.computeScene({
            containerHeight: 300,
            containerWidth: 500,
            rootData,
            series: [series],
            styleResolver
        }) as PolarSectorChartScene;

        expect(scene.coordinateSystem).toBe("polar");
        expect(scene.polarKind).toBe("sector");
        expect(scene.hasRenderableData).toBe(true);
        expect(scene.center.x).toBeCloseTo(250);
        expect(scene.center.y).toBeCloseTo(150);

        const seriesScene = scene.series[0];
        expect(seriesScene.type).toBe("pie");
        expect(seriesScene.innerRadius).toBe(0);
        // availableRadius = 268 / 2 = 134, requestedOuterRadius = 134 * 0.9 = 120.6, strokeInset = 0.5 -> 120.1
        expect(seriesScene.outerRadius).toBeCloseTo(120.1);
        expect(seriesScene.slices.length).toBe(2);
    });

    it("should handle donut innerRadius correctly", () => {
        const series = createMockDonutSeries({
            innerRadiusRatio: signal(0.5),
            outerRadiusRatio: signal(1.0)
        });
        const rootData = [{ category: "A", value: 100 }];

        const scene = PolarLayoutEngine.computeScene({
            containerHeight: 200,
            containerWidth: 200,
            rootData,
            series: [series],
            styleResolver
        }) as PolarSectorChartScene;

        const seriesScene = scene.series[0];
        expect(seriesScene.type).toBe("donut");
        // availableRadius = (200 - 32) / 2 = 84, strokeInset = 0.5 -> 83.5
        expect(seriesScene.outerRadius).toBeCloseTo(83.5);
        expect(seriesScene.innerRadius).toBeCloseTo(41.75);
    });

    it("should reserve gutters and compute outside labels when showLabels is true and labelPosition is outside", () => {
        const series = createMockPieSeries({
            labelPosition: signal("outside"),
            showLabels: signal(true)
        });
        const rootData = [
            { category: "First", value: 40 },
            { category: "Second", value: 60 }
        ];

        const scene = PolarLayoutEngine.computeScene({
            containerHeight: 400,
            containerWidth: 500,
            rootData,
            series: [series],
            styleResolver
        }) as PolarSectorChartScene;

        const s0 = scene.series[0].slices[0];
        const s1 = scene.series[0].slices[1];

        expect(s0.label).toBeDefined();
        expect(s1.label).toBeDefined();
        expect(s0.label?.visible).toBe(true);
        expect(s1.label?.visible).toBe(true);
        // Leader line geometry present
        expect(s0.label?.arcAnchor).toBeDefined();
        expect(s0.label?.elbow).toBeDefined();
        expect(s0.label?.lineEnd).toBeDefined();
    });

    it("should not reserve gutters and should not create outside leader lines when labelPosition is inside", () => {
        const series = createMockPieSeries({
            labelPosition: signal("inside"),
            minLabelAngle: signal(12),
            showLabels: signal(true)
        });
        const rootData = [
            { category: "First", value: 98 },
            { category: "Tiny", value: 2 } // 2% < 12 deg (7.2 deg), so inside label should be suppressed
        ];

        const scene = PolarLayoutEngine.computeScene({
            containerHeight: 400,
            containerWidth: 400,
            rootData,
            series: [series],
            styleResolver
        }) as PolarSectorChartScene;

        const s0 = scene.series[0].slices[0];
        const s1 = scene.series[0].slices[1];

        // s0 has inside point
        expect(s0.insideLabelPoint).toBeDefined();
        // Tiny slice has span < 12 deg, so s1.label is undefined
        expect(s1.label).toBeUndefined();
    });

    it("should generate hit targets and interaction buckets for each slice", () => {
        const series = createMockPieSeries();
        const rootData = [
            { category: "First", value: 40 },
            { category: "Second", value: 60 }
        ];

        const scene = PolarLayoutEngine.computeScene({
            containerHeight: 400,
            containerWidth: 400,
            rootData,
            series: [series],
            styleResolver
        }) as PolarSectorChartScene;

        expect(scene.hitTargets.length).toBe(2);
        expect(scene.interactionBuckets.length).toBe(2);
        expect(scene.hitTargets[0].category).toBe("First");
        expect(scene.hitTargets[0].percentage).toBeCloseTo(0.4);
        expect(scene.hitTargets[0].arc).toBeDefined();
        expect(scene.hitTargets[0].arc?.innerRadius).toBe(0);
        expect(scene.hitTargets[0].arc?.outerRadius).toBeGreaterThan(0);
    });

    it("should generate legend items for all valid slices including hidden ones", () => {
        const hiddenSet = new Set([0]); // First slice hidden
        const series = createMockPieSeries({
            isSliceVisible: (idx: number) => !hiddenSet.has(idx)
        });
        const rootData = [
            { category: "First", value: 40 },
            { category: "Second", value: 60 }
        ];

        const scene = PolarLayoutEngine.computeScene({
            containerHeight: 400,
            containerWidth: 400,
            rootData,
            series: [series],
            styleResolver
        }) as PolarSectorChartScene;

        expect(scene.legendItems.length).toBe(2);
        expect(scene.legendItems[0].visible).toBe(false);
        expect(scene.legendItems[1].visible).toBe(true);

        // Only 1 slice rendered
        expect(scene.series[0].slices.length).toBe(1);
        expect(scene.series[0].slices[0].category).toBe("Second");
        // Visible slice takes 100% of visible pie
        expect(scene.series[0].slices[0].percentage).toBe(1);
    });

    it("should handle partial angle spans and pad angles", () => {
        const series = createMockPieSeries({
            endAngle: signal(180),
            padAngle: signal(2),
            startAngle: signal(0)
        });
        const rootData = [
            { category: "Left", value: 50 },
            { category: "Right", value: 50 }
        ];

        const scene = PolarLayoutEngine.computeScene({
            containerHeight: 400,
            containerWidth: 400,
            rootData,
            series: [series],
            styleResolver
        }) as PolarSectorChartScene;

        const seriesScene = scene.series[0];
        expect(seriesScene.slices[0].startAngle).toBeCloseTo(0);
        expect(seriesScene.slices[1].endAngle).toBeCloseTo(Math.PI);
    });

    it("should fail safe to finite geometry when non-finite or extreme values are passed", () => {
        const series = createMockPieSeries({
            cornerRadius: signal(Number.NaN),
            endAngle: signal(Number.POSITIVE_INFINITY),
            minLabelAngle: signal(Number.NaN),
            outerRadiusRatio: signal(Number.NaN),
            padAngle: signal(Number.NaN),
            startAngle: signal(Number.NaN)
        });
        const rootData = [{ category: "A", value: 100 }];

        const scene = PolarLayoutEngine.computeScene({
            containerHeight: 400,
            containerWidth: 400,
            rootData,
            series: [series],
            styleResolver
        }) as PolarSectorChartScene;

        expect(Number.isFinite(scene.center.x)).toBe(true);
        expect(Number.isFinite(scene.center.y)).toBe(true);
        const s = scene.series[0];
        expect(Number.isFinite(s.outerRadius)).toBe(true);
        expect(Number.isFinite(s.innerRadius)).toBe(true);
        expect(Number.isFinite(s.cornerRadius)).toBe(true);
        expect(Number.isFinite(s.padAngle)).toBe(true);
        expect(s.slices.length).toBe(1);
        expect(Number.isFinite(s.slices[0].startAngle)).toBe(true);
        expect(Number.isFinite(s.slices[0].endAngle)).toBe(true);
    });

    it("should keep legend item percentages stable based on source total when slices are hidden", () => {
        const hiddenSet = new Set<number>([0]);
        const series = createMockPieSeries({
            isSliceVisible: (idx: number) => !hiddenSet.has(idx)
        });
        const rootData = [
            { category: "Hidden", value: 60 },
            { category: "Visible", value: 40 }
        ];

        const scene = PolarLayoutEngine.computeScene({
            containerHeight: 400,
            containerWidth: 400,
            rootData,
            series: [series],
            styleResolver
        }) as PolarSectorChartScene;

        // Total source = 100
        expect(scene.legendItems[0].percentage).toBeCloseTo(0.6);
        expect(scene.legendItems[1].percentage).toBeCloseTo(0.4);

        // Visible slice takes 100% of visible rendering
        expect(scene.series[0].slices[0].percentage).toBe(1.0);
    });

    it("should pass formattedValue from valueFormatter to hit targets", () => {
        const series = createMockPieSeries({
            valueFormatter: signal((val: unknown) => `$${Number(val).toFixed(2)}`)
        });
        const rootData = [{ category: "Sales", value: 125 }];

        const scene = PolarLayoutEngine.computeScene({
            containerHeight: 400,
            containerWidth: 400,
            rootData,
            series: [series],
            styleResolver
        }) as PolarSectorChartScene;

        expect(scene.hitTargets[0].formattedValue).toBe("$125.00");
    });
});
