import { describe, expect, it } from "vitest";
import { ChartStyleResolver } from "../style/chart-style-resolver";
import { FunnelDataProcessor } from "./funnel-data";

describe("FunnelDataProcessor", () => {
    const styleResolver = new ChartStyleResolver();

    it("returns empty result when data is empty", () => {
        const res = FunnelDataProcessor.process({
            data: [],
            isDatumVisible: () => true,
            seriesId: "f-1",
            seriesName: "Funnel",
            styleResolver
        });

        expect(res.allStages).toEqual([]);
        expect(res.visibleStages).toEqual([]);
        expect(res.hasPositiveStage).toBe(false);
        expect(res.maxValue).toBe(0);
        expect(res.legendItems).toEqual([]);
    });

    it("processes stages and calculates conversion rates, dropOffs, and overall conversion", () => {
        const data = [
            { stage: "Impressions", value: 1000 },
            { stage: "Clicks", value: 400 },
            { stage: "Signups", value: 100 },
            { stage: "Purchases", value: 25 }
        ];

        const res = FunnelDataProcessor.process({
            categoryField: "stage",
            data,
            isDatumVisible: () => true,
            seriesId: "f-1",
            seriesName: "Funnel",
            styleResolver
        });

        expect(res.allStages.length).toBe(4);
        expect(res.visibleStages.length).toBe(4);
        expect(res.maxValue).toBe(1000);
        expect(res.hasPositiveStage).toBe(true);

        const [s0, s1, s2, s3] = res.visibleStages;

        // First stage
        expect(s0.value).toBe(1000);
        expect(s0.conversionRate).toBeUndefined();
        expect(s0.overallConversionRate).toBe(1);
        expect(s0.formattedOverallConversionRate).toBe("100%");
        expect(s0.dropOff).toBeUndefined();

        // Second stage (400 / 1000 = 40%)
        expect(s1.value).toBe(400);
        expect(s1.conversionRate).toBe(0.4);
        expect(s1.formattedConversionRate).toBe("40%");
        expect(s1.overallConversionRate).toBe(0.4);
        expect(s1.dropOff).toBe(600);

        // Third stage (100 / 400 = 25%, overall 100 / 1000 = 10%)
        expect(s2.value).toBe(100);
        expect(s2.conversionRate).toBe(0.25);
        expect(s2.formattedConversionRate).toBe("25%");
        expect(s2.overallConversionRate).toBe(0.1);
        expect(s2.formattedOverallConversionRate).toBe("10%");
        expect(s2.dropOff).toBe(300);

        // Fourth stage (25 / 100 = 25%, overall 25 / 1000 = 2.5%)
        expect(s3.value).toBe(25);
        expect(s3.conversionRate).toBe(0.25);
        expect(s3.overallConversionRate).toBe(0.025);
        expect(s3.formattedOverallConversionRate).toBe("2.5%");
        expect(s3.dropOff).toBe(75);
    });

    it("omits negative values with bounded diagnostic warning", () => {
        const warned = new Set<string>();
        const data = [
            { stage: "A", value: 100 },
            { stage: "B", value: -50 },
            { stage: "C", value: 50 }
        ];

        const res = FunnelDataProcessor.process({
            categoryField: "stage",
            data,
            isDatumVisible: () => true,
            seriesId: "f-1",
            seriesName: "Funnel",
            styleResolver,
            warnedDiagnosticSignatures: warned
        });

        expect(res.allStages.length).toBe(2);
        expect(res.allStages.map(s => s.category)).toEqual(["A", "C"]);
        expect(warned.has("f-1:negative-values")).toBe(true);
    });

    it("uses keyField and falls back to index on collision", () => {
        const warned = new Set<string>();
        const data = [
            { id: "stage-1", name: "A", val: 100 },
            { id: "stage-1", name: "B", val: 80 },
            { id: "stage-3", name: "C", val: 60 }
        ];

        const res = FunnelDataProcessor.process({
            categoryField: "name",
            data,
            field: "val",
            isDatumVisible: () => true,
            keyField: "id",
            seriesId: "f-1",
            seriesName: "Funnel",
            styleResolver,
            warnedDiagnosticSignatures: warned
        });

        expect(res.allStages[0].stageId).toBe("k:s:stage-1");
        expect(res.allStages[1].stageId).toBe("i:1");
        expect(res.allStages[2].stageId).toBe("k:s:stage-3");
        expect(warned.has("f-1:duplicate-keys")).toBe(true);
    });

    it("recalculates conversion rates relative to remaining visible stages when a stage is hidden", () => {
        const data = [
            { stage: "A", value: 100 },
            { stage: "B", value: 80 },
            { stage: "C", value: 40 }
        ];

        const res = FunnelDataProcessor.process({
            categoryField: "stage",
            data,
            isDatumVisible: (id: string) => id !== "i:1", // Hide stage B
            seriesId: "f-1",
            seriesName: "Funnel",
            styleResolver
        });

        expect(res.visibleStages.length).toBe(2);
        const [a, c] = res.visibleStages;
        expect(a.category).toBe("A");
        expect(c.category).toBe("C");
        // C's conversion is now 40 / 100 = 40% (since B was hidden)
        expect(c.conversionRate).toBe(0.4);
        expect(c.dropOff).toBe(60);
    });

    it("preserves stage color assignments using sourceIndex so visibility changes do not shift palette colors", () => {
        const data = [
            { stage: "A", value: 100 },
            { stage: "B", value: 80 },
            { stage: "C", value: 60 }
        ];

        const resFull = FunnelDataProcessor.process({
            categoryField: "stage",
            colors: ["#111111", "#222222", "#333333"],
            data,
            isDatumVisible: () => true,
            seriesId: "f-1",
            seriesName: "Funnel",
            styleResolver
        });

        const resHidden = FunnelDataProcessor.process({
            categoryField: "stage",
            colors: ["#111111", "#222222", "#333333"],
            data,
            isDatumVisible: (id: string) => id !== "i:0", // Hide A
            seriesId: "f-1",
            seriesName: "Funnel",
            styleResolver
        });

        // Stage C was color #333333 in full, should remain #333333 when A is hidden
        expect(resFull.allStages[2].color).toBe("#333333");
        expect(resHidden.visibleStages[1].color).toBe("#333333");
    });
});
