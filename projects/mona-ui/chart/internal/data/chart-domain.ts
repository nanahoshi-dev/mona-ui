import type { ChartXAxisType } from "../../models/chart-axis.models";
import type { ChartField } from "../../models/chart.models";
import type {
    ChartCartesianSeriesRegistration,
    ChartFinancialSeriesRegistration,
    ChartSeriesRegistration
} from "../context/chart-registration-context";
import type { ResolvedChartCartesianAxisType } from "../scale/chart-scale";
import { resolveData, resolveValue } from "./chart-value-resolver";
import { resolveFiniteRangeValues } from "./chart-range-resolver";
import { FinancialDataResolver } from "./financial-data-resolver";
import { isFiniteNumber } from "../utils/number-utils";
import type { CartesianStackAnalysis, CartesianStackLayout } from "./cartesian-stack-engine";
import {
    normalizeCartesianTemporalDomain,
    resolveCartesianTemporalValue
} from "./cartesian-temporal-value-resolver";

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

export function isCartesianSeriesCompatibleWithXAxisType(
    seriesType: string,
    xAxisType: ChartXAxisType | ResolvedChartCartesianAxisType
): boolean {
    if (xAxisType === "category") {
        return (
            seriesType === "bar" ||
            seriesType === "line" ||
            seriesType === "area" ||
            seriesType === "candlestick" ||
            seriesType === "ohlc" ||
            seriesType === "rangeBar" ||
            seriesType === "rangeArea"
        );
    }
    return (
        seriesType === "line" ||
        seriesType === "area" ||
        seriesType === "candlestick" ||
        seriesType === "ohlc" ||
        seriesType === "scatter" ||
        seriesType === "bubble" ||
        seriesType === "rangeArea"
    );
}

export function isContinuousXValid(val: unknown, xAxisType: ChartXAxisType | ResolvedChartCartesianAxisType): boolean {
    if (
        xAxisType === "linear" ||
        xAxisType === "log" ||
        xAxisType === "symlog" ||
        xAxisType === "pow" ||
        xAxisType === "sqrt"
    ) {
        return isFiniteNumber(val);
    }
    if (xAxisType === "time" || xAxisType === "utc") {
        return resolveCartesianTemporalValue(val) !== null;
    }
    return false;
}

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
            max = min === 0 ? 1 : min > 0 ? min * 1.1 : min * 0.9;
        } else if (min >= max) {
            max = min === 0 ? 1 : min > 0 ? min * 1.1 : min * 0.9;
        }
    } else if (!hasExplicitMin && hasExplicitMax) {
        if (!Number.isFinite(min)) {
            min = max === 0 ? -1 : max > 0 ? 0 : max * 1.1;
        } else if (min >= max) {
            min = max === 0 ? -1 : max > 0 ? (max <= 0 ? max * 1.1 : 0) : max * 1.1;
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
    const seriesToInspect = visibleSeries.length > 0 ? visibleSeries : seriesList;

    if (seriesToInspect.length === 0 && rootData.length === 0) {
        return "category";
    }

    const hasBarSeries = seriesToInspect.some(s => s.type === "bar" || s.type === "rangeBar");
    if (hasBarSeries) {
        return "category";
    }

    // Inspect series data
    for (const s of seriesToInspect) {
        const data = resolveData(s.data(), rootData);
        const xField = s.xField() ?? rootXField;

        if (s.type === "candlestick" || s.type === "ohlc") {
            const finReg = s as ChartFinancialSeriesRegistration;
            const openField = finReg.openField();
            const highField = finReg.highField();
            const lowField = finReg.lowField();
            const closeField = finReg.closeField();
            for (let i = 0; i < data.length; i++) {
                const openVal = resolveValue(data[i], openField, i);
                const highVal = resolveValue(data[i], highField, i);
                const lowVal = resolveValue(data[i], lowField, i);
                const closeVal = resolveValue(data[i], closeField, i);
                if (
                    typeof openVal !== "number" ||
                    !Number.isFinite(openVal) ||
                    typeof highVal !== "number" ||
                    !Number.isFinite(highVal) ||
                    typeof lowVal !== "number" ||
                    !Number.isFinite(lowVal) ||
                    typeof closeVal !== "number" ||
                    !Number.isFinite(closeVal)
                ) {
                    continue;
                }
                if (lowVal > Math.min(openVal, closeVal) || highVal < Math.max(openVal, closeVal)) {
                    continue;
                }
                const val = resolveValue(data[i], xField, i);
                if (val === undefined || val === null) {
                    continue;
                }
                if (val instanceof Date && !Number.isNaN(val.getTime())) {
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
                if (typeof val === "number" && Number.isFinite(val)) {
                    return "linear";
                }
            }
            continue;
        }

        for (let i = 0; i < data.length; i++) {
            const val = resolveValue(data[i], xField, i);
            if (val === undefined || val === null) {
                continue;
            }
            if (val instanceof Date && !Number.isNaN(val.getTime())) {
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
            if (typeof val === "number" && Number.isFinite(val)) {
                return "linear";
            }
        }
    }

    // If series had no definitive rows, inspect rootData
    for (let i = 0; i < rootData.length; i++) {
        const val = resolveValue(rootData[i], rootXField, i);
        if (val === undefined || val === null) continue;
        if (val instanceof Date && !Number.isNaN(val.getTime())) {
            return "time";
        }
        if (typeof val === "string") {
            if (ISO_DATE_REGEX.test(val)) {
                const parsed = Date.parse(val);
                if (!Number.isNaN(parsed)) return "time";
            }
            return "category";
        }
        if (isFiniteNumber(val)) return "linear";
    }

    if (seriesToInspect.some(s => s.type === "scatter" || s.type === "bubble")) {
        return "linear";
    }

    return "category";
}

export function calculateCategoryDomain(
    seriesList: readonly ChartCartesianSeriesRegistration[],
    rootData: readonly unknown[],
    rootXField: ChartField | undefined
): readonly string[] {
    const orderedKeys: string[] = [];
    const seen = new Set<string>();

    const visibleSeries = seriesList.filter(s => s.visible());
    const seriesToScan = visibleSeries.length > 0 ? visibleSeries : seriesList;

    if (seriesToScan.length === 0 && rootData.length > 0) {
        for (let i = 0; i < rootData.length; i++) {
            const val = resolveValue(rootData[i], rootXField, i);
            const key = val !== undefined && val !== null ? String(val) : String(i);
            if (!seen.has(key)) {
                seen.add(key);
                orderedKeys.push(key);
            }
        }
        return orderedKeys;
    }

    for (const s of seriesToScan) {
        const data = resolveData(s.data(), rootData);
        const xField = s.xField() ?? rootXField;

        if (s.type === "candlestick" || s.type === "ohlc") {
            const finReg = s as ChartFinancialSeriesRegistration;
            const resolved = FinancialDataResolver.resolve({
                closeField: finReg.closeField(),
                data,
                highField: finReg.highField(),
                keyField: finReg.keyField?.(),
                lowField: finReg.lowField(),
                openField: finReg.openField(),
                seriesId: finReg.id,
                seriesKey: finReg.seriesKey?.(),
                seriesName: finReg.name(),
                xAxisType: "category",
                xField
            });
            for (const mark of resolved.marks) {
                const key = String(mark.xScaleValue);
                if (!seen.has(key)) {
                    seen.add(key);
                    orderedKeys.push(key);
                }
            }
            continue;
        }

        for (let i = 0; i < data.length; i++) {
            const val = resolveValue(data[i], xField, i);
            const key = val !== undefined && val !== null ? String(val) : String(i);
            if (!seen.has(key)) {
                seen.add(key);
                orderedKeys.push(key);
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
    explicitMax?: Date | number,
    xAxisType: "time" | "utc" = "time"
): [Date, Date] {
    let minTime = Number.POSITIVE_INFINITY;
    let maxTime = Number.NEGATIVE_INFINITY;

    const visibleSeries = seriesList.filter(s => s.visible());
    const seriesToScan = (visibleSeries.length > 0 ? visibleSeries : seriesList).filter(s =>
        isCartesianSeriesCompatibleWithXAxisType(s.type, xAxisType)
    );

    const financialTimes: number[] = [];

    for (const s of seriesToScan) {
        const data = resolveData(s.data(), rootData);
        const xField = s.xField() ?? rootXField;
        const isRangeArea = s.type === "rangeArea";
        const isBubble = s.type === "bubble";
        const isScatter = s.type === "scatter";
        const isFinancial = s.type === "candlestick" || s.type === "ohlc";
        const field = "field" in s ? (s as { field: () => ChartField }).field() : undefined;
        const fromField = isRangeArea ? (s as { fromField: () => ChartField }).fromField() : undefined;
        const toField = isRangeArea ? (s as { toField: () => ChartField }).toField() : undefined;
        const sizeField = isBubble ? (s as { sizeField?: () => ChartField }).sizeField?.() : undefined;

        if (isFinancial) {
            const finReg = s as ChartFinancialSeriesRegistration;
            const resolved = FinancialDataResolver.resolve({
                closeField: finReg.closeField(),
                data,
                highField: finReg.highField(),
                keyField: finReg.keyField?.(),
                lowField: finReg.lowField(),
                openField: finReg.openField(),
                seriesId: finReg.id,
                seriesKey: finReg.seriesKey?.(),
                seriesName: finReg.name(),
                xAxisType,
                xField
            });
            for (const mark of resolved.marks) {
                const timeVal = resolveCartesianTemporalValue(mark.xRaw)?.epochMs;
                if (timeVal !== undefined && Number.isFinite(timeVal)) {
                    if (timeVal < minTime) minTime = timeVal;
                    if (timeVal > maxTime) maxTime = timeVal;
                    financialTimes.push(timeVal);
                }
            }
            continue;
        }

        for (let i = 0; i < data.length; i++) {
            const xVal = resolveValue(data[i], xField, i);
            const timeVal = resolveCartesianTemporalValue(xVal)?.epochMs;
            if (timeVal === undefined || !Number.isFinite(timeVal)) {
                continue;
            }

            if (isRangeArea && fromField && toField) {
                const range = resolveFiniteRangeValues(data[i], fromField, toField, i);
                if (!range) continue;
            } else if (isScatter || isBubble) {
                if (!field) continue;
                const yVal = resolveValue(data[i], field, i);
                if (!isFiniteNumber(yVal)) continue;

                if (isBubble && sizeField) {
                    const sVal = resolveValue(data[i], sizeField, i);
                    if (!isFiniteNumber(sVal) || (sVal as number) <= 0) continue;
                }
            }

            if (timeVal < minTime) minTime = timeVal;
            if (timeVal > maxTime) maxTime = timeVal;
        }
    }

    const expMinNum = resolveCartesianTemporalValue(explicitMin)?.epochMs;
    const expMaxNum = resolveCartesianTemporalValue(explicitMax)?.epochMs;
    if (financialTimes.length > 0) {
        const uniqueTimes = Array.from(new Set(financialTimes)).sort((a, b) => a - b);
        const firstFin = uniqueTimes[0];
        const lastFin = uniqueTimes[uniqueTimes.length - 1];

        if (expMinNum === undefined && firstFin === minTime) {
            let leftHalf = 1800000;
            if (uniqueTimes.length > 1) {
                const diff = uniqueTimes[1] - uniqueTimes[0];
                if (diff > 0) leftHalf = diff / 2;
            }
            minTime -= leftHalf;
        }
        if (expMaxNum === undefined && lastFin === maxTime) {
            let rightHalf = 1800000;
            if (uniqueTimes.length > 1) {
                const diff = uniqueTimes[uniqueTimes.length - 1] - uniqueTimes[uniqueTimes.length - 2];
                if (diff > 0) rightHalf = diff / 2;
            }
            maxTime += rightHalf;
        }
    }

    return normalizeCartesianTemporalDomain({
        explicitMax,
        explicitMin,
        observedMaxEpoch: Number.isFinite(maxTime) ? maxTime : undefined,
        observedMinEpoch: Number.isFinite(minTime) ? minTime : undefined
    }).domain as [Date, Date];
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
    const seriesToScan = (visibleSeries.length > 0 ? visibleSeries : seriesList).filter(s =>
        isCartesianSeriesCompatibleWithXAxisType(s.type, "linear")
    );

    const financialX: number[] = [];

    for (const s of seriesToScan) {
        const data = resolveData(s.data(), rootData);
        const xField = s.xField() ?? rootXField;
        const isRangeArea = s.type === "rangeArea";
        const isBubble = s.type === "bubble";
        const isScatter = s.type === "scatter";
        const isFinancial = s.type === "candlestick" || s.type === "ohlc";
        const field = "field" in s ? (s as { field: () => ChartField }).field() : undefined;
        const fromField = isRangeArea ? (s as { fromField: () => ChartField }).fromField() : undefined;
        const toField = isRangeArea ? (s as { toField: () => ChartField }).toField() : undefined;
        const sizeField = isBubble ? (s as { sizeField?: () => ChartField }).sizeField?.() : undefined;

        if (isFinancial) {
            const finReg = s as ChartFinancialSeriesRegistration;
            const resolved = FinancialDataResolver.resolve({
                closeField: finReg.closeField(),
                data,
                highField: finReg.highField(),
                keyField: finReg.keyField?.(),
                lowField: finReg.lowField(),
                openField: finReg.openField(),
                seriesId: finReg.id,
                seriesKey: finReg.seriesKey?.(),
                seriesName: finReg.name(),
                xAxisType: "linear",
                xField
            });
            for (const mark of resolved.marks) {
                if (typeof mark.xRaw === "number" && Number.isFinite(mark.xRaw)) {
                    if (mark.xRaw < min) min = mark.xRaw;
                    if (mark.xRaw > max) max = mark.xRaw;
                    financialX.push(mark.xRaw);
                }
            }
            continue;
        }

        for (let i = 0; i < data.length; i++) {
            const xVal = resolveValue(data[i], xField, i);
            if (!isFiniteNumber(xVal)) {
                continue;
            }

            if (isRangeArea && fromField && toField) {
                const range = resolveFiniteRangeValues(data[i], fromField, toField, i);
                if (!range) continue;
            } else if (isScatter || isBubble) {
                if (!field) continue;
                const yVal = resolveValue(data[i], field, i);
                if (!isFiniteNumber(yVal)) continue;

                if (isBubble && sizeField) {
                    const sVal = resolveValue(data[i], sizeField, i);
                    if (!isFiniteNumber(sVal) || (sVal as number) <= 0) continue;
                }
            }

            if (xVal < min) min = xVal;
            if (xVal > max) max = xVal;
        }
    }

    if (financialX.length > 0) {
        const uniqueX = Array.from(new Set(financialX)).sort((a, b) => a - b);
        const firstFin = uniqueX[0];
        const lastFin = uniqueX[uniqueX.length - 1];

        if (!isFiniteNumber(explicitMin) && firstFin === min) {
            let leftHalf = 0.5;
            if (uniqueX.length > 1) {
                const diff = uniqueX[1] - uniqueX[0];
                if (diff > 0) leftHalf = diff / 2;
            }
            min -= leftHalf;
        }
        if (!isFiniteNumber(explicitMax) && lastFin === max) {
            let rightHalf = 0.5;
            if (uniqueX.length > 1) {
                const diff = uniqueX[uniqueX.length - 1] - uniqueX[uniqueX.length - 2];
                if (diff > 0) rightHalf = diff / 2;
            }
            max += rightHalf;
        }
    }

    const normalized = normalizeContinuousNumericDomain(min, max, explicitMin, explicitMax);
    return [normalized.domain[0], normalized.domain[1]];
}

export function calculateContinuousYDomain(
    seriesList: readonly ChartCartesianSeriesRegistration[],
    rootData: readonly unknown[],
    explicitMin?: number,
    explicitMax?: number,
    rootXField?: ChartField,
    xAxisType?: ChartXAxisType,
    stackLayoutOrAnalysis?: CartesianStackAnalysis | CartesianStackLayout
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

    const stackAnalysis =
        stackLayoutOrAnalysis && "configuration" in stackLayoutOrAnalysis ? stackLayoutOrAnalysis : undefined;

    if (stackAnalysis?.visibleYUnitMode === "invalid") {
        return normalizeContinuousNumericDomain(0, 1, normalizedExpMin, normalizedExpMax).domain as [number, number];
    }

    const stackLayout = stackAnalysis
        ? stackAnalysis.visibleLayout
        : (stackLayoutOrAnalysis as CartesianStackLayout | undefined);

    const invalidSeriesIds = stackAnalysis?.invalidSeriesIds;

    const visibleSeries = seriesList.filter(s => s.visible() && !invalidSeriesIds?.has(s.id));
    const allSeriesToScan =
        visibleSeries.length > 0 ? visibleSeries : seriesList.filter(s => !invalidSeriesIds?.has(s.id));
    const seriesToScan = xAxisType
        ? allSeriesToScan.filter(s => isCartesianSeriesCompatibleWithXAxisType(s.type, xAxisType))
        : allSeriesToScan;

    // Check if zero baseline is required (Area, Bar, or any stack group)
    const requiresZeroBaseline =
        seriesToScan.some(s => s.type === "area" || s.type === "bar") ||
        Boolean(stackLayout && stackLayout.groups.length > 0);

    const hasPercentStacks = Boolean(
        stackAnalysis ? stackAnalysis.axisUnitMode === "percent" : stackLayout?.hasPercentStacks
    );
    const regPercentGroups = stackAnalysis?.configuration.groups.filter(g => g.mode === "percent" && g.valid) ?? [];

    if (hasPercentStacks) {
        let hasPos = stackLayout?.groups.some(g => g.mode === "percent" && g.hasPositive);
        let hasNeg = stackLayout?.groups.some(g => g.mode === "percent" && g.hasNegative);

        if (!hasPos && !hasNeg && regPercentGroups.length > 0) {
            hasPos = regPercentGroups.some(g => g.registeredHasPositive);
            hasNeg = regPercentGroups.some(g => g.registeredHasNegative);
        }

        if (hasPos && hasNeg) {
            min = -100;
            max = 100;
        } else if (hasNeg) {
            min = -100;
            max = 0;
        } else {
            min = 0;
            max = 100;
        }
    } else {
        if (stackLayout && stackLayout.hasNormalStacks) {
            min = Math.min(min, stackLayout.yExtent[0]);
            max = Math.max(max, stackLayout.yExtent[1]);
        }

        const stackedSeriesIds = new Set<string>();
        if (stackLayout) {
            for (const group of stackLayout.groups) {
                for (const id of group.seriesIds) {
                    stackedSeriesIds.add(id);
                }
            }
        }

        for (const s of seriesToScan) {
            if (stackedSeriesIds.has(s.id)) {
                continue;
            }

            const data = resolveData(s.data(), rootData);
            const xField = s.xField() ?? rootXField;

            if (s.type === "candlestick" || s.type === "ohlc") {
                const finReg = s as ChartFinancialSeriesRegistration;
                const resolved = FinancialDataResolver.resolve({
                    closeField: finReg.closeField(),
                    data,
                    highField: finReg.highField(),
                    keyField: finReg.keyField?.(),
                    lowField: finReg.lowField(),
                    openField: finReg.openField(),
                    seriesId: finReg.id,
                    seriesKey: finReg.seriesKey?.(),
                    seriesName: finReg.name(),
                    xAxisType,
                    xField
                });
                for (const mark of resolved.marks) {
                    if (xAxisType === "linear" || xAxisType === "time" || xAxisType === "utc") {
                        if (!isContinuousXValid(mark.xRaw, xAxisType)) {
                            continue;
                        }
                    }
                    if (mark.low < min) min = mark.low;
                    if (mark.high > max) max = mark.high;
                }
                continue;
            }

            if (s.type === "rangeBar" || s.type === "rangeArea") {
                const fromField = (s as { fromField: () => ChartField }).fromField();
                const toField = (s as { toField: () => ChartField }).toField();
                for (let i = 0; i < data.length; i++) {
                    const xVal = resolveValue(data[i], xField, i);
                    if (
                        s.type === "rangeArea" &&
                        (xAxisType === "linear" || xAxisType === "time" || xAxisType === "utc")
                    ) {
                        if (!isContinuousXValid(xVal, xAxisType)) {
                            continue;
                        }
                    }
                    const range = resolveFiniteRangeValues(data[i], fromField, toField, i);
                    if (!range) {
                        continue;
                    }
                    if (range.lowValue < min) min = range.lowValue;
                    if (range.highValue > max) max = range.highValue;
                }
                continue;
            }

            const field = "field" in s ? (s as { field: () => ChartField }).field() : undefined;
            if (!field) {
                continue;
            }
            const isBubble = s.type === "bubble";
            const isScatter = s.type === "scatter";
            const sizeField = isBubble ? (s as { sizeField?: () => ChartField }).sizeField?.() : undefined;

            for (let i = 0; i < data.length; i++) {
                const yVal = resolveValue(data[i], field, i);
                if (!isFiniteNumber(yVal)) {
                    continue;
                }

                if (isScatter || isBubble) {
                    const xVal = resolveValue(data[i], xField, i);
                    if (!isContinuousXValid(xVal, xAxisType ?? "linear")) {
                        continue;
                    }

                    if (isBubble && sizeField) {
                        const sVal = resolveValue(data[i], sizeField, i);
                        if (!isFiniteNumber(sVal) || (sVal as number) <= 0) {
                            continue;
                        }
                    }
                }

                if (yVal < min) min = yVal;
                if (yVal > max) max = yVal;
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
        resMin =
            (normalizedExpMax as number) === 0
                ? -1
                : (normalizedExpMax as number) < 0
                  ? (normalizedExpMax as number) * 1.1
                  : 0;
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
    xAxisType?: ChartXAxisType,
    rootXField?: ChartField
): boolean {
    if (seriesList.length === 0) {
        return rootData.length > 0;
    }

    for (const s of seriesList) {
        if (xAxisType && !isCartesianSeriesCompatibleWithXAxisType(s.type, xAxisType)) {
            continue;
        }
        const data = resolveData(s.data() as readonly unknown[] | undefined, rootData);
        if (data.length === 0) {
            continue;
        }
        const xField =
            "xField" in s ? ((s as { xField: () => ChartField | undefined }).xField?.() ?? rootXField) : rootXField;

        if (s.type === "candlestick" || s.type === "ohlc") {
            const finReg = s as ChartFinancialSeriesRegistration;
            const resolved = FinancialDataResolver.resolve({
                closeField: finReg.closeField(),
                data,
                highField: finReg.highField(),
                keyField: finReg.keyField?.(),
                lowField: finReg.lowField(),
                openField: finReg.openField(),
                seriesId: finReg.id,
                seriesKey: finReg.seriesKey?.(),
                seriesName: finReg.name(),
                xAxisType,
                xField
            });
            for (const mark of resolved.marks) {
                if (xAxisType === "linear" || xAxisType === "time" || xAxisType === "utc") {
                    if (!isContinuousXValid(mark.xRaw, xAxisType)) {
                        continue;
                    }
                }
                return true;
            }
            continue;
        }

        if (s.type === "rangeBar" || s.type === "rangeArea") {
            const fromField = (s as { fromField: () => ChartField }).fromField();
            const toField = (s as { toField: () => ChartField }).toField();
            for (let i = 0; i < data.length; i++) {
                const xVal = resolveValue(data[i], xField, i);
                if (s.type === "rangeArea" && (xAxisType === "linear" || xAxisType === "time" || xAxisType === "utc")) {
                    if (!isContinuousXValid(xVal, xAxisType)) {
                        continue;
                    }
                }
                const range = resolveFiniteRangeValues(data[i], fromField, toField, i);
                if (range !== null) {
                    return true;
                }
            }
            continue;
        }

        const field = "field" in s ? (s as { field: () => ChartField }).field() : undefined;
        if (!field) {
            continue;
        }

        for (let i = 0; i < data.length; i++) {
            const val = resolveValue(data[i], field, i);
            if (!isFiniteNumber(val)) {
                continue;
            }
            if (s.type === "pie" || s.type === "donut") {
                if (val > 0) return true;
            } else if (s.type === "bubble") {
                const xVal = resolveValue(data[i], xField, i);
                if (!isContinuousXValid(xVal, xAxisType ?? "linear")) continue;
                const sizeVal = resolveValue(data[i], (s as { sizeField: () => ChartField }).sizeField(), i);
                if (isFiniteNumber(sizeVal) && sizeVal > 0) {
                    return true;
                }
            } else if (s.type === "scatter") {
                const xVal = resolveValue(data[i], xField, i);
                if (isContinuousXValid(xVal, xAxisType ?? "linear")) {
                    return true;
                }
            } else {
                return true;
            }
        }
    }

    return false;
}
