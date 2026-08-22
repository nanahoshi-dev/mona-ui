import type { ChartField } from "../../models/chart.models";
import type { ChartSeriesRegistration } from "../context/chart-registration-context";
import { calculateCategoryDomain } from "../data/chart-domain";
import { resolveData, resolveValue } from "../data/chart-value-resolver";
import type { ResolvedChartCartesianAxisType } from "../scale/chart-scale";
import type { ResolvedCartesianAxisDescriptor } from "./cartesian-axis-registry-resolver";
import type { CartesianStackAnalysis } from "../data/cartesian-stack-engine";
import { isFiniteNumber } from "../utils/number-utils";
import {
    normalizeCartesianTemporalDomain,
    resolveCartesianTemporalValue
} from "../data/cartesian-temporal-value-resolver";

export interface AxisDomainResult {
    readonly domain: readonly [unknown, unknown] | readonly string[];
    readonly isValid: boolean;
    readonly reason?: "all-zero-log" | "invalid-explicit-domain" | "mixed-log-sign";
    readonly warnings: readonly string[];
}

function scanMin(values: readonly number[]): number {
    let min = Infinity;
    for (let i = 0; i < values.length; i++) {
        if (values[i] < min) min = values[i];
    }
    return min;
}

function scanMax(values: readonly number[]): number {
    let max = -Infinity;
    for (let i = 0; i < values.length; i++) {
        if (values[i] > max) max = values[i];
    }
    return max;
}

export class CartesianAxisDomainResolver {
    public static resolveDomain(
        axis: ResolvedCartesianAxisDescriptor,
        resolvedType: ResolvedChartCartesianAxisType,
        boundSeries: readonly ChartSeriesRegistration[],
        rootData?: readonly unknown[],
        rootXField?: ChartField,
        stackedExtents?: { min: number; max: number },
        stackAnalysis?: CartesianStackAnalysis,
        orientation: "horizontal" | "vertical" = "vertical"
    ): AxisDomainResult {
        const warnings: string[] = [];

        if (resolvedType === "category") {
            const domain = this.#resolveCategoryDomain(axis, boundSeries, rootData, rootXField, orientation);
            return {
                domain,
                isValid: true,
                warnings
            };
        }

        if (resolvedType === "time" || resolvedType === "utc") {
            const domain = this.#resolveTemporalDomain(axis, boundSeries, rootData, rootXField, orientation);
            return {
                domain,
                isValid: true,
                warnings
            };
        }

        // Numeric scales: linear, log, symlog, pow, sqrt
        return this.#resolveNumericDomain(
            axis,
            resolvedType,
            boundSeries,
            rootData,
            rootXField,
            stackedExtents,
            stackAnalysis,
            orientation,
            warnings
        );
    }

    static #resolveCategoryDomain(
        axis: ResolvedCartesianAxisDescriptor,
        boundSeries: readonly ChartSeriesRegistration[],
        rootData?: readonly unknown[],
        rootXField?: ChartField,
        orientation: "horizontal" | "vertical" = "vertical"
    ): readonly string[] {
        const isCategoryAxis = orientation === "horizontal" ? axis.dimension === "y" : axis.dimension === "x";
        if (!isCategoryAxis) {
            return [];
        }
        const effectiveRootXField = orientation === "vertical" && axis.field !== undefined ? axis.field : rootXField;
        return calculateCategoryDomain(
            boundSeries as readonly import("../context/chart-registration-context").ChartCartesianSeriesRegistration[],
            rootData ?? [],
            effectiveRootXField
        );
    }

    static #resolveTemporalDomain(
        axis: ResolvedCartesianAxisDescriptor,
        boundSeries: readonly ChartSeriesRegistration[],
        rootData?: readonly unknown[],
        rootXField?: ChartField,
        orientation: "horizontal" | "vertical" = "vertical"
    ): readonly [Date, Date] {
        let observedMinTime = Infinity;
        let observedMaxTime = -Infinity;
        const isTemporalAxis = orientation === "horizontal" ? axis.dimension === "y" : axis.dimension === "x";

        for (const s of boundSeries) {
            const data = resolveData("data" in s && typeof (s as any).data === "function" ? ((s as any).data() as readonly unknown[] | undefined) : undefined, rootData);
            const field = isTemporalAxis
                ? (("xField" in s && typeof s.xField === "function" && s.xField() !== undefined)
                    ? s.xField()
                    : (orientation === "vertical" && axis.field !== undefined ? axis.field : rootXField))
                : ("field" in s && typeof s.field === "function" ? s.field() : undefined);

            for (let i = 0; i < data.length; i++) {
                const item = data[i];
                if (isTemporalAxis) {
                    if (s.type === "bubble") {
                        const bReg = s as import("../context/chart-registration-context").ChartBubbleSeriesRegistration;
                        const sz = resolveValue(item, bReg.sizeField?.(), i);
                        if (typeof sz !== "number" || !Number.isFinite(sz) || sz <= 0) continue;
                        const yv = resolveValue(item, bReg.field?.(), i);
                        if (typeof yv !== "number" || !Number.isFinite(yv)) continue;
                    } else if (s.type === "rangeBar" || s.type === "rangeArea") {
                        const fv = resolveValue(item, (s as any).fromField?.(), i);
                        const tv = resolveValue(item, (s as any).toField?.(), i);
                        if (typeof fv !== "number" || !Number.isFinite(fv) || typeof tv !== "number" || !Number.isFinite(tv)) continue;
                    } else if (s.type === "candlestick" || s.type === "ohlc") {
                        const fReg = s as import("../context/chart-registration-context").ChartFinancialSeriesRegistration;
                        const ov = resolveValue(item, fReg.openField(), i);
                        const cv = resolveValue(item, fReg.closeField(), i);
                        const lv = resolveValue(item, fReg.lowField(), i);
                        const hv = resolveValue(item, fReg.highField(), i);
                        if (
                            typeof ov !== "number" || !Number.isFinite(ov) ||
                            typeof cv !== "number" || !Number.isFinite(cv) ||
                            typeof lv !== "number" || !Number.isFinite(lv) ||
                            typeof hv !== "number" || !Number.isFinite(hv) ||
                            lv > Math.min(ov, cv) ||
                            hv < Math.max(ov, cv)
                        ) continue;
                    } else if ("field" in s && typeof s.field === "function") {
                        const yv = resolveValue(item, s.field(), i);
                        if (typeof yv !== "number" || !Number.isFinite(yv)) continue;
                    }
                }

                const val = resolveValue(item, field, i);
                const t = resolveCartesianTemporalValue(val)?.epochMs;
                if (t !== undefined) {
                    if (t < observedMinTime) observedMinTime = t;
                    if (t > observedMaxTime) observedMaxTime = t;
                }
            }
        }

        return normalizeCartesianTemporalDomain({
            explicitMax: axis.explicitMax,
            explicitMin: axis.explicitMin,
            observedMaxEpoch: Number.isFinite(observedMaxTime) ? observedMaxTime : undefined,
            observedMinEpoch: Number.isFinite(observedMinTime) ? observedMinTime : undefined
        }).domain;
    }

    static #resolveNumericDomain(
        axis: ResolvedCartesianAxisDescriptor,
        resolvedType: "linear" | "log" | "symlog" | "pow" | "sqrt",
        boundSeries: readonly ChartSeriesRegistration[],
        rootData?: readonly unknown[],
        rootXField?: ChartField,
        stackedExtents?: { min: number; max: number },
        stackAnalysis?: CartesianStackAnalysis,
        orientation: "horizontal" | "vertical" = "vertical",
        warnings: string[] = []
    ): AxisDomainResult {
        if (stackAnalysis && stackAnalysis.axisUnitMode === "percent") {
            const hasPos = stackAnalysis.visibleLayout.visibleHasPositive;
            const hasNeg = stackAnalysis.visibleLayout.visibleHasNegative;
            let defaultMin = 0;
            let defaultMax = 100;

            if (hasPos && !hasNeg) {
                defaultMin = 0;
                defaultMax = 100;
            } else if (hasNeg && !hasPos) {
                defaultMin = -100;
                defaultMax = 0;
            } else if (hasPos && hasNeg) {
                defaultMin = -100;
                defaultMax = 100;
            } else {
                const regPos = stackAnalysis.configuration.groups.some(g => g.registeredHasPositive);
                const regNeg = stackAnalysis.configuration.groups.some(g => g.registeredHasNegative);
                if (regPos && !regNeg) {
                    defaultMin = 0;
                    defaultMax = 100;
                } else if (regNeg && !regPos) {
                    defaultMin = -100;
                    defaultMax = 0;
                } else if (regPos && regNeg) {
                    defaultMin = -100;
                    defaultMax = 100;
                } else {
                    defaultMin = 0;
                    defaultMax = 100;
                }
            }

            let min = isFiniteNumber(axis.explicitMin) ? Number(axis.explicitMin) : defaultMin;
            let max = isFiniteNumber(axis.explicitMax) ? Number(axis.explicitMax) : defaultMax;

            if (min > max) {
                const temp = min;
                min = max;
                max = temp;
            }

            if (min === max) {
                min = min - 1;
                max = max + 1;
            }

            return {
                domain: [min, max],
                isValid: true,
                warnings
            };
        }

        const rawValues: number[] = [];

        if (stackedExtents) {
            rawValues.push(stackedExtents.min, stackedExtents.max);
        }

        const isValueAxis = orientation === "horizontal" ? axis.dimension === "x" : axis.dimension === "y";
        const stackedSeriesIds = stackAnalysis?.visibleLayout?.bySeriesId;

        for (const s of boundSeries) {
            if (isValueAxis && stackedSeriesIds && stackedSeriesIds.has(s.id)) {
                continue;
            }
            const data = resolveData("data" in s && typeof (s as any).data === "function" ? ((s as any).data() as readonly unknown[] | undefined) : undefined, rootData);
            if (!isValueAxis) {
                const field = ("xField" in s && typeof s.xField === "function" && s.xField() !== undefined)
                    ? s.xField()
                    : (orientation === "vertical" && axis.field !== undefined ? axis.field : rootXField);
                for (let i = 0; i < data.length; i++) {
                    const item = data[i];
                    // Verify paired value validity before expanding independent domain
                    if (s.type === "bubble") {
                        const bReg = s as import("../context/chart-registration-context").ChartBubbleSeriesRegistration;
                        const sz = resolveValue(item, bReg.sizeField?.(), i);
                        if (typeof sz !== "number" || !Number.isFinite(sz) || sz <= 0) continue;
                        const yv = resolveValue(item, bReg.field?.(), i);
                        if (typeof yv !== "number" || !Number.isFinite(yv)) continue;
                    } else if (s.type === "rangeBar" || s.type === "rangeArea") {
                        const fv = resolveValue(item, (s as any).fromField?.(), i);
                        const tv = resolveValue(item, (s as any).toField?.(), i);
                        if (typeof fv !== "number" || !Number.isFinite(fv) || typeof tv !== "number" || !Number.isFinite(tv)) continue;
                    } else if (s.type === "candlestick" || s.type === "ohlc") {
                        const fReg = s as import("../context/chart-registration-context").ChartFinancialSeriesRegistration;
                        const ov = resolveValue(item, fReg.openField(), i);
                        const cv = resolveValue(item, fReg.closeField(), i);
                        const lv = resolveValue(item, fReg.lowField(), i);
                        const hv = resolveValue(item, fReg.highField(), i);
                        if (
                            typeof ov !== "number" || !Number.isFinite(ov) ||
                            typeof cv !== "number" || !Number.isFinite(cv) ||
                            typeof lv !== "number" || !Number.isFinite(lv) ||
                            typeof hv !== "number" || !Number.isFinite(hv) ||
                            lv > Math.min(ov, cv) ||
                            hv < Math.max(ov, cv)
                        ) continue;
                    } else if ("field" in s && typeof s.field === "function") {
                        const yv = resolveValue(item, s.field(), i);
                        if (typeof yv !== "number" || !Number.isFinite(yv)) continue;
                    }

                    const val = resolveValue(item, field, i);
                    if (typeof val === "number" && Number.isFinite(val)) {
                        rawValues.push(val);
                    }
                }
            } else {
                // Value dimension
                if (s.type === "bubble") {
                    const bubbleReg = s as import("../context/chart-registration-context").ChartBubbleSeriesRegistration;
                    const sizeField = bubbleReg.sizeField?.();
                    const f = bubbleReg.field?.();
                    for (let i = 0; i < data.length; i++) {
                        const item = data[i];
                        const sizeVal = resolveValue(item, sizeField, i);
                        const numSize = typeof sizeVal === "number" ? sizeVal : Number(sizeVal);
                        if (!Number.isFinite(numSize) || numSize <= 0) {
                            continue;
                        }
                        const val = resolveValue(item, f, i);
                        if (typeof val === "number" && Number.isFinite(val)) {
                            rawValues.push(val);
                        }
                    }
                } else if ("fromField" in s && "toField" in s && typeof (s as any).fromField === "function" && typeof (s as any).toField === "function") {
                    const ff = (s as any).fromField();
                    const tf = (s as any).toField();
                    for (let i = 0; i < data.length; i++) {
                        const item = data[i];
                        const fv = resolveValue(item, ff, i);
                        const tv = resolveValue(item, tf, i);
                        if (typeof fv === "number" && Number.isFinite(fv) && typeof tv === "number" && Number.isFinite(tv)) {
                            rawValues.push(fv, tv);
                        }
                    }
                } else if ("openField" in s && "closeField" in s && "lowField" in s && "highField" in s) {
                    const finReg = s as import("../context/chart-registration-context").ChartFinancialSeriesRegistration;
                    const of = finReg.openField();
                    const cf = finReg.closeField();
                    const lf = finReg.lowField();
                    const hf = finReg.highField();
                    for (let i = 0; i < data.length; i++) {
                        const item = data[i];
                        const ov = resolveValue(item, of, i);
                        const cv = resolveValue(item, cf, i);
                        const lv = resolveValue(item, lf, i);
                        const hv = resolveValue(item, hf, i);
                        if (
                            typeof ov === "number" && Number.isFinite(ov) &&
                            typeof cv === "number" && Number.isFinite(cv) &&
                            typeof lv === "number" && Number.isFinite(lv) &&
                            typeof hv === "number" && Number.isFinite(hv) &&
                            lv <= Math.min(ov, cv) &&
                            hv >= Math.max(ov, cv)
                        ) {
                            rawValues.push(ov, cv, lv, hv);
                        }
                    }
                } else if ("field" in s && typeof s.field === "function") {
                    const f = s.field();
                    for (let i = 0; i < data.length; i++) {
                        const item = data[i];
                        const val = resolveValue(item, f, i);
                        if (typeof val === "number" && Number.isFinite(val)) {
                            rawValues.push(val);
                        }
                    }
                }
            }
        }

        // Special handling for log scale
        if (resolvedType === "log") {
            const posValues = rawValues.filter(v => v > 0);
            const negValues = rawValues.filter(v => v < 0);
            const zeroCount = rawValues.filter(v => v === 0).length;

            if (posValues.length > 0 && negValues.length > 0) {
                warnings.push(
                    `[MonaChart] Log axis "${axis.axisId}" contains mixed positive and negative values. Log axis requires all values to have the same sign.`
                );
                return {
                    domain: [1, 10],
                    isValid: false,
                    reason: "mixed-log-sign",
                    warnings
                };
            }

            if (posValues.length === 0 && negValues.length === 0) {
                if (zeroCount > 0) {
                    warnings.push(
                        `[MonaChart] Log axis "${axis.axisId}" contains only zero values, which are invalid for log scale.`
                    );
                }
                return {
                    domain: [1, 10],
                    isValid: false,
                    reason: "all-zero-log",
                    warnings
                };
            }

            if (zeroCount > 0) {
                warnings.push(
                    `[MonaChart] Log axis "${axis.axisId}" received zero values. Zero values are excluded from the log scale domain.`
                );
            }

            const isPositive = posValues.length > 0;
            const activeValues = isPositive ? posValues : negValues;
            let min = scanMin(activeValues);
            let max = scanMax(activeValues);

            if (axis.explicitMin !== undefined) {
                const em = Number(axis.explicitMin);
                if (isFiniteNumber(em)) {
                    if ((isPositive && em > 0) || (!isPositive && em < 0)) {
                        min = em;
                    } else {
                        const req = isPositive ? "positive log scale requires min > 0" : "negative log scale requires min < 0";
                        warnings.push(`[MonaChart] Log axis "${axis.axisId}" has invalid explicit min ${axis.explicitMin}; ${req}.`);
                    }
                }
            }
            if (axis.explicitMax !== undefined) {
                const em = Number(axis.explicitMax);
                if (isFiniteNumber(em)) {
                    if ((isPositive && em > 0) || (!isPositive && em < 0)) {
                        max = em;
                    } else {
                        const req = isPositive ? "positive log scale requires max > 0" : "negative log scale requires max < 0";
                        warnings.push(`[MonaChart] Log axis "${axis.axisId}" has invalid explicit max ${axis.explicitMax}; ${req}.`);
                    }
                }
            }

            if (min > max) {
                const temp = min;
                min = max;
                max = temp;
            }

            if (min === max) {
                if (min > 0) {
                    min = min * 0.1;
                    max = max * 10;
                } else {
                    min = min * 10;
                    max = max * 0.1;
                }
            }

            return {
                domain: [min, max],
                isValid: true,
                warnings
            };
        }

        // Linear, symlog, pow, sqrt scales
        // Baseline zero inclusion for Bar/Area on value axis when unstacked
        const hasBarOrArea = boundSeries.some(s => s.type === "bar" || s.type === "area");
        if (hasBarOrArea && isValueAxis && rawValues.length > 0) {
            rawValues.push(0);
        }

        let min = rawValues.length > 0 ? scanMin(rawValues) : 0;
        let max = rawValues.length > 0 ? scanMax(rawValues) : 1;

        if (axis.explicitMin !== undefined) {
            const em = Number(axis.explicitMin);
            if (isFiniteNumber(em)) min = em;
        }
        if (axis.explicitMax !== undefined) {
            const em = Number(axis.explicitMax);
            if (isFiniteNumber(em)) max = em;
        }

        if (min > max) {
            const temp = min;
            min = max;
            max = temp;
        }

        if (min === max) {
            if (min === 0) {
                min = -1;
                max = 1;
            } else {
                const delta = Math.abs(min) * 0.1;
                min -= delta;
                max += delta;
            }
        }

        return {
            domain: [min, max],
            isValid: true,
            warnings
        };
    }
}
