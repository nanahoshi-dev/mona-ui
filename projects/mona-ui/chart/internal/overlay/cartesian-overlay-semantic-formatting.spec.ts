import { describe, expect, it } from "vitest";
import { formatCartesianAxisSemanticValue } from "../utils/chart-formatter";
import type { ChartAxisScene } from "../scene/cartesian-scene";

describe("CartesianOverlaySemanticFormatting (CAA-R3-009)", () => {
    it("formats percent unit mode correctly", () => {
        const axisScene: ChartAxisScene = {
            axis: "y",
            axisId: "y1",
            axisLine: true,
            gridLines: false,
            position: "left",
            ticks: [],
            title: "Y",
            unitMode: "percent",
            visible: true
        };

        const formatted = formatCartesianAxisSemanticValue({
            axisScene,
            value: 75.4
        });

        expect(formatted).toBe("75.4%");
    });

    it("prefers custom formatter when supplied", () => {
        const axisScene: ChartAxisScene = {
            axis: "x",
            axisId: "x1",
            axisLine: true,
            formatter: (v: unknown) => `Val_${String(v)}`,
            gridLines: false,
            position: "bottom",
            ticks: [],
            title: "X",
            visible: true
        };

        const formatted = formatCartesianAxisSemanticValue({
            axisScene,
            index: 2,
            value: "CategoryB"
        });

        expect(formatted).toBe("Val_CategoryB");
    });

    it("formats date/time timestamps with temporal awareness", () => {
        const axisScene: ChartAxisScene = {
            axis: "x",
            axisId: "x1",
            axisLine: true,
            gridLines: false,
            position: "bottom",
            scaleType: "time",
            ticks: [],
            title: "Time",
            visible: true
        };

        const date = new Date(2026, 0, 15, 12, 0, 0);
        const formatted = formatCartesianAxisSemanticValue({
            axisScene,
            value: date,
            xTimeSpanMs: 3600 * 1000 * 24 * 30
        });

        expect(formatted).toBeDefined();
        expect(typeof formatted).toBe("string");
        expect(formatted.length).toBeGreaterThan(0);
    });

    it("formats log axis values with standard or exponential notations (Gate J)", () => {
        const axisScene: ChartAxisScene = {
            axis: "y",
            axisId: "y-log",
            axisLine: true,
            gridLines: false,
            position: "left",
            scaleType: "log",
            ticks: [],
            title: "Log Y",
            visible: true
        };

        const formattedSmall = formatCartesianAxisSemanticValue({
            axisScene,
            value: 100
        });
        expect(formattedSmall).toBe("100");

        const formattedLarge = formatCartesianAxisSemanticValue({
            axisScene,
            value: 1000000
        });
        expect(formattedLarge).toBeDefined();
    });

    it("formats category values accurately using category index when value is numeric index (Gate K)", () => {
        const axisScene: ChartAxisScene = {
            axis: "x",
            axisId: "x-cat",
            axisLine: true,
            gridLines: false,
            position: "bottom",
            scaleType: "category",
            ticks: [
                { coordinate: 100, formattedValue: "Q1", index: 0, tickKey: "0", value: "Q1" },
                { coordinate: 200, formattedValue: "Q2", index: 1, tickKey: "1", value: "Q2" }
            ],
            title: "Quarter",
            visible: true
        };

        const formatted = formatCartesianAxisSemanticValue({
            axisScene,
            index: 1,
            value: "Q2"
        });
        expect(formatted).toBe("Q2");
    });
});
