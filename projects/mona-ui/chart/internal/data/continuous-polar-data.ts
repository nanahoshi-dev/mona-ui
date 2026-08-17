import { isDevMode } from "@angular/core";
import type { ChartContinuousPolarSeriesRegistration } from "../context/chart-registration-context";
import type { ChartAxisFormatter } from "../../models/chart-axis.models";
import { normalizeDegrees } from "../utils/angle-utils";
import { isFiniteNumber } from "../utils/number-utils";
import { resolveData, resolveValue } from "./chart-value-resolver";

const warnedSignatures = new Set<string>();

function warnOnce(signature: string, message: string): void {
    if (isDevMode() && !warnedSignatures.has(signature)) {
        warnedSignatures.add(signature);
        console.warn(message);
    }
}

export interface PolarDatumPoint {
    dataIndex: number;
    datum: unknown;
    defined: boolean;
    formattedAngle: string;
    formattedValue: string;
    normalizedAngle: number;
    rawAngle: number;
    value: number;
}

export interface ContinuousPolarSeriesData {
    allValues: readonly number[];
    definedPoints: readonly PolarDatumPoint[];
    hasRenderableData: boolean;
    points: readonly PolarDatumPoint[];
    series: ChartContinuousPolarSeriesRegistration;
}

export interface ContinuousPolarDataResult {
    allAngles: readonly number[];
    allValues: readonly number[];
    hasRenderableData: boolean;
    seriesList: readonly ContinuousPolarSeriesData[];
}

const DEFAULT_NUMBER_FORMATTER = new Intl.NumberFormat();

export function formatContinuousPolarValue(value: number): string {
    if (!isFiniteNumber(value)) {
        return "0";
    }
    return DEFAULT_NUMBER_FORMATTER.format(value);
}

export function formatContinuousPolarAngle(angleDeg: number, angularFormatter?: ChartAxisFormatter): string {
    if (angularFormatter) {
        return angularFormatter(angleDeg, 0);
    }
    return `${Math.round(angleDeg * 10) / 10}°`;
}

export function prepareContinuousPolarData(
    seriesList: readonly ChartContinuousPolarSeriesRegistration[],
    rootData: readonly unknown[],
    angularFormatter?: ChartAxisFormatter
): ContinuousPolarDataResult {
    const preparedSeriesList: ContinuousPolarSeriesData[] = [];
    const allValuesAcrossAllSeries: number[] = [];
    const allAnglesAcrossAllSeries = new Set<number>();

    for (const series of seriesList) {
        const rawData = resolveData(series.data(), rootData);
        const valueField = series.field();
        const angleField = series.angleField();
        const valueFormatter = series.valueFormatter();
        const isVisible = series.visible();

        const rawPoints: PolarDatumPoint[] = [];
        const seenAngles = new Set<number>();

        for (let dataIndex = 0; dataIndex < rawData.length; dataIndex++) {
            const item = rawData[dataIndex];
            let rawAngleVal = resolveValue(item, angleField, dataIndex);
            let rawNumVal = resolveValue(item, valueField, dataIndex);

            if (rawNumVal === undefined && isFiniteNumber(item)) {
                rawNumVal = item;
            }

            const isAngleFinite = isFiniteNumber(rawAngleVal);
            const isValFinite = isFiniteNumber(rawNumVal);
            const defined = isAngleFinite && isValFinite;

            const rawAngle = isAngleFinite ? (rawAngleVal as number) : 0;
            const normalizedAngle = isAngleFinite ? normalizeDegrees(rawAngle) : 0;
            const numVal = isValFinite ? (rawNumVal as number) : 0;

            if (defined) {
                if (seenAngles.has(normalizedAngle)) {
                    warnOnce(
                        `polar-duplicate-angle:${series.id}:${normalizedAngle}`,
                        `[MonaChart] Duplicate normalized angle ${normalizedAngle}° detected in polar series "${series.name()}".`
                    );
                }
                seenAngles.add(normalizedAngle);
            }

            const formattedAngle = defined
                ? formatContinuousPolarAngle(normalizedAngle, angularFormatter)
                : "";
            const formattedVal = defined
                ? valueFormatter
                    ? valueFormatter(numVal, dataIndex)
                    : formatContinuousPolarValue(numVal)
                : "";

            rawPoints.push({
                dataIndex,
                datum: item,
                defined,
                formattedAngle,
                formattedValue: formattedVal,
                normalizedAngle,
                rawAngle,
                value: numVal
            });
        }

        // Stable sort ascending by normalizedAngle
        const sortedPoints = [...rawPoints].sort((a, b) => {
            if (a.defined && !b.defined) return -1;
            if (!a.defined && b.defined) return 1;
            if (a.normalizedAngle !== b.normalizedAngle) {
                return a.normalizedAngle - b.normalizedAngle;
            }
            return a.dataIndex - b.dataIndex;
        });

        const definedPoints = sortedPoints.filter(p => p.defined);
        const allValues = definedPoints.map(p => p.value);

        if (isVisible) {
            allValuesAcrossAllSeries.push(...allValues);
            for (const p of definedPoints) {
                allAnglesAcrossAllSeries.add(p.normalizedAngle);
            }
        }

        const hasRenderable = isVisible && definedPoints.length >= 1;

        preparedSeriesList.push({
            allValues,
            definedPoints,
            hasRenderableData: hasRenderable,
            points: sortedPoints,
            series
        });
    }

    const overallHasRenderable = preparedSeriesList.some(s => s.hasRenderableData);
    const sortedAllAngles = Array.from(allAnglesAcrossAllSeries).sort((a, b) => a - b);

    return {
        allAngles: sortedAllAngles,
        allValues: allValuesAcrossAllSeries,
        hasRenderableData: overallHasRenderable,
        seriesList: preparedSeriesList
    };
}
