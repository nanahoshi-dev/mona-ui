import { describe, expect, it } from "vitest";
import type { ChartSeriesStyle } from "../public-api";

describe("ChartSeriesStyle public model", () => {
    it("should be source-compatible with legacy styles omitting lineStyle", () => {
        // Pre-feature shape (omits lineStyle): MUST compile without TypeScript errors
        const legacyCompatibleStyle: ChartSeriesStyle = {
            areaFillColor: "#3b82f6",
            areaFillOpacity: 0.2,
            color: "#3b82f6",
            fillOpacity: 1,
            lineWidth: 2,
            opacity: 1,
            pointRadius: 3
        };

        expect(legacyCompatibleStyle.lineWidth).toBe(2);
        expect(legacyCompatibleStyle.color).toBe("#3b82f6");
        expect(legacyCompatibleStyle.lineStyle).toBeUndefined();
    });

    it("should accept explicit lineStyle when provided", () => {
        const dashedStyle: ChartSeriesStyle = {
            areaFillColor: "#3b82f6",
            areaFillOpacity: 0.2,
            color: "#3b82f6",
            fillOpacity: 1,
            lineStyle: "dashed",
            lineWidth: 2,
            opacity: 1,
            pointRadius: 3
        };

        const dottedStyle: ChartSeriesStyle = {
            ...dashedStyle,
            lineStyle: "dotted"
        };

        expect(dashedStyle.lineStyle).toBe("dashed");
        expect(dottedStyle.lineStyle).toBe("dotted");
    });
});
