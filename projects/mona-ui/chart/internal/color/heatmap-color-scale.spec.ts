import { describe, expect, it, vi } from "vitest";
import { HeatmapColorScale } from "./heatmap-color-scale";
import type { ChartHeatmapSeriesStyle } from "../../models/chart-heatmap.models";

describe("HeatmapColorScale", () => {
    const defaultStyle: ChartHeatmapSeriesStyle = {
        baseColor: "#3b82f6",
        borderRadius: 0,
        fillOpacity: 1,
        highColor: "#1d4ed8",
        lowColor: "#eff6ff",
        midColor: "#f8fafc",
        strokeColor: "",
        strokeWidth: 0
    };

    it("should map values across sequential scale evenly into 0..255 LUT", () => {
        const scale = new HeatmapColorScale({
            domain: [0, 100],
            mode: "sequential",
            style: defaultStyle
        });

        expect(scale.indexFor(0)).toBe(0);
        expect(scale.indexFor(50)).toBe(128);
        expect(scale.indexFor(100)).toBe(255);

        const color0 = scale.colorFor(0);
        const color100 = scale.colorFor(100);
        expect(color0).toBeDefined();
        expect(color100).toBeDefined();
        expect(color0).not.toBe(color100);
    });

    it("should handle equal min and max by mapping to center of LUT", () => {
        const scale = new HeatmapColorScale({
            domain: [50, 50],
            mode: "sequential",
            style: defaultStyle
        });

        expect(scale.indexFor(50)).toBe(128);
    });

    it("should map diverging values across min, midpoint, and max", () => {
        const scale = new HeatmapColorScale({
            domain: [-10, 10],
            mode: "diverging",
            style: defaultStyle
        });

        expect(scale.indexFor(-10)).toBe(0);
        expect(scale.indexFor(0)).toBe(128);
        expect(scale.indexFor(10)).toBe(255);
    });

    it("should warn and fallback when explicit midpoint is outside domain", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const warnedSet = new Set<string>();

        const scale = new HeatmapColorScale({
            domain: [0, 100],
            explicitMidpoint: 150,
            mode: "diverging",
            style: defaultStyle,
            warnedDiagnosticSignatures: warnedSet
        });

        expect(warnSpy).toHaveBeenCalled();
        expect(scale.descriptor.midpoint).toBe(50);
        warnSpy.mockRestore();
    });

    it("should select high-contrast label color based on background luminance", () => {
        const scale = new HeatmapColorScale({
            colors: ["#ffffff", "#000000"],
            domain: [0, 100],
            mode: "sequential",
            style: defaultStyle
        });

        expect(scale.labelColorFor(0)).toBe("#0f172a"); // Against white background
        expect(scale.labelColorFor(100)).toBe("#ffffff"); // Against black background
    });

    it("should build color scale descriptor with formatted ticks and stops", () => {
        const scale = new HeatmapColorScale({
            domain: [0, 1000],
            mode: "sequential",
            style: defaultStyle,
            title: "Magnitude"
        });

        expect(scale.descriptor.title).toBe("Magnitude");
        expect(scale.descriptor.formattedMin).toBe("0");
        expect(scale.descriptor.formattedMax).toBe("1K");
        expect(scale.descriptor.stops.length).toBeGreaterThan(0);
        expect(scale.descriptor.ticks.length).toBe(2);
    });
});
