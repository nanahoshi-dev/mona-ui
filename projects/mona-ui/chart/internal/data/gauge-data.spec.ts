import { describe, expect, it } from "vitest";
import { GaugeDataProcessor } from "./gauge-data";

describe("GaugeDataProcessor", () => {
    it("prefers explicit value input over data array", () => {
        const result = GaugeDataProcessor.process({
            explicitValue: 75,
            max: 100,
            min: 0,
            rootData: [{ val: 20 }],
            seriesField: "val",
            seriesId: "gauge-1",
            seriesName: "Speed"
        });

        expect(result.hasValidData).toBe(true);
        expect(result.rawValue).toBe(75);
        expect(result.ratio).toBe(0.75);
        expect(result.isClamped).toBe(false);
    });

    it("extracts first numeric value from data when explicit value is undefined", () => {
        const result = GaugeDataProcessor.process({
            data: [{ val: "invalid" }, { val: 40 }],
            max: 200,
            min: 0,
            rootData: [],
            seriesField: "val",
            seriesId: "gauge-1",
            seriesName: "Speed"
        });

        expect(result.hasValidData).toBe(true);
        expect(result.rawValue).toBe(40);
        expect(result.ratio).toBe(0.2);
    });

    it("clamps out-of-domain values and sets isClamped flag", () => {
        const resultBelow = GaugeDataProcessor.process({
            explicitValue: -20,
            max: 100,
            min: 0,
            rootData: [],
            seriesField: "val",
            seriesId: "gauge-1",
            seriesName: "Speed"
        });

        expect(resultBelow.rawValue).toBe(-20);
        expect(resultBelow.ratio).toBe(0);
        expect(resultBelow.isClamped).toBe(true);

        const resultAbove = GaugeDataProcessor.process({
            explicitValue: 150,
            max: 100,
            min: 0,
            rootData: [],
            seriesField: "val",
            seriesId: "gauge-1",
            seriesName: "Speed"
        });

        expect(resultAbove.rawValue).toBe(150);
        expect(resultAbove.ratio).toBe(1);
        expect(resultAbove.isClamped).toBe(true);
    });
});
