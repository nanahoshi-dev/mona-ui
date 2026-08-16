import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type { ChartSeriesRegistration } from "../context/chart-registration-context";
import { ChartStyleResolver } from "../style/chart-style-resolver";
import { CartesianLayoutEngine } from "./cartesian-layout-engine";

function createMockSeries(
    type: "area" | "bar" | "line",
    field: string,
    id: string = "s1",
    visible: boolean = true
): ChartSeriesRegistration {
    return {
        color: signal("#3f6be2"),
        data: signal(undefined),
        element: { nativeElement: {} as HTMLElement },
        field: signal(field),
        id,
        name: signal("Series 1"),
        type,
        visible: signal(visible),
        xField: signal(undefined)
    };
}

describe("CartesianLayoutEngine", () => {
    const styleResolver = new ChartStyleResolver();

    it("should compute valid plotRect and series scene", () => {
        const series = [createMockSeries("line", "val")];
        const data = [{ val: 10, x: "A" }, { val: 20, x: "B" }];

        const scene = CartesianLayoutEngine.computeScene({
            containerHeight: 300,
            containerWidth: 500,
            rootData: data,
            rootXField: "x",
            series,
            styleResolver
        });

        expect(scene.plotRect.width).toBeGreaterThan(300);
        expect(scene.plotRect.height).toBeGreaterThan(200);
        expect(scene.series.length).toBe(1);
        expect(scene.series[0].type).toBe("line");
    });

    it("should compute grouped bar layout for multiple bar series", () => {
        const s1 = createMockSeries("bar", "v1", "bar-1");
        const s2 = createMockSeries("bar", "v2", "bar-2");
        const data = [{ v1: 10, v2: 20, x: "Jan" }];

        const scene = CartesianLayoutEngine.computeScene({
            containerHeight: 300,
            containerWidth: 500,
            rootData: data,
            rootXField: "x",
            series: [s1, s2],
            styleResolver
        });

        expect(scene.series.length).toBe(2);
        const barScene1 = scene.series[0];
        const barScene2 = scene.series[1];
        if (barScene1.type === "bar" && barScene2.type === "bar") {
            expect(barScene1.bars[0].x).not.toBe(barScene2.bars[0].x);
            expect(barScene1.bars[0].width).toBe(barScene2.bars[0].width);
        }
    });

    it("should return empty series when dimensions are zero", () => {
        const series = [createMockSeries("line", "val")];
        const scene = CartesianLayoutEngine.computeScene({
            containerHeight: 0,
            containerWidth: 0,
            rootData: [{ val: 10 }],
            series,
            styleResolver
        });

        expect(scene.plotRect.width).toBe(0);
        expect(scene.series.length).toBe(0);
    });
});
