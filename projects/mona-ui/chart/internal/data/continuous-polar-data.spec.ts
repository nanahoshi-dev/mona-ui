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

    it("should handle missing or invalid angle/value pairs with proper angular gap ordering", () => {
        const rawData = [
            { angle: 0, value: 10 },
            { angle: NaN, value: 20 }, // invalid angle -> excluded completely
            { angle: 90, value: NaN }, // valid angle, invalid value -> gap in order
            { angle: 180, value: 30 }
        ];
        const series = createPolarSeries({ data: rawData });
        const result = prepareContinuousPolarData([series], []);

        expect(result.seriesList[0].points.length).toBe(3);
        expect(result.seriesList[0].points.map(p => p.normalizedAngle)).toEqual([0, 90, 180]);
        expect(result.seriesList[0].points.map(p => p.defined)).toEqual([true, false, true]);
        expect(result.seriesList[0].definedPoints.length).toBe(2);
        expect(result.seriesList[0].definedPoints.map(p => p.normalizedAngle)).toEqual([0, 180]);
    });

    it("should resolve duplicate canonical angles by first valid occurrence", () => {
        const rawData = [
            { angle: 90, value: 10 },
            { angle: 450, value: 20 }, // 450 % 360 = 90 (duplicate)
            { angle: 180, value: 30 }
        ];
        const series = createPolarSeries({ data: rawData });
        const result = prepareContinuousPolarData([series], []);

        expect(result.seriesList[0].points.length).toBe(2);
        expect(result.seriesList[0].points[0].normalizedAngle).toBe(90);
        expect(result.seriesList[0].points[0].value).toBe(10);
        expect(result.seriesList[0].points[1].normalizedAngle).toBe(180);
    });

    it("should pass index parameter to angularFormatter", () => {
        const rawData = [
            { angle: 180, value: 20 },
            { angle: 0, value: 10 }
        ];
        const indices: number[] = [];
        const formatter = (angle: unknown, index?: number) => {
            if (index !== undefined) {
                indices.push(index);
            }
            return `${angle}° (#${index})`;
        };
        const series = createPolarSeries({ data: rawData });
        const result = prepareContinuousPolarData([series], [], formatter);

        expect(result.seriesList[0].points[0].formattedAngle).toBe("0° (#0)");
        expect(result.seriesList[0].points[1].formattedAngle).toBe("180° (#1)");
        expect(indices).toEqual([0, 1]);
    });
});
