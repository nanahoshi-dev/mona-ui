import { isDevMode } from "@angular/core";
import type { ChartContinuousPolarSeriesRegistration } from "../context/chart-registration-context";
import type { ChartAxisFormatter } from "../../models/chart-axis.models";
import { canonicalPolarAngle, normalizeDegrees } from "../utils/angle-utils";
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

export function formatContinuousPolarAngle(
    angleDeg: number,
    angularFormatter?: ChartAxisFormatter,
    index: number = 0
): string {
    if (angularFormatter) {
        return angularFormatter(angleDeg, index);
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

        const canonicalPoints = new Map<number, PolarDatumPoint>();

        for (let dataIndex = 0; dataIndex < rawData.length; dataIndex++) {
            const item = rawData[dataIndex];
            const rawAngleVal = resolveValue(item, angleField, dataIndex);
            let rawNumVal = resolveValue(item, valueField, dataIndex);

            if (rawNumVal === undefined && isFiniteNumber(item)) {
                rawNumVal = item;
            }

            const isAngleFinite = isFiniteNumber(rawAngleVal);
            if (!isAngleFinite) {
                continue;
            }

            const isValFinite = isFiniteNumber(rawNumVal);
            const defined = isValFinite;

            const rawAngle = rawAngleVal as number;
            const normalizedAngle = normalizeDegrees(rawAngle);
            const canonicalAngle = canonicalPolarAngle(rawAngle);
            const numVal = isValFinite ? (rawNumVal as number) : 0;

            const newPoint: PolarDatumPoint = {
                dataIndex,
                datum: item,
                defined,
                formattedAngle: "",
                formattedValue: "",
                normalizedAngle,
                rawAngle,
                value: numVal
            };

            const existing = canonicalPoints.get(canonicalAngle);
            if (existing !== undefined) {
                warnOnce(
                    `polar-duplicate-angle:${series.id}:${canonicalAngle}`,
                    `[MonaChart] Duplicate normalized angle ${normalizedAngle}° detected in polar series "${series.name()}".`
                );
                if (!existing.defined && defined) {
                    canonicalPoints.set(canonicalAngle, newPoint);
                }
            } else {
                canonicalPoints.set(canonicalAngle, newPoint);
            }
        }

        // Stable sort ascending by normalizedAngle, then dataIndex (never sort by defined)
        const sortedPoints = Array.from(canonicalPoints.values()).sort((a, b) => {
            if (a.normalizedAngle !== b.normalizedAngle) {
                return a.normalizedAngle - b.normalizedAngle;
            }
            return a.dataIndex - b.dataIndex;
        });

        // Format points after angular sorting
        for (let idx = 0; idx < sortedPoints.length; idx++) {
            const p = sortedPoints[idx];
            if (p.defined) {
                p.formattedAngle = formatContinuousPolarAngle(p.normalizedAngle, angularFormatter, idx);
                p.formattedValue = valueFormatter
                    ? valueFormatter(p.value, p.dataIndex)
                    : formatContinuousPolarValue(p.value);
            }
        }

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
