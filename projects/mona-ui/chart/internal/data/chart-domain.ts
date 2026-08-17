import type { ChartXAxisType } from "../../models/chart-axis.models";
import type { ChartField } from "../../models/chart.models";
import type {
    ChartCartesianSeriesRegistration,
    ChartSeriesRegistration
} from "../context/chart-registration-context";
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
        } else if (min === max) {
            const delta = Math.abs(min) === 0 ? 1 : Math.abs(min) * 0.1;
            min -= delta;
            max += delta;
        }
    } else if (hasExplicitMin && !hasExplicitMax) {
        if (!Number.isFinite(max)) {
            max = min === 0 ? 1 : (min > 0 ? min * 1.1 : min * 0.9);
        } else if (min >= max) {
            max = min === 0 ? 1 : (min > 0 ? min * 1.1 : min * 0.9);
        }
    } else if (!hasExplicitMin && hasExplicitMax) {
        if (!Number.isFinite(min)) {
            min = max === 0 ? -1 : (max > 0 ? 0 : max * 1.1);
        } else if (min >= max) {
            min = max === 0 ? -1 : (max > 0 ? (max <= 0 ? max * 1.1 : 0) : max * 1.1);
        }
    }

    if (min === max) {
        if (min === 0) {
            return {
                domain: [0, 1],
                explicitMax: hasExplicitMax,
                explicitMin: hasExplicitMin
            };
        }
        const delta = Math.abs(min) * 0.1;
        return {
            domain: [min - delta, max + delta],
            explicitMax: hasExplicitMax,
            explicitMin: hasExplicitMin
        };
    }

    return {
        domain: [min, max],
        explicitMax: hasExplicitMax,
        explicitMin: hasExplicitMin
    };
}

export function inferXAxisType(
    seriesList: readonly ChartCartesianSeriesRegistration[],
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
    seriesList: readonly ChartCartesianSeriesRegistration[],
    rootData: readonly unknown[],
    rootXField: ChartField | undefined
): readonly string[] {
    const keys = new Set<string>();
    const orderedKeys: string[] = [];

    const visibleSeries = seriesList.filter(s => s.visible());
    const seriesToScan = visibleSeries.length > 0 ? visibleSeries : seriesList;

    if (seriesToScan.length === 0) {
        // No series are registered at all (e.g. every series was removed
        // from the chart), so there's no per-series data to scan. Fall back
        // to the root dataset so the X axis still shows its categories
        // instead of collapsing to an empty domain.
        for (let i = 0; i < rootData.length; i++) {
            const val = resolveValue(rootData[i], rootXField, i);
            const strVal = val !== undefined && val !== null ? String(val) : String(i);
            if (!keys.has(strVal)) {
                keys.add(strVal);
                orderedKeys.push(strVal);
            }
        }
        return orderedKeys;
    }

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
    seriesList: readonly ChartCartesianSeriesRegistration[],
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

    let expMinNum = explicitMin instanceof Date ? explicitMin.getTime() : explicitMin;
    let expMaxNum = explicitMax instanceof Date ? explicitMax.getTime() : explicitMax;

    if (isFiniteNumber(expMinNum) && isFiniteNumber(expMaxNum) && expMinNum > expMaxNum) {
        const temp = expMinNum;
        expMinNum = expMaxNum;
        expMaxNum = temp;
    }

    if (!Number.isFinite(minTime) && !Number.isFinite(maxTime)) {
        const defaultMin = isFiniteNumber(expMinNum) ? expMinNum : Date.now() - 86400000;
        const defaultMax = isFiniteNumber(expMaxNum) ? expMaxNum : Date.now();
        return [new Date(defaultMin), new Date(defaultMax)];
    }

    let resMin = isFiniteNumber(expMinNum) ? expMinNum : minTime;
    let resMax = isFiniteNumber(expMaxNum) ? expMaxNum : maxTime;

    if (isFiniteNumber(expMinNum) && !isFiniteNumber(expMaxNum) && expMinNum >= maxTime) {
        resMax = expMinNum + 3600000;
    }
    if (!isFiniteNumber(expMinNum) && isFiniteNumber(expMaxNum) && expMaxNum <= minTime) {
        resMin = expMaxNum - 3600000;
    }

    if (resMin === resMax) {
        return [new Date(resMin - 3600000), new Date(resMax + 3600000)];
    }

    return [new Date(resMin), new Date(resMax)];
}

export function calculateLinearXDomain(
    seriesList: readonly ChartCartesianSeriesRegistration[],
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
    seriesList: readonly ChartCartesianSeriesRegistration[],
    rootData: readonly unknown[],
    explicitMin?: number,
    explicitMax?: number
): [number, number] {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;

    let normalizedExpMin = explicitMin;
    let normalizedExpMax = explicitMax;
    if (isFiniteNumber(normalizedExpMin) && isFiniteNumber(normalizedExpMax)) {
        if (normalizedExpMin > normalizedExpMax) {
            const temp = normalizedExpMin;
            normalizedExpMin = normalizedExpMax;
            normalizedExpMax = temp;
        }
    }

    const visibleSeries = seriesList.filter(s => s.visible());
    const seriesToScan = visibleSeries.length > 0 ? visibleSeries : seriesList;

    // Check if zero baseline is required (Area or Bar series)
    const requiresZeroBaseline = seriesToScan.some(s => s.type === "area" || s.type === "bar");

    for (const s of seriesToScan) {
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

    const hasObservedData = Number.isFinite(min) && Number.isFinite(max);
    const hasExplicitMin = isFiniteNumber(normalizedExpMin);
    const hasExplicitMax = isFiniteNumber(normalizedExpMax);

    if (!hasObservedData) {
        if (!hasExplicitMin && !hasExplicitMax) {
            return [0, 1];
        }
        if (hasExplicitMin && !hasExplicitMax) {
            const expMin = normalizedExpMin as number;
            const expMax = expMin === 0 ? 1 : expMin > 0 ? expMin * 1.1 : 0;
            return [expMin, expMax];
        }
        if (!hasExplicitMin && hasExplicitMax) {
            const expMax = normalizedExpMax as number;
            const expMin = expMax === 0 ? -1 : expMax > 0 ? 0 : expMax * 1.1;
            return [expMin, expMax];
        }
        if (hasExplicitMin && hasExplicitMax) {
            let expMin = normalizedExpMin as number;
            let expMax = normalizedExpMax as number;
            if (expMin === expMax) {
                const delta = Math.abs(expMin) === 0 ? 1 : Math.abs(expMin) * 0.1;
                expMin -= delta;
                expMax += delta;
            }
            return [expMin, expMax];
        }
    }

    if (hasExplicitMin && hasExplicitMax && (normalizedExpMin as number) === (normalizedExpMax as number)) {
        const val = normalizedExpMin as number;
        const delta = Math.abs(val) === 0 ? 1 : Math.abs(val) * 0.1;
        return [val - delta, val + delta];
    }

    let resMin = hasExplicitMin ? (normalizedExpMin as number) : min;
    let resMax = hasExplicitMax ? (normalizedExpMax as number) : max;

    if (hasExplicitMin && !hasExplicitMax && (normalizedExpMin as number) >= max) {
        resMax = (normalizedExpMin as number) === 0 ? 1 : (normalizedExpMin as number) * 1.1;
    }
    if (!hasExplicitMin && hasExplicitMax && (normalizedExpMax as number) <= min) {
        resMin = (normalizedExpMax as number) === 0 ? -1 : (normalizedExpMax as number) < 0 ? (normalizedExpMax as number) * 1.1 : 0;
    }

    if (requiresZeroBaseline) {
        if (!hasExplicitMin && resMin > 0) {
            resMin = 0;
        }
        if (!hasExplicitMax && resMax < 0) {
            resMax = 0;
        }
    }

    if (resMin === resMax) {
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
            if (isFiniteNumber(val) && (s.type === "pie" || s.type === "donut" ? val > 0 : true)) {
                return true;
            }
        }
    }

    return false;
}
