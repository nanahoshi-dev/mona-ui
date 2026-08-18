import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type {
    ChartWaterfallSeriesRegistration,
    ChartXAxisRegistration,
    ChartYAxisRegistration
} from "../context/chart-registration-context";
import { ChartStyleResolver } from "../style/chart-style-resolver";
import { WaterfallLayoutEngine } from "./waterfall-layout-engine";

describe("WaterfallLayoutEngine", () => {
    const styleResolver = new ChartStyleResolver();

    it("computes empty scene with hasRenderableData false", () => {
        const scene = WaterfallLayoutEngine.computeEmptyScene(500, 400);
        expect(scene.hasRenderableData).toBe(false);
        expect(scene.cartesianKind).toBe("waterfall");
        expect(scene.series).toEqual([]);
        expect(scene.plotRect).toEqual({ height: 384, width: 484, x: 8, y: 8 });
    });

    it("lays out waterfall bars with unique slot keys for duplicate categories", () => {
        const data = [
            { category: "Revenue", value: 100 },
            { category: "Cost", value: -30 },
            { category: "Revenue", value: 50 }
        ];

        const registration: ChartWaterfallSeriesRegistration = {
            data: signal(data),
            element: { nativeElement: undefined as any },
            field: signal("value"),
            id: "w-1",
            name: signal("Waterfall"),
            type: "waterfall",
            visible: signal(true)
        };

        const scene = WaterfallLayoutEngine.layout(
            registration,
            600,
            400,
            styleResolver
        );

        expect(scene.hasRenderableData).toBe(true);
        const bars = scene.series[0].bars;
        expect(bars.length).toBe(3);

        // Three distinct X positions for the three bars
        expect(bars[0].bounds.x).toBeLessThan(bars[1].bounds.x);
        expect(bars[1].bounds.x).toBeLessThan(bars[2].bounds.x);

        // First bar: 0..100
        expect(bars[0].barStart).toBe(0);
        expect(bars[0].barEnd).toBe(100);

        // Second bar: 100..70
        expect(bars[1].barStart).toBe(100);
        expect(bars[1].barEnd).toBe(70);

        // Third bar: 70..120
        expect(bars[2].barStart).toBe(70);
        expect(bars[2].barEnd).toBe(120);

        // Connectors between adjacent bars
        expect(scene.series[0].connectors.length).toBe(2);
        expect(scene.series[0].connectors[0].fromAnimationKey).toBe(bars[0].animationKey);
        expect(scene.series[0].connectors[0].toAnimationKey).toBe(bars[1].animationKey);
    });

    it("falls back to rootXField when series xField is undefined", () => {
        const data = [
            { month: "Jan", value: 100 },
            { month: "Feb", value: -20 }
        ];

        const registration: ChartWaterfallSeriesRegistration = {
            data: signal(data),
            element: { nativeElement: undefined as any },
            field: signal("value"),
            id: "w-1",
            name: signal("Waterfall"),
            type: "waterfall",
            visible: signal(true),
            xField: signal(undefined)
        };

        const scene = WaterfallLayoutEngine.layout(
            registration,
            600,
            400,
            styleResolver,
            undefined,
            undefined,
            undefined,
            "month"
        );

        expect(scene.series[0].bars[0].formattedCategory).toBe("Jan");
        expect(scene.series[0].bars[1].formattedCategory).toBe("Feb");
    });

    it("warns on incompatible X and Y axis types and normalizes", () => {
        const warned = new Set<string>();
        const data = [{ category: "A", value: 10 }];

        const registration: ChartWaterfallSeriesRegistration = {
            data: signal(data),
            element: { nativeElement: undefined as any },
            field: signal("value"),
            id: "w-1",
            name: signal("Waterfall"),
            type: "waterfall",
            visible: signal(true)
        };

        const xAxis: ChartXAxisRegistration = {
            axisLine: signal(true),
            formatter: signal(undefined),
            gridLines: signal(false),
            labelTemplate: signal(undefined),
            max: signal(undefined),
            min: signal(undefined),
            nice: signal(true),
            position: signal("bottom"),
            tickCount: signal(undefined),
            title: signal(""),
            type: signal("linear" as any),
            visible: signal(true)
        };

        const yAxis: ChartYAxisRegistration = {
            axisLine: signal(true),
            formatter: signal(undefined),
            gridLines: signal(false),
            labelTemplate: signal(undefined),
            max: signal(undefined),
            min: signal(undefined),
            nice: signal(true),
            position: signal("left"),
            tickCount: signal(undefined),
            title: signal(""),
            type: signal("category" as any),
            visible: signal(true)
        };

        const scene = WaterfallLayoutEngine.layout(
            registration,
            600,
            400,
            styleResolver,
            xAxis,
            yAxis,
            undefined,
            undefined,
            warned
        );

        expect(scene.hasRenderableData).toBe(true);
        expect(warned.has("w-1:incompatible-x-axis-type:linear")).toBe(true);
        expect(warned.has("w-1:incompatible-y-axis-type:category")).toBe(true);
    });

    it("applies responsive X tick thinning on large datasets while retaining first and last ticks", () => {
        const count = 500;
        const data = Array.from({ length: count }, (_, i) => ({
            category: `Step ${i + 1}`,
            value: (i % 2 === 0 ? 10 : -5)
        }));

        const registration: ChartWaterfallSeriesRegistration = {
            data: signal(data),
            element: { nativeElement: undefined as any },
            field: signal("value"),
            id: "w-1",
            name: signal("Waterfall"),
            type: "waterfall",
            visible: signal(true)
        };

        const scene = WaterfallLayoutEngine.layout(
            registration,
            600,
            400,
            styleResolver
        );

        const xAxes = scene.axes.filter(a => a.axis === "x");
        expect(xAxes.length).toBe(1);
        const ticks = xAxes[0].ticks;

        // Bounded number of ticks (far less than 500)
        expect(ticks.length).toBeLessThanOrEqual(100);
        expect(ticks.length).toBeGreaterThan(1);

        // First tick corresponds to index 0, last tick corresponds to index 499
        expect(ticks[0].index).toBe(0);
        expect(ticks[ticks.length - 1].index).toBe(499);
    });

    it("honors connectorWidth: 0 by not generating connectors", () => {
        const data = [
            { category: "A", value: 10 },
            { category: "B", value: 20 }
        ];

        const registration: ChartWaterfallSeriesRegistration = {
            connectorWidth: signal(0),
            data: signal(data),
            element: { nativeElement: undefined as any },
            field: signal("value"),
            id: "w-1",
            name: signal("Waterfall"),
            type: "waterfall",
            visible: signal(true)
        };

        const scene = WaterfallLayoutEngine.layout(
            registration,
            600,
            400,
            styleResolver
        );

        expect(scene.series[0].connectors.length).toBe(0);
    });

    it("populates borderRadius on hit targets and bars", () => {
        const data = [{ category: "A", value: 10 }];

        const registration: ChartWaterfallSeriesRegistration = {
            borderRadius: signal(8),
            data: signal(data),
            element: { nativeElement: undefined as any },
            field: signal("value"),
            id: "w-1",
            name: signal("Waterfall"),
            type: "waterfall",
            visible: signal(true)
        };

        const scene = WaterfallLayoutEngine.layout(
            registration,
            600,
            400,
            styleResolver
        );

        expect(scene.series[0].bars[0].borderRadius).toBe(8);
        expect(scene.hitTargets[0].borderRadius).toBe(8);
    });

    it("normalizes non-finite layout caps (maxLabels, minLabelWidth, maxBarWidth)", () => {
        const data = [
            { category: "A", value: 10 },
            { category: "B", value: 20 }
        ];

        const registration: ChartWaterfallSeriesRegistration = {
            data: signal(data),
            element: { nativeElement: undefined as any },
            field: signal("value"),
            id: "w-1",
            maxBarWidth: signal(NaN as any),
            maxLabels: signal(Infinity as any),
            minLabelWidth: signal(-5),
            name: signal("Waterfall"),
            showLabels: signal(true),
            type: "waterfall",
            visible: signal(true)
        };

        const scene = WaterfallLayoutEngine.layout(
            registration,
            600,
            400,
            styleResolver
        );

        expect(scene.hasRenderableData).toBe(true);
        expect(scene.series[0].labels.length).toBe(2);
        expect(scene.series[0].bars.every(b => Number.isFinite(b.bounds.width) && b.bounds.width > 0)).toBe(true);
    });

    it("applies X-axis formatter consistently across bar, hit, label, and axis ticks", () => {
        const data = [
            { category: "2026-Q1", value: 100 },
            { category: "2026-Q2", value: -30 }
        ];

        const registration: ChartWaterfallSeriesRegistration = {
            data: signal(data),
            element: { nativeElement: undefined as any },
            field: signal("value"),
            id: "w-1",
            name: signal("Waterfall"),
            showLabels: signal(true),
            type: "waterfall",
            visible: signal(true),
            xField: signal("category")
        };

        const xAxis: ChartXAxisRegistration = {
            axisLine: signal(true),
            formatter: signal((val: unknown) => `Quarter: ${String(val)}`),
            gridLines: signal(false),
            labelTemplate: signal(undefined),
            max: signal(undefined),
            min: signal(undefined),
            nice: signal(true),
            position: signal("bottom"),
            tickCount: signal(undefined),
            title: signal(""),
            type: signal("category"),
            visible: signal(true)
        };

        const scene = WaterfallLayoutEngine.layout(
            registration,
            600,
            400,
            styleResolver,
            xAxis
        );

        expect(scene.series[0].bars[0].formattedCategory).toBe("Quarter: 2026-Q1");
        expect(scene.hitTargets[0].formattedCategory).toBe("Quarter: 2026-Q1");
        expect(scene.series[0].labels[0].formattedCategory).toBe("Quarter: 2026-Q1");
        expect(scene.axes[0].ticks[0].formattedValue).toBe("Quarter: 2026-Q1");
    });

    it("maintains static renderOpacity = 1 on scene bars and connectors regardless of fillOpacity", () => {
        const data = [
            { category: "A", value: 10 },
            { category: "B", value: -5 }
        ];

        const registration: ChartWaterfallSeriesRegistration = {
            data: signal(data),
            element: { nativeElement: undefined as any },
            field: signal("value"),
            fillOpacity: signal(0.5),
            id: "w-1",
            name: signal("Waterfall"),
            type: "waterfall",
            visible: signal(true)
        };

        const scene = WaterfallLayoutEngine.layout(
            registration,
            600,
            400,
            styleResolver
        );

        expect(scene.series[0].bars[0].renderOpacity).toBe(1);
        expect(scene.series[0].bars[1].renderOpacity).toBe(1);
        expect(scene.series[0].connectors[0].renderOpacity).toBe(1);
    });

    it("uses canonical source-index formattedCategory for X axis ticks when earlier source rows are omitted (FWF-C3)", () => {
        const data = [
            { category: "InvalidRow", kind: "change", value: "NaN" }, // omitted
            { category: "FirstValid", kind: "change", value: 100 },   // dataIndex = 1
            { category: "SecondValid", kind: "change", value: -20 }   // dataIndex = 2
        ];

        const registration: ChartWaterfallSeriesRegistration = {
            data: signal(data),
            element: { nativeElement: undefined as any },
            field: signal("value"),
            id: "w-1",
            kindField: signal("kind"),
            name: signal("Waterfall"),
            showLabels: signal(true),
            type: "waterfall",
            visible: signal(true),
            xField: signal("category")
        };

        const xAxis: ChartXAxisRegistration = {
            axisLine: signal(true),
            formatter: signal((val: unknown, idx?: number) => `src-${idx}:${val}`),
            gridLines: signal(false),
            labelTemplate: signal(undefined),
            max: signal(undefined),
            min: signal(undefined),
            nice: signal(true),
            position: signal("bottom"),
            tickCount: signal(undefined),
            title: signal(""),
            type: signal("category"),
            visible: signal(true)
        };

        const scene = WaterfallLayoutEngine.layout(
            registration,
            600,
            400,
            styleResolver,
            xAxis
        );

        expect(scene.series[0].bars.length).toBe(2);
        expect(scene.series[0].bars[0].formattedCategory).toBe("src-1:FirstValid");
        expect(scene.series[0].bars[1].formattedCategory).toBe("src-2:SecondValid");

        const xAxes = scene.axes.filter(a => a.axis === "x");
        expect(xAxes[0].ticks[0].formattedValue).toBe("src-1:FirstValid");
        expect(xAxes[0].ticks[1].formattedValue).toBe("src-2:SecondValid");
    });

    it("computes contrast-aware textColor and matching bar fillColor for waterfall labels (FWF-C2, FWF-C11)", () => {
        const data = [
            { category: "DarkBar", kind: "change", value: 100 },
            { category: "SmallBar", kind: "change", value: 5 }
        ];

        const registration: ChartWaterfallSeriesRegistration = {
            data: signal(data),
            element: { nativeElement: undefined as any },
            field: signal("value"),
            increaseColor: signal("#000000"), // dark bar
            id: "w-1",
            kindField: signal("kind"),
            name: signal("Waterfall"),
            showLabels: signal(true),
            type: "waterfall",
            visible: signal(true),
            xField: signal("category")
        };

        const scene = WaterfallLayoutEngine.layout(
            registration,
            600,
            400,
            styleResolver
        );

        expect(scene.series[0].labels.length).toBe(2);
        // Both labels expose matching bar color in fillColor
        expect(scene.series[0].labels[0].fillColor).toBe("#000000");
        expect(scene.series[0].labels[1].fillColor).toBe("#000000");

        // If inside bar, textColor should be readable foreground
        if (scene.series[0].labels[0].isInside) {
            expect(scene.series[0].labels[0].textColor).toBe("#ffffff");
        } else {
            expect(scene.series[0].labels[0].textColor).toBeDefined();
        }
    });
});
