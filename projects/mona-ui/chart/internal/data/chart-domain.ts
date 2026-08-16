import type { ChartXAxisType } from "../../models/chart-axis.models";
import type { ChartSeriesRegistration } from "../context/chart-registration-context";
import { resolveData, resolveValue } from "./chart-value-resolver";
import { isFiniteNumber } from "../utils/number-utils";

export interface ContinuousDomain {
    max: number;
    min: number;
}

export function inferXAxisType(
    seriesList: readonly ChartSeriesRegistration[],
    rootData: readonly unknown[],
    rootXField: string | undefined
): ChartXAxisType {
    const visibleSeries = seriesList.filter(s => s.visible());
    if (visibleSeries.length === 0 && rootData.length === 0) {
        return "category";
    }

    const hasBarSeries = visibleSeries.some(s => s.type === "bar");
    if (hasBarSeries) {
        return "category";
    }

    // Inspect representative items
    for (const s of visibleSeries) {
        const data = resolveData(s.data(), rootData);
        const xField = s.xField() ?? rootXField;
        for (let i = 0; i < Math.min(data.length, 10); i++) {
            const val = resolveValue(data[i], xField, i);
            if (val instanceof Date) {
                return "time";
            }
            if (typeof val === "string") {
                const parsed = Date.parse(val);
                if (!Number.isNaN(parsed) && val.includes("-") && (val.length === 10 || val.length >= 19)) {
                    return "time";
                }
                return "category";
            }
            if (isFiniteNumber(val)) {
                return "linear";
            }
        }
    }

    return "category";
}

export function calculateCategoryDomain(
    seriesList: readonly ChartSeriesRegistration[],
    rootData: readonly unknown[],
    rootXField: string | undefined
): readonly string[] {
    const keys = new Set<string>();
    const orderedKeys: string[] = [];

    const visibleSeries = seriesList.filter(s => s.visible());
    const seriesToScan = visibleSeries.length > 0 ? visibleSeries : seriesList;

    for (const s of seriesToScan) {
        const data = resolveData(s.data(), rootData);
        const xField = s.xField() ?? rootXField;
        for (let i = 0; i < data.length; i++) {
            const val = resolveValue(data[i], xField, i);
            const strVal = val !== undefined && val !== null ? String(val) : String(i);
            if (!keys.has(strVal)) {
                keys.add(strVal);
                orderedKeys.push(strVal);
            }
        }
    }

    return orderedKeys;
}

export function calculateTimeDomain(
    seriesList: readonly ChartSeriesRegistration[],
    rootData: readonly unknown[],
    rootXField: string | undefined,
    explicitMin?: Date | number,
    explicitMax?: Date | number
): [Date, Date] {
    let minTime = Number.POSITIVE_INFINITY;
    let maxTime = Number.NEGATIVE_INFINITY;

    const visibleSeries = seriesList.filter(s => s.visible());
    const seriesToScan = visibleSeries.length > 0 ? visibleSeries : seriesList;

    for (const s of seriesToScan) {
        const data = resolveData(s.data(), rootData);
        const xField = s.xField() ?? rootXField;
        for (let i = 0; i < data.length; i++) {
            const val = resolveValue(data[i], xField, i);
            let timeVal: number | undefined;
            if (val instanceof Date) {
                timeVal = val.getTime();
            } else if (typeof val === "number" && Number.isFinite(val)) {
                timeVal = val;
            } else if (typeof val === "string") {
                const parsed = Date.parse(val);
                if (!Number.isNaN(parsed)) {
                    timeVal = parsed;
                }
            }
            if (timeVal !== undefined && Number.isFinite(timeVal)) {
                if (timeVal < minTime) minTime = timeVal;
                if (timeVal > maxTime) maxTime = timeVal;
            }
        }
    }

    if (explicitMin !== undefined) {
        const minVal = explicitMin instanceof Date ? explicitMin.getTime() : explicitMin;
        if (Number.isFinite(minVal)) minTime = minVal;
    }
    if (explicitMax !== undefined) {
        const maxVal = explicitMax instanceof Date ? explicitMax.getTime() : explicitMax;
        if (Number.isFinite(maxVal)) maxTime = maxVal;
    }

    if (!Number.isFinite(minTime) || !Number.isFinite(maxTime)) {
        const now = Date.now();
        return [new Date(now - 86400000), new Date(now)];
    }

    if (minTime === maxTime) {
        return [new Date(minTime - 3600000), new Date(maxTime + 3600000)];
    }

    return [new Date(minTime), new Date(maxTime)];
}

export function calculateLinearXDomain(
    seriesList: readonly ChartSeriesRegistration[],
    rootData: readonly unknown[],
    rootXField: string | undefined,
    explicitMin?: number,
    explicitMax?: number
): [number, number] {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;

    const visibleSeries = seriesList.filter(s => s.visible());
    const seriesToScan = visibleSeries.length > 0 ? visibleSeries : seriesList;

    for (const s of seriesToScan) {
        const data = resolveData(s.data(), rootData);
        const xField = s.xField() ?? rootXField;
        for (let i = 0; i < data.length; i++) {
            const val = resolveValue(data[i], xField, i);
            if (isFiniteNumber(val)) {
                if (val < min) min = val;
                if (val > max) max = val;
            }
        }
    }

    if (explicitMin !== undefined && Number.isFinite(explicitMin)) {
        min = explicitMin;
    }
    if (explicitMax !== undefined && Number.isFinite(explicitMax)) {
        max = explicitMax;
    }

    if (!Number.isFinite(min) || !Number.isFinite(max)) {
        return [0, 1];
    }
    if (min === max) {
        if (min === 0) return [-1, 1];
        const padding = Math.abs(min) * 0.1;
        return [min - padding, max + padding];
    }

    return [min, max];
}

export function calculateContinuousYDomain(
    seriesList: readonly ChartSeriesRegistration[],
    rootData: readonly unknown[],
    explicitMin?: number,
    explicitMax?: number
): [number, number] {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;

    const visibleSeries = seriesList.filter(s => s.visible());
    if (visibleSeries.length === 0) {
        return [explicitMin ?? 0, explicitMax ?? 1];
    }

    const requiresZeroBaseline = visibleSeries.some(s => s.type === "bar" || s.type === "area");
    if (requiresZeroBaseline) {
        min = 0;
        max = 0;
    }

    for (const s of visibleSeries) {
        const data = resolveData(s.data(), rootData);
        const field = s.field();
        for (let i = 0; i < data.length; i++) {
            const val = resolveValue(data[i], field, i);
            if (isFiniteNumber(val)) {
                if (val < min) min = val;
                if (val > max) max = val;
            }
        }
    }

    if (explicitMin !== undefined && Number.isFinite(explicitMin)) {
        min = explicitMin;
    }
    if (explicitMax !== undefined && Number.isFinite(explicitMax)) {
        max = explicitMax;
    }

    if (!Number.isFinite(min) || !Number.isFinite(max)) {
        return [0, 1];
    }

    if (min === max) {
        if (min === 0) {
            return [0, 1];
        }
        if (min > 0) {
            return requiresZeroBaseline
                ? [0, Number((min * 1.1).toFixed(8))]
                : [Number((min * 0.9).toFixed(8)), Number((min * 1.1).toFixed(8))];
        }
        return requiresZeroBaseline
            ? [Number((min * 1.1).toFixed(8)), 0]
            : [Number((min * 1.1).toFixed(8)), Number((min * 0.9).toFixed(8))];
    }

    return [min, max];
}
