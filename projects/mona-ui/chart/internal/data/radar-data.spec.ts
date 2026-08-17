import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type { ChartRadarSeriesRegistration } from "../context/chart-registration-context";
import { formatRadarValue, prepareRadarData } from "./radar-data";

function createRadarSeries(config: {
    categoryField?: string;
    data?: unknown[];
    field?: string;
    id?: string;
    name?: string;
    valueFormatter?: (v: unknown) => string;
    visible?: boolean;
}): ChartRadarSeriesRegistration {
    return {
        categoryField: signal(config.categoryField ?? "category"),
        color: signal(""),
        connectNulls: signal(false),
        curve: signal("linear"),
        data: signal(config.data),
        element: {} as any,
        field: signal(config.field ?? "value"),
        fillMode: signal("none"),
        fillOpacity: signal(undefined),
        id: config.id ?? "series-1",
        name: signal(config.name ?? "Radar"),
        pointRadius: signal(undefined),
        showPoints: signal(true),
        strokeWidth: signal(undefined),
        type: "radar",
        valueFormatter: signal(config.valueFormatter as any),
        visible: signal(config.visible ?? true)
    };
}

describe("RadarData", () => {
    it("should format radar value", () => {
        expect(formatRadarValue(1234.5)).toBe("1,234.5");
        expect(formatRadarValue(NaN)).toBe("0");
    });

    it("should prepare data for single series", () => {
        const rootData = [
            { category: "Speed", value: 80 },
            { category: "Power", value: 90 },
            { category: "Defense", value: 70 }
        ];
        const series = createRadarSeries({});
        const result = prepareRadarData([series], rootData);

        expect(result.hasRenderableData).toBe(true);
        expect(result.categories.length).toBe(3);
        expect(result.categories.map(c => c.formatted)).toEqual(["Speed", "Power", "Defense"]);
        expect(result.seriesList.length).toBe(1);
        expect(result.seriesList[0].points.length).toBe(3);
        expect(result.seriesList[0].points.map(p => p.value)).toEqual([80, 90, 70]);
    });

    it("should build unified category domain in first-seen order across multiple series", () => {
        const seriesA = createRadarSeries({
            data: [
                { category: "Speed", value: 80 },
                { category: "Power", value: 90 }
            ],
            id: "series-a",
            name: "A"
        });
        const seriesB = createRadarSeries({
            data: [
                { category: "Defense", value: 70 },
                { category: "Speed", value: 85 },
                { category: "Stamina", value: 60 }
            ],
            id: "series-b",
            name: "B"
        });

        const result = prepareRadarData([seriesA, seriesB], []);

        expect(result.categories.map(c => c.key)).toEqual(["Speed", "Power", "Defense", "Stamina"]);
        expect(result.seriesList[0].points.map(p => p.defined)).toEqual([true, true, false, false]);
        expect(result.seriesList[1].points.map(p => p.defined)).toEqual([true, false, true, true]);
    });

    it("should handle duplicate categories by keeping the first valid occurrence", () => {
        const data = [
            { category: "A", value: 10 },
            { category: "B", value: 20 },
            { category: "A", value: 30 }
        ];
        const series = createRadarSeries({ data });
        const result = prepareRadarData([series], []);

        expect(result.categories.length).toBe(2);
        expect(result.seriesList[0].definedPoints.length).toBe(2);
        expect(result.seriesList[0].definedPoints[0].value).toBe(10);
    });

    it("should handle non-finite or missing numeric values", () => {
        const data = [
            { category: "A", value: 10 },
            { category: "B", value: NaN },
            { category: "C", value: Infinity },
            { category: "D", value: 20 }
        ];
        const series = createRadarSeries({ data });
        const result = prepareRadarData([series], []);

        expect(result.seriesList[0].points.map(p => p.defined)).toEqual([true, false, false, true]);
        expect(result.seriesList[0].definedPoints.length).toBe(2);
    });

    it("should use custom angular formatter and value formatter", () => {
        const data = [{ category: "alpha", value: 100 }];
        const series = createRadarSeries({
            data,
            valueFormatter: v => `$${v}`
        });
        const angularFormatter = (cat: unknown) => String(cat).toUpperCase();

        const result = prepareRadarData([series], [], angularFormatter);

        expect(result.categories[0].formatted).toBe("ALPHA");
        expect(result.seriesList[0].points[0].formattedCategory).toBe("ALPHA");
        expect(result.seriesList[0].points[0].formattedValue).toBe("$100");
    });
});
