import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type { ChartContinuousPolarSeriesRegistration } from "../context/chart-registration-context";
import {
    formatContinuousPolarAngle,
    formatContinuousPolarValue,
    prepareContinuousPolarData
} from "./continuous-polar-data";

function createPolarSeries(config: {
    angleField?: string;
    data?: unknown[];
    field?: string;
    id?: string;
    name?: string;
    valueFormatter?: (v: unknown) => string;
    visible?: boolean;
}): ChartContinuousPolarSeriesRegistration {
    return {
        angleField: signal(config.angleField ?? "angle"),
        color: signal(""),
        connectNulls: signal(false),
        curve: signal("linear"),
        data: signal(config.data),
        element: {} as any,
        field: signal(config.field ?? "value"),
        fillMode: signal("none"),
        fillOpacity: signal(undefined),
        id: config.id ?? "polar-series-1",
        name: signal(config.name ?? "Polar"),
        pointRadius: signal(undefined),
        showPoints: signal(false),
        strokeWidth: signal(undefined),
        type: "polar",
        valueFormatter: signal(config.valueFormatter as any),
        visible: signal(config.visible ?? true)
    };
}

describe("ContinuousPolarData", () => {
    it("should format continuous polar value and angle", () => {
        expect(formatContinuousPolarValue(5432)).toBe("5,432");
        expect(formatContinuousPolarValue(NaN)).toBe("0");
        expect(formatContinuousPolarAngle(45)).toBe("45°");
        expect(formatContinuousPolarAngle(90, a => `${a} deg`)).toBe("90 deg");
    });

    it("should normalize angles and sort points ascending by angle", () => {
        const rawData = [
            { angle: 180, value: 50 },
            { angle: 0, value: 10 },
            { angle: -90, value: 30 }, // normalized to 270
            { angle: 450, value: 20 }  // normalized to 90
        ];
        const series = createPolarSeries({ data: rawData });
        const result = prepareContinuousPolarData([series], []);

        expect(result.hasRenderableData).toBe(true);
        expect(result.seriesList[0].points.map(p => p.normalizedAngle)).toEqual([0, 90, 180, 270]);
        expect(result.seriesList[0].points.map(p => p.value)).toEqual([10, 20, 50, 30]);
    });

    it("should preserve source dataIndex and rawAngle", () => {
        const rawData = [
            { angle: 270, value: 40 },
            { angle: 90, value: 10 }
        ];
        const series = createPolarSeries({ data: rawData });
        const result = prepareContinuousPolarData([series], []);

        expect(result.seriesList[0].points[0].dataIndex).toBe(1); // 90° was index 1
        expect(result.seriesList[0].points[0].rawAngle).toBe(90);
        expect(result.seriesList[0].points[1].dataIndex).toBe(0); // 270° was index 0
        expect(result.seriesList[0].points[1].rawAngle).toBe(270);
    });

    it("should handle missing or invalid angle/value pairs", () => {
        const rawData = [
            { angle: 0, value: 10 },
            { angle: NaN, value: 20 },
            { angle: 90, value: NaN },
            { angle: 180, value: 30 }
        ];
        const series = createPolarSeries({ data: rawData });
        const result = prepareContinuousPolarData([series], []);

        expect(result.seriesList[0].definedPoints.length).toBe(2);
        expect(result.seriesList[0].definedPoints.map(p => p.normalizedAngle)).toEqual([0, 180]);
    });
});
