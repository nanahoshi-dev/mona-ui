import { describe, expect, it } from "vitest";
import { ChartStyleResolver } from "../style/chart-style-resolver";
import { WaterfallDataProcessor } from "./waterfall-data";

describe("WaterfallDataProcessor", () => {
    const styleResolver = new ChartStyleResolver();
    const style = {
        borderRadius: 4,
        connectorColor: "#94a3b8",
        connectorWidth: 1,
        decreaseColor: "#ef4444",
        fillOpacity: 1,
        increaseColor: "#10b981",
        neutralColor: "#6b7280",
        strokeColor: "",
        strokeWidth: 0,
        subtotalColor: "#3b82f6",
        totalColor: "#1d4ed8"
    };

    it("returns empty result when data is empty", () => {
        const res = WaterfallDataProcessor.process({
            data: [],
            seriesId: "w-1",
            seriesName: "Waterfall",
            style,
            styleResolver
        });

        expect(res.points).toEqual([]);
        expect(res.hasRenderableData).toBe(false);
        expect(res.legendItems).toEqual([]);
    });

    it("evaluates cumulative sequences with change, subtotal, and total correctly", () => {
        const data = [
            { category: "Starting", kind: "change", value: 100 },
            { category: "Sales", kind: "change", value: 50 },
            { category: "Discounts", kind: "change", value: -20 },
            { category: "Mid Total", kind: "subtotal" },
            { category: "Tax", kind: "change", value: -10 },
            { category: "Flat Step", kind: "change", value: 0 },
            { category: "Final Total", kind: "total" }
        ];

        const res = WaterfallDataProcessor.process({
            data,
            seriesId: "w-1",
            seriesName: "Waterfall",
            style,
            styleResolver
        });

        expect(res.points.length).toBe(7);
        expect(res.hasRenderableData).toBe(true);

        const [p0, p1, p2, p3, p4, p5, p6] = res.points;

        // 0: Starting (100) -> 0..100
        expect(p0.barStart).toBe(0);
        expect(p0.barEnd).toBe(100);
        expect(p0.cumulativeBefore).toBe(0);
        expect(p0.cumulativeAfter).toBe(100);
        expect(p0.visualKind).toBe("increase");
        expect(p0.color).toBe(style.increaseColor);

        // 1: Sales (+50) -> 100..150
        expect(p1.barStart).toBe(100);
        expect(p1.barEnd).toBe(150);
        expect(p1.cumulativeBefore).toBe(100);
        expect(p1.cumulativeAfter).toBe(150);
        expect(p1.visualKind).toBe("increase");

        // 2: Discounts (-20) -> 150..130
        expect(p2.barStart).toBe(150);
        expect(p2.barEnd).toBe(130);
        expect(p2.cumulativeBefore).toBe(150);
        expect(p2.cumulativeAfter).toBe(130);
        expect(p2.visualKind).toBe("decrease");
        expect(p2.color).toBe(style.decreaseColor);

        // 3: Mid Total (subtotal) -> 0..130
        expect(p3.barStart).toBe(0);
        expect(p3.barEnd).toBe(130);
        expect(p3.cumulativeBefore).toBe(130);
        expect(p3.cumulativeAfter).toBe(130);
        expect(p3.visualKind).toBe("subtotal");
        expect(p3.color).toBe(style.subtotalColor);

        // 4: Tax (-10) -> 130..120
        expect(p4.barStart).toBe(130);
        expect(p4.barEnd).toBe(120);
        expect(p4.cumulativeBefore).toBe(130);
        expect(p4.cumulativeAfter).toBe(120);
        expect(p4.visualKind).toBe("decrease");

        // 5: Flat step (0) -> 120..120
        expect(p5.barStart).toBe(120);
        expect(p5.barEnd).toBe(120);
        expect(p5.isZeroChange).toBe(true);
        expect(p5.visualKind).toBe("neutral");
        expect(p5.color).toBe(style.neutralColor);

        // 6: Final Total -> 0..120
        expect(p6.barStart).toBe(0);
        expect(p6.barEnd).toBe(120);
        expect(p6.visualKind).toBe("total");
        expect(p6.color).toBe(style.totalColor);

        // Domain
        expect(res.minY).toBe(0);
        expect(res.maxY).toBe(150);

        // Legend items for all 5 used visual kinds
        expect(res.legendItems.length).toBe(5);
        expect(res.legendItems.map(i => i.name)).toEqual(["Increase", "Decrease", "Subtotal", "Total", "No Change"]);
        expect(res.legendItems.every(i => i.kind === "datum" && i.visible === true)).toBe(true);
    });

    it("supports startValue baseline offset", () => {
        const data = [
            { category: "Delta 1", value: 50 },
            { category: "Delta 2", value: -20 }
        ];

        const res = WaterfallDataProcessor.process({
            data,
            seriesId: "w-1",
            seriesName: "Waterfall",
            startValue: 1000,
            style,
            styleResolver
        });

        expect(res.points[0].barStart).toBe(1000);
        expect(res.points[0].barEnd).toBe(1050);
        expect(res.points[1].barStart).toBe(1050);
        expect(res.points[1].barEnd).toBe(1030);
        expect(res.maxY).toBe(1050);
    });
});
