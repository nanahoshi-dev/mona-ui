import { describe, expect, it } from "vitest";
import type { ChartAxisScene } from "../../scene/cartesian-scene";
import { buildHeatmapTickSegments } from "./heatmap-tick-segments";

describe("buildHeatmapTickSegments", () => {
    const plotRect = { height: 100, width: 200, x: 40, y: 10 };

    function axis(overrides: Partial<ChartAxisScene>): ChartAxisScene {
        return {
            axis: "x",
            axisLine: true,
            gridLines: true,
            position: "bottom",
            tickMarks: true,
            ticks: [
                { coordinate: 60, formattedValue: "A", index: 0, value: "A" },
                { coordinate: 120, formattedValue: "B", index: 1, value: "B" }
            ],
            title: "",
            visible: true,
            ...overrides
        };
    }

    it("runs X ticks down from the bottom edge and up from the top edge", () => {
        expect(buildHeatmapTickSegments([axis({ tickSize: 4 })], plotRect)).toEqual([
            { x1: 60, x2: 60, y1: 110, y2: 114 },
            { x1: 120, x2: 120, y1: 110, y2: 114 }
        ]);
        expect(buildHeatmapTickSegments([axis({ position: "top" })], plotRect)[0]).toEqual({
            x1: 60,
            x2: 60,
            y1: 10,
            y2: 4
        });
    });

    it("runs Y ticks out from the left or right edge", () => {
        expect(buildHeatmapTickSegments([axis({ axis: "y", position: "left" })], plotRect)[0]).toEqual({
            x1: 40,
            x2: 34,
            y1: 60,
            y2: 60
        });
        expect(buildHeatmapTickSegments([axis({ axis: "y", position: "right" })], plotRect)[0]).toEqual({
            x1: 240,
            x2: 246,
            y1: 60,
            y2: 60
        });
    });

    it("draws nothing for an axis without tick marks or a hidden axis", () => {
        expect(buildHeatmapTickSegments([axis({ tickMarks: false }), axis({ visible: false })], plotRect)).toEqual([]);
    });
});
