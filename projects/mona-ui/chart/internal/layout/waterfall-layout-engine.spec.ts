import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type { ChartWaterfallSeriesRegistration } from "../context/chart-registration-context";
import { ChartStyleResolver } from "../style/chart-style-resolver";
import { WaterfallLayoutEngine } from "./waterfall-layout-engine";

describe("WaterfallLayoutEngine", () => {
    const styleResolver = new ChartStyleResolver();

    it("computes empty scene with hasRenderableData false", () => {
        const empty = WaterfallLayoutEngine.computeEmptyScene(400, 300);
        expect(empty.hasRenderableData).toBe(false);
        expect(empty.series).toEqual([]);
        expect(empty.hitTargets).toEqual([]);
    });

    it("lays out waterfall bars with semantic endpoints and connectors", () => {
        const data = [
            { category: "A", kind: "change", value: 100 },
            { category: "B", kind: "change", value: -40 },
            { category: "Total", kind: "total" }
        ];

        const registration: ChartWaterfallSeriesRegistration = {
            data: signal(data),
            element: { nativeElement: document.createElement("div") },
            field: signal("value"),
            id: "w-1",
            kindField: signal("kind"),
            name: signal("Waterfall"),
            type: "waterfall",
            visible: signal(true),
            xField: signal("category")
        };

        const scene = WaterfallLayoutEngine.layout(
            registration,
            400,
            300,
            styleResolver
        );

        expect(scene.hasRenderableData).toBe(true);
        expect(scene.series.length).toBe(1);

        const series = scene.series[0];
        expect(series.bars.length).toBe(3);

        const [bar0, bar1, bar2] = series.bars;
        // Bar 0: start 0 -> 100
        expect(bar0.barStart).toBe(0);
        expect(bar0.barEnd).toBe(100);
        expect(bar0.bounds.height).toBeGreaterThan(0);

        // Bar 1: start 100 -> 60 (decrease)
        expect(bar1.barStart).toBe(100);
        expect(bar1.barEnd).toBe(60);
        expect(bar1.fromY).toBe(bar0.toY); // fromY of bar1 matches toY of bar0

        // Bar 2: total 0 -> 60
        expect(bar2.barStart).toBe(0);
        expect(bar2.barEnd).toBe(60);

        // Connectors: between bar 0 and 1, and bar 1 and 2
        expect(series.connectors.length).toBe(2);
        // Connector 0 links from bar0 right edge to bar1 left edge at y = bar0.toY
        expect(series.connectors[0].fromX).toBe(bar0.bounds.x + bar0.bounds.width);
        expect(series.connectors[0].toX).toBe(bar1.bounds.x);
        expect(series.connectors[0].y).toBe(bar0.toY);

        // Legend: Semantic datum items for Increase, Decrease, Total
        expect(scene.legendItems).toHaveLength(3);
        expect(scene.legendItems.map(i => i.name)).toEqual(["Increase", "Decrease", "Total"]);
        expect(scene.legendItems[0].kind).toBe("datum");
        expect(scene.legendItems[0].itemId).toBe("increase");
        expect(scene.legendItems[0].visible).toBe(true);
    });
});
