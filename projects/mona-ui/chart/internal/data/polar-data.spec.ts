import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type { ChartPieSeriesRegistration } from "../context/chart-registration-context";
import { ChartStyleResolver } from "../style/chart-style-resolver";
import { preparePolarData } from "./polar-data";

describe("polar-data", () => {
    const styleResolver = new ChartStyleResolver();

    function createMockPieSeries(overrides: Partial<ChartPieSeriesRegistration> = {}): ChartPieSeriesRegistration {
        const hiddenSet = new Set<number>();
        return {
            categoryField: signal("browser"),
            categoryFormatter: signal(undefined),
            colorField: signal(undefined),
            colors: signal(undefined),
            cornerRadius: signal(undefined),
            data: signal(undefined),
            element: { nativeElement: {} as HTMLElement },
            endAngle: signal(360),
            field: signal("share"),
            fillOpacity: signal(undefined),
            id: "series-pie-1",
            isSliceVisible: (idx: number) => !hiddenSet.has(idx),
            labelContent: signal("percentage"),
            labelPosition: signal("outside"),
            minLabelAngle: signal(12),
            name: signal("Browser Share"),
            outerRadiusRatio: signal(0.9),
            padAngle: signal(0),
            showLabels: signal(false),
            sliceLabelTemplate: signal(undefined),
            startAngle: signal(0),
            strokeColor: signal(""),
            strokeWidth: signal(undefined),
            toggleSliceVisibility: (idx: number) => {
                if (hiddenSet.has(idx)) {
                    hiddenSet.delete(idx);
                    return true;
                }
                hiddenSet.add(idx);
                return false;
            },
            type: "pie",
            valueFormatter: signal(undefined),
            visibilityRevision: signal(0),
            visible: signal(true),
            ...overrides
        };
    }

    it("should resolve root data and compute totals", () => {
        const series = createMockPieSeries();
        const rootData = [
            { browser: "Chrome", share: 65 },
            { browser: "Safari", share: 20 },
            { browser: "Firefox", share: 15 }
        ];

        const result = preparePolarData(series, rootData, styleResolver);

        expect(result.hasRenderableData).toBe(true);
        expect(result.allData.length).toBe(3);
        expect(result.visibleData.length).toBe(3);
        expect(result.total).toBe(100);
        expect(result.visibleTotal).toBe(100);
        expect(result.allData[0].formattedCategory).toBe("Chrome");
        expect(result.allData[0].value).toBe(65);
        expect(result.allData[0].paletteIndex).toBe(0);
    });

    it("should filter out zero, negative, NaN, and invalid values", () => {
        const series = createMockPieSeries();
        const rootData = [
            { browser: "Valid", share: 50 },
            { browser: "Zero", share: 0 },
            { browser: "Negative", share: -10 },
            { browser: "NaN", share: Number.NaN },
            { browser: "String", share: "invalid" },
            { browser: "Null", share: null },
            { browser: "Valid2", share: 30 }
        ];

        const result = preparePolarData(series, rootData, styleResolver);

        expect(result.allData.length).toBe(2);
        expect(result.allData[0].formattedCategory).toBe("Valid");
        expect(result.allData[1].formattedCategory).toBe("Valid2");
        expect(result.total).toBe(80);
    });

    it("should assign stable palette indices even when slices are hidden", () => {
        const hiddenIndices = new Set([1]); // Safari is hidden
        const series = createMockPieSeries({
            isSliceVisible: (idx: number) => !hiddenIndices.has(idx)
        });
        const rootData = [
            { browser: "Chrome", share: 60 },
            { browser: "Safari", share: 25 },
            { browser: "Firefox", share: 15 }
        ];

        const result = preparePolarData(series, rootData, styleResolver);

        expect(result.allData.length).toBe(3);
        expect(result.allData[0].paletteIndex).toBe(0);
        expect(result.allData[1].paletteIndex).toBe(1);
        expect(result.allData[2].paletteIndex).toBe(2);

        expect(result.visibleData.length).toBe(2);
        expect(result.visibleData[0].formattedCategory).toBe("Chrome");
        expect(result.visibleData[1].formattedCategory).toBe("Firefox");
        expect(result.visibleTotal).toBe(75);
    });

    it("should respect custom formatters and accessors", () => {
        const series = createMockPieSeries({
            categoryField: signal((d: any) => d.name.toUpperCase()),
            categoryFormatter: signal((c: any) => `Browser: ${c}`),
            field: signal((d: any) => d.val * 2),
            valueFormatter: signal((v: any) => `$${v}`)
        });
        const rootData = [{ name: "Chrome", val: 10 }];

        const result = preparePolarData(series, rootData, styleResolver);

        expect(result.allData[0].formattedCategory).toBe("Browser: CHROME");
        expect(result.allData[0].value).toBe(20);
        expect(result.allData[0].formattedValue).toBe("$20");
    });
});
