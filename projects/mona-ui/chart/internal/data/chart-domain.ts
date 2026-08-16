import type { ChartXAxisType } from "../../models/chart-axis.models";
import type { ChartField } from "../../models/chart.models";
import type { ChartSeriesRegistration } from "../context/chart-registration-context";
import { resolveData, resolveValue } from "./chart-value-resolver";
import { isFiniteNumber } from "../utils/number-utils";

export interface ContinuousDomain {
    max: number;
    min: number;
}

export interface ResolvedContinuousDomain<T = number> {
    readonly domain: readonly [T, T];
    readonly explicitMax: boolean;
    readonly explicitMin: boolean;
}

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

export function normalizeContinuousNumericDomain(
    observedMin: number,
    observedMax: number,
    explicitMin?: number,
    explicitMax?: number
): ResolvedContinuousDomain<number> {
    const hasExplicitMin = isFiniteNumber(explicitMin);
    const hasExplicitMax = isFiniteNumber(explicitMax);
    let min = hasExplicitMin ? (explicitMin as number) : observedMin;
    let max = hasExplicitMax ? (explicitMax as number) : observedMax;

    if (!Number.isFinite(min) && !Number.isFinite(max)) {
        return {
            domain: [0, 1],
            explicitMax: hasExplicitMax,
            explicitMin: hasExplicitMin
        };
    }

    if (hasExplicitMin && hasExplicitMax) {
        if (min > max) {
            const temp = min;
            min = max;
            max = temp;
        }
    } else if (hasExplicitMin && !hasExplicitMax) {
        if (!Number.isFinite(max)) {
            max = min === 0 ? 1 : (min > 0 ? min * 1.1 : min * 0.9);
        } else if (min > max) {
            max = min === 0 ? 1 : (min > 0 ? min * 1.1 : min * 0.9);
        }
    } else if (!hasExplicitMin && hasExplicitMax) {
        if (!Number.isFinite(min)) {
            min = max === 0 ? -1 : (max > 0 ? max * 0.9 : max * 1.1);
        } else if (min > max) {
            min = max === 0 ? -1 : (max > 0 ? max * 0.9 : max * 1.1);
        }
    }

    if (!Number.isFinite(min)) min = 0;
    if (!Number.isFinite(max)) max = min + 1;

    if (min === max) {
        if (hasExplicitMin && hasExplicitMax) {
            const pad = min === 0 ? 1 : Math.abs(min) * 0.1;
            min = min - pad;
            max = max + pad;
        } else if (min === 0) {
            min = 0;
            max = 1;
        } else if (min > 0) {
            min = Number((min * 0.9).toFixed(8));
            max = Number((max * 1.1).toFixed(8));
        } else {
            min = Number((min * 1.1).toFixed(8));
            max = Number((max * 0.9).toFixed(8));
        }
    }

    return {
        domain: [min, max],
        explicitMax: hasExplicitMax,
        explicitMin: hasExplicitMin
    };
}

export function inferXAxisType(
    seriesList: readonly ChartSeriesRegistration[],
    rootData: readonly unknown[],
    rootXField: ChartField | undefined
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
                if (ISO_DATE_REGEX.test(val)) {
                    const parsed = Date.parse(val);
                    if (!Number.isNaN(parsed)) {
                        return "time";
                    }
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
    rootXField: ChartField | undefined
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
    rootXField: ChartField | undefined,
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

    let parsedMin = explicitMin !== undefined ? (explicitMin instanceof Date ? explicitMin.getTime() : (typeof explicitMin === "number" && Number.isFinite(explicitMin) ? explicitMin : undefined)) : undefined;
    let parsedMax = explicitMax !== undefined ? (explicitMax instanceof Date ? explicitMax.getTime() : (typeof explicitMax === "number" && Number.isFinite(explicitMax) ? explicitMax : undefined)) : undefined;

    const normalized = normalizeContinuousNumericDomain(minTime, maxTime, parsedMin, parsedMax);
    let [finalMin, finalMax] = normalized.domain;

    if (!Number.isFinite(finalMin) || !Number.isFinite(finalMax) || (finalMin === 0 && finalMax === 1 && !normalized.explicitMin && !normalized.explicitMax)) {
        const now = Date.now();
        return [new Date(now - 86400000), new Date(now)];
    }

    if (finalMin === finalMax) {
        return [new Date(finalMin - 3600000), new Date(finalMax + 3600000)];
    }

    return [new Date(finalMin), new Date(finalMax)];
}

export function calculateLinearXDomain(
    seriesList: readonly ChartSeriesRegistration[],
    rootData: readonly unknown[],
    rootXField: ChartField | undefined,
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

    const normalized = normalizeContinuousNumericDomain(min, max, explicitMin, explicitMax);
    return [normalized.domain[0], normalized.domain[1]];
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
        const normalized = normalizeContinuousNumericDomain(0, 1, explicitMin, explicitMax);
        return [normalized.domain[0], normalized.domain[1]];
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

    if (requiresZeroBaseline) {
        if (min > 0) min = 0;
        if (max < 0) max = 0;
    }

    const normalized = normalizeContinuousNumericDomain(min, max, explicitMin, explicitMax);
    let [resMin, resMax] = normalized.domain;

    if (min === max && !normalized.explicitMin && !normalized.explicitMax) {
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

    return [resMin, resMax];
}

export function hasRenderableData(
    seriesList: readonly ChartSeriesRegistration[],
    rootData: readonly unknown[],
    xAxisType?: ChartXAxisType
): boolean {
    if (seriesList.length === 0) {
        return rootData.length > 0;
    }

    for (const s of seriesList) {
        if (s.type === "bar" && (xAxisType === "time" || xAxisType === "utc" || xAxisType === "linear")) {
            // Incompatible bar in Phase 1
            continue;
        }
        const data = resolveData(s.data(), rootData);
        if (data.length === 0) {
            continue;
        }
        const field = s.field();
        for (let i = 0; i < data.length; i++) {
            const val = resolveValue(data[i], field, i);
            if (isFiniteNumber(val)) {
                return true;
            }
        }
    }

    return false;
}


