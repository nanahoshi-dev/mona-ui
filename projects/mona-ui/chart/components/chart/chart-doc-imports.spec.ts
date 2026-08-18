import { describe, expect, it } from "vitest";
import * as PublicApi from "../../public-api";

describe("Chart Documentation Imports (FWF-C4)", () => {
    it("ensures all imports in api.md Quick Start exist in chart public-api.ts", () => {
        const quickStartDocumentedImports = [
            "ChartComponent",
            "ChartAngularAxisComponent",
            "ChartRadialAxisComponent",
            "RadarSeriesComponent",
            "PolarSeriesComponent",
            "ChartLegendComponent",
            "ChartTooltipComponent"
        ];

        const exportedKeys = new Set(Object.keys(PublicApi));

        for (const symbol of quickStartDocumentedImports) {
            expect(exportedKeys.has(symbol)).toBe(true);
        }
    });

    it("ensures Funnel and Waterfall series components and directives are exported in public-api.ts", () => {
        const requiredSeriesExports = [
            "FunnelSeriesComponent",
            "WaterfallSeriesComponent",
            "ChartFunnelLabelTemplateDirective",
            "ChartWaterfallLabelTemplateDirective"
        ];

        const exportedKeys = new Set(Object.keys(PublicApi));

        for (const symbol of requiredSeriesExports) {
            expect(exportedKeys.has(symbol)).toBe(true);
        }
    });
});
