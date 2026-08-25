import { signal, type ElementRef, type WritableSignal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type { ChartBarSeriesRegistration } from "../context/chart-registration-context";
import { CartesianStackEngine } from "../data/cartesian-stack-engine";
import { CartesianBarSlots } from "./cartesian-bar-slots";

function createMockBarSeries(config: {
    field: string;
    id: string;
    maxBarWidth?: number;
    name?: string;
    stack?: string;
    visible?: boolean;
}): ChartBarSeriesRegistration {
    return {
        color: signal("#3b82f6"),
        data: signal(undefined),
        element: { nativeElement: document.createElement("div") } as ElementRef<HTMLElement>,
        field: signal(config.field),
        id: config.id,
        maxBarWidth: signal(config.maxBarWidth),
        name: signal(config.name ?? config.id),
        stack: signal(config.stack),
        stackMode: signal("normal"),
        type: "bar",
        visible: signal(config.visible ?? true),
        xAxisId: signal(undefined),
        xField: signal(undefined),
        yAxisId: signal(undefined)
    };
}

describe("CartesianBarSlots", () => {
    it("should assign each unstacked bar series its own series slot", () => {
        const series = [createMockBarSeries({ field: "a", id: "s1" }), createMockBarSeries({ field: "b", id: "s2" })];

        const slots = CartesianBarSlots.computeSlots(series);
        expect(slots.length).toBe(2);
        expect(slots[0]).toEqual({
            id: "series:s1",
            kind: "series",
            maxBarWidth: undefined,
            seriesIds: ["s1"]
        });
        expect(slots[1]).toEqual({
            id: "series:s2",
            kind: "series",
            maxBarWidth: undefined,
            seriesIds: ["s2"]
        });
    });

    it("should group stacked bar series into a single slot and preserve first declaration order", () => {
        const series = [
            createMockBarSeries({ field: "online", id: "s1", stack: "sales" }),
            createMockBarSeries({ field: "retail", id: "s2", stack: "sales" }),
            createMockBarSeries({ field: "target", id: "s3" })
        ];

        const stackLayout = CartesianStackEngine.computeLayout({
            rootData: [{ cat: "Jan", online: 10, retail: 20, target: 40 }],
            rootXField: "cat",
            series,
            xAxisType: "category"
        });

        const slots = CartesianBarSlots.computeSlots(series, stackLayout);
        expect(slots.length).toBe(2);
        expect(slots[0]).toEqual({
            id: "bar:default-x:default-y:sales",
            kind: "stack",
            maxBarWidth: undefined,
            seriesIds: ["s1", "s2"],
            stackGroup: "sales"
        });
        expect(slots[1]).toEqual({
            id: "series:s3",
            kind: "series",
            maxBarWidth: undefined,
            seriesIds: ["s3"]
        });
    });

    it("should handle interleaved stack declarations preserving first declaration order", () => {
        const series = [
            createMockBarSeries({ field: "a", id: "s1", stack: "X" }),
            createMockBarSeries({ field: "b", id: "s2", stack: "Y" }),
            createMockBarSeries({ field: "c", id: "s3", stack: "X" }),
            createMockBarSeries({ field: "d", id: "s4", stack: "Y" })
        ];

        const stackLayout = CartesianStackEngine.computeLayout({
            rootData: [{ cat: "Jan", a: 10, b: 20, c: 30, d: 40 }],
            rootXField: "cat",
            series,
            xAxisType: "category"
        });

        const slots = CartesianBarSlots.computeSlots(series, stackLayout);
        expect(slots.length).toBe(2);
        expect(slots[0].id).toBe("bar:default-x:default-y:X");
        expect(slots[0].seriesIds).toEqual(["s1", "s3"]);
        expect(slots[1].id).toBe("bar:default-x:default-y:Y");
        expect(slots[1].seriesIds).toEqual(["s2", "s4"]);
    });

    it("should isolate stack slots when series have different axis bindings with same stack name", () => {
        const s1 = createMockBarSeries({ field: "a", id: "s1", stack: "sales" });
        (s1.yAxisId as WritableSignal<string | undefined>).set("y1");
        const s2 = createMockBarSeries({ field: "b", id: "s2", stack: "sales" });
        (s2.yAxisId as WritableSignal<string | undefined>).set("y2");

        const series = [s1, s2];
        const stackLayout = CartesianStackEngine.computeLayout({
            rootData: [{ cat: "Jan", a: 10, b: 20 }],
            rootXField: "cat",
            series,
            xAxisType: "category"
        });

        const slots = CartesianBarSlots.computeSlots(series, stackLayout);
        expect(slots.length).toBe(2);
        expect(slots[0].id).toBe("bar:default-x:y1:sales");
        expect(slots[1].id).toBe("bar:default-x:y2:sales");
    });

    it("should use the minimum finite maxBarWidth among members of the stack", () => {
        const series = [
            createMockBarSeries({ field: "a", id: "s1", maxBarWidth: 50, stack: "sales" }),
            createMockBarSeries({ field: "b", id: "s2", maxBarWidth: 30, stack: "sales" }),
            createMockBarSeries({ field: "c", id: "s3", maxBarWidth: 40, stack: "sales" })
        ];

        const stackLayout = CartesianStackEngine.computeLayout({
            rootData: [{ cat: "Jan", a: 10, b: 20, c: 30 }],
            rootXField: "cat",
            series,
            xAxisType: "category"
        });

        const slots = CartesianBarSlots.computeSlots(series, stackLayout);
        expect(slots.length).toBe(1);
        expect(slots[0].maxBarWidth).toBe(30);
    });

    it("should omit slots for invalid series and provide bySeriesId lookup", () => {
        const series = [
            createMockBarSeries({ field: "a", id: "s1", stack: "sales" }),
            createMockBarSeries({ field: "b", id: "s2", stack: "sales" }),
            createMockBarSeries({ field: "c", id: "s3" })
        ];

        const invalidIds = new Set(["s1", "s2"]);
        const layout = CartesianBarSlots.computeSlotLayout(series, undefined, invalidIds);

        expect(layout.slots.length).toBe(1);
        expect(layout.slots[0].id).toBe("series:s3");
        expect(layout.bySeriesId.has("s1")).toBe(false);
        expect(layout.bySeriesId.has("s2")).toBe(false);
        expect(layout.bySeriesId.get("s3")?.id).toBe("series:s3");
    });
});
