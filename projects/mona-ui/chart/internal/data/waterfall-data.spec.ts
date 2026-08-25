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
        expect(res.minY).toBe(0);
        expect(res.maxY).toBe(0);
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
            styleResolver,
            xField: "category"
        });

        expect(res.points.length).toBe(7);
        expect(res.hasRenderableData).toBe(true);

        const [p0, p1, p2, p3, p4, p5, p6] = res.points;

        // 0: Starting (100) -> 0..100
        expect(p0.barStart).toBe(0);
        expect(p0.barEnd).toBe(100);
        expect(p0.cumulativeBefore).toBe(0);
        expect(p0.cumulativeAfter).toBe(100);
        expect(p0.value).toBe(100);
        expect(p0.formattedValue).toBe("+100");
        expect(p0.visualKind).toBe("increase");
        expect(p0.color).toBe(style.increaseColor);

        // 1: Sales (+50) -> 100..150
        expect(p1.barStart).toBe(100);
        expect(p1.barEnd).toBe(150);
        expect(p1.cumulativeBefore).toBe(100);
        expect(p1.cumulativeAfter).toBe(150);
        expect(p1.value).toBe(50);
        expect(p1.formattedValue).toBe("+50");
        expect(p1.visualKind).toBe("increase");

        // 2: Discounts (-20) -> 150..130
        expect(p2.barStart).toBe(150);
        expect(p2.barEnd).toBe(130);
        expect(p2.cumulativeBefore).toBe(150);
        expect(p2.cumulativeAfter).toBe(130);
        expect(p2.value).toBe(-20);
        expect(p2.formattedValue).toBe("-20");
        expect(p2.visualKind).toBe("decrease");
        expect(p2.color).toBe(style.decreaseColor);

        // 3: Mid Total (subtotal) -> 0..130
        expect(p3.barStart).toBe(0);
        expect(p3.barEnd).toBe(130);
        expect(p3.cumulativeBefore).toBe(130);
        expect(p3.cumulativeAfter).toBe(130);
        expect(p3.value).toBe(130);
        expect(p3.formattedValue).toBe("130");
        expect(p3.visualKind).toBe("subtotal");
        expect(p3.color).toBe(style.subtotalColor);

        // 4: Tax (-10) -> 130..120
        expect(p4.barStart).toBe(130);
        expect(p4.barEnd).toBe(120);
        expect(p4.cumulativeBefore).toBe(130);
        expect(p4.cumulativeAfter).toBe(120);
        expect(p4.value).toBe(-10);
        expect(p4.formattedValue).toBe("-10");
        expect(p4.visualKind).toBe("decrease");

        // 5: Flat step (0) -> 120..120
        expect(p5.barStart).toBe(120);
        expect(p5.barEnd).toBe(120);
        expect(p5.isZeroChange).toBe(true);
        expect(p5.value).toBe(0);
        expect(p5.formattedValue).toBe("+0");
        expect(p5.visualKind).toBe("neutral");
        expect(p5.color).toBe(style.neutralColor);

        // 6: Final Total -> 0..120
        expect(p6.barStart).toBe(0);
        expect(p6.barEnd).toBe(120);
        expect(p6.value).toBe(120);
        expect(p6.formattedValue).toBe("120");
        expect(p6.visualKind).toBe("total");
        expect(p6.color).toBe(style.totalColor);

        // Domain includes 0 because subtotal and total anchor to 0
        expect(res.minY).toBe(0);
        expect(res.maxY).toBe(150);

        // Legend items for all 5 used visual kinds, semantic presentation
        expect(res.legendItems.length).toBe(5);
        expect(res.legendItems.map(i => i.name)).toEqual(["Increase", "Decrease", "No Change", "Subtotal", "Total"]);
        expect(res.legendItems.every(i => i.kind === "semantic" && i.interactive === false && i.visible === true)).toBe(
            true
        );
    });

    it("supports startValue baseline offset and does NOT force zero if no subtotal/total is present", () => {
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
            styleResolver,
            xField: "category"
        });

        expect(res.points[0].barStart).toBe(1000);
        expect(res.points[0].barEnd).toBe(1050);
        expect(res.points[1].barStart).toBe(1050);
        expect(res.points[1].barEnd).toBe(1030);
        expect(res.minY).toBe(1000);
        expect(res.maxY).toBe(1050);
    });

    it("forces zero in domain when total or subtotal is present with nonzero startValue", () => {
        const data = [
            { category: "Delta 1", value: 50 },
            { category: "Total", kind: "total" }
        ];

        const res = WaterfallDataProcessor.process({
            data,
            seriesId: "w-1",
            seriesName: "Waterfall",
            startValue: 1000,
            style,
            styleResolver,
            xField: "category"
        });

        expect(res.minY).toBe(0);
        expect(res.maxY).toBe(1050);
    });

    it("omits invalid change values (undefined, null, NaN, Infinity, numeric string) without creating zero change", () => {
        const data = [
            { category: "Valid 1", value: 100 },
            { category: "Invalid Undefined", value: undefined },
            { category: "Invalid Null", value: null },
            { category: "Invalid NaN", value: NaN },
            { category: "Invalid Infinity", value: Infinity },
            { category: "Invalid String", value: "50" },
            { category: "Valid 2", value: -20 }
        ];

        const res = WaterfallDataProcessor.process({
            data,
            seriesId: "w-1",
            seriesName: "Waterfall",
            style,
            styleResolver,
            xField: "category"
        });

        // Only Valid 1 and Valid 2 should remain
        expect(res.points.length).toBe(2);
        expect(res.points[0].category).toBe("Valid 1");
        expect(res.points[0].barEnd).toBe(100);
        expect(res.points[1].category).toBe("Valid 2");
        expect(res.points[1].barStart).toBe(100);
        expect(res.points[1].barEnd).toBe(80);
    });

    it("subtotal and total rows do not require a numeric value field", () => {
        const data = [
            { category: "Step 1", value: 50 },
            { category: "Subtotal", kind: "subtotal" },
            { category: "Total", kind: "total" }
        ];

        const res = WaterfallDataProcessor.process({
            data,
            seriesId: "w-1",
            seriesName: "Waterfall",
            style,
            styleResolver,
            xField: "category"
        });

        expect(res.points.length).toBe(3);
        expect(res.points[1].value).toBe(50);
        expect(res.points[2].value).toBe(50);
    });

    it("normalizes non-finite startValue to 0 with warning", () => {
        const warned = new Set<string>();
        const res = WaterfallDataProcessor.process({
            data: [{ category: "A", value: 30 }],
            seriesId: "w-1",
            seriesName: "Waterfall",
            startValue: NaN,
            style,
            styleResolver,
            warnedDiagnosticSignatures: warned,
            xField: "category"
        });

        expect(res.points[0].barStart).toBe(0);
        expect(res.points[0].barEnd).toBe(30);
        expect(warned.has("w-1:invalid-startValue")).toBe(true);
    });

    it("supports duplicate categories by assigning unique slotKeys", () => {
        const data = [
            { category: "Revenue", value: 100 },
            { category: "Cost", value: -40 },
            { category: "Revenue", value: 60 }
        ];

        const res = WaterfallDataProcessor.process({
            data,
            seriesId: "w-1",
            seriesName: "Waterfall",
            style,
            styleResolver,
            xField: "category"
        });

        expect(res.points.length).toBe(3);
        expect(res.points[0].category).toBe("Revenue");
        expect(res.points[2].category).toBe("Revenue");
        expect(res.points[0].slotKey).not.toBe(res.points[2].slotKey);
    });

    it("supports custom keyField and distinguishes typed keys", () => {
        const data = [
            { id: 1, name: "Step 1", value: 10 },
            { id: "1", name: "Step 2", value: 20 }
        ];

        const res = WaterfallDataProcessor.process({
            data,
            keyField: "id",
            seriesId: "w-1",
            seriesName: "Waterfall",
            style,
            styleResolver
        });

        expect(res.points.length).toBe(2);
        expect(res.points[0].itemId).toBe("k:n:1");
        expect(res.points[1].itemId).toBe("k:s:1");
        expect(res.points[0].animationKey).not.toBe(res.points[1].animationKey);
    });

    it("falls back to index identity on duplicate explicit keys with warning", () => {
        const warned = new Set<string>();
        const data = [
            { id: "dup", value: 10 },
            { id: "dup", value: 20 }
        ];

        const res = WaterfallDataProcessor.process({
            data,
            keyField: "id",
            seriesId: "w-1",
            seriesName: "Waterfall",
            style,
            styleResolver,
            warnedDiagnosticSignatures: warned
        });

        expect(res.points.length).toBe(2);
        expect(res.points[0].itemId).toBe("k:s:dup");
        expect(res.points[1].itemId).toBe("i:1");
        expect(warned.has("w-1:duplicate-keys")).toBe(true);
    });

    it("bounds unknown kind warnings per series", () => {
        const warned = new Set<string>();
        const data = Array.from({ length: 100 }, (_, i) => ({
            category: `Step ${i}`,
            kind: `badKind_${i}`,
            value: 10
        }));

        const res = WaterfallDataProcessor.process({
            data,
            kindField: "kind",
            seriesId: "w-1",
            seriesName: "Waterfall",
            style,
            styleResolver,
            warnedDiagnosticSignatures: warned,
            xField: "category"
        });

        expect(res.points.length).toBe(100);
        expect(res.points.every(p => p.kind === "change")).toBe(true);
        expect(warned.has("w-1:unknown-kind")).toBe(true);
        expect(warned.size).toBe(1);
    });

    it("falls back to Step N when no xField or rootXField is provided", () => {
        const data = [{ value: 10 }, { value: 20 }];

        const res = WaterfallDataProcessor.process({
            data,
            seriesId: "w-1",
            seriesName: "Waterfall",
            style,
            styleResolver
        });

        expect(res.points.length).toBe(2);
        expect(res.points[0].category).toBeUndefined();
        expect(res.points[0].formattedCategory).toBe("Step 1");
        expect(res.points[1].category).toBeUndefined();
        expect(res.points[1].formattedCategory).toBe("Step 2");
    });

    it("applies valueFormatter with source dataIndex", () => {
        const data = [{ value: 100 }, { value: "invalid" }, { value: 50 }];

        const seenIndices: number[] = [];
        const res = WaterfallDataProcessor.process({
            data,
            seriesId: "w-1",
            seriesName: "Waterfall",
            style,
            styleResolver,
            valueFormatter: (val, idx) => {
                seenIndices.push(idx);
                return `$${val}`;
            }
        });

        expect(res.points.length).toBe(2);
        // Source dataIndex for row 0 is 0, and row 2 is 2 (invalid row 1 was skipped)
        expect(seenIndices).toContain(0);
        expect(seenIndices).toContain(2);
        expect(res.points[0].formattedValue).toBe("$100");
        expect(res.points[1].formattedValue).toBe("$50");
    });
});
