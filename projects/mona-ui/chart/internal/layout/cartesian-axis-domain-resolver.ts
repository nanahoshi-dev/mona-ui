import type { ChartField } from "../../models/chart.models";
import type { ChartSeriesRegistration } from "../context/chart-registration-context";
import { resolveData, resolveValue } from "../data/chart-value-resolver";
import type { ResolvedChartCartesianAxisType } from "../scale/chart-scale";
import type { ResolvedCartesianAxisDescriptor } from "./cartesian-axis-registry-resolver";
import type { CartesianStackAnalysis } from "../data/cartesian-stack-engine";

export interface AxisDomainResult {
    readonly domain: readonly [unknown, unknown] | readonly string[];
    readonly isValid: boolean;
    readonly warnings: readonly string[];
}

function parseTemporalValue(val: unknown): number | undefined {
    if (val instanceof Date) {
        const t = val.getTime();
        return Number.isNaN(t) ? undefined : t;
    }
    if (typeof val === "number" && Number.isFinite(val)) {
        return val;
    }
    if (typeof val === "string" && val.trim().length > 0) {
        const parsed = Date.parse(val);
        return Number.isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
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
        const seen = new Set<string>();
        const categories: string[] = [];
        const isCategoryAxis = orientation === "horizontal" ? axis.dimension === "y" : axis.dimension === "x";

        for (const s of boundSeries) {
            const data = resolveData("data" in s && typeof (s as any).data === "function" ? ((s as any).data() as readonly unknown[] | undefined) : undefined, rootData);
            const field = isCategoryAxis
                ? (("xField" in s && typeof s.xField === "function" && s.xField() !== undefined) ? s.xField() : (axis.field !== undefined ? axis.field : rootXField))
                : ("field" in s && typeof s.field === "function" ? s.field() : undefined);

            for (let i = 0; i < data.length; i++) {
                const item = data[i];
                const catVal = resolveValue(item, field, i);
                const str = catVal !== null && catVal !== undefined ? String(catVal) : "";
                if (!seen.has(str)) {
                    seen.add(str);
                    categories.push(str);
                }
            }
        }

        return categories;
    }

    static #resolveTemporalDomain(
        axis: ResolvedCartesianAxisDescriptor,
        boundSeries: readonly ChartSeriesRegistration[],
        rootData?: readonly unknown[],
        rootXField?: ChartField,
        orientation: "horizontal" | "vertical" = "vertical"
    ): readonly [Date, Date] {
        let minTime = Infinity;
        let maxTime = -Infinity;
        const isTemporalAxis = orientation === "horizontal" ? axis.dimension === "y" : axis.dimension === "x";

        if (axis.explicitMin !== undefined) {
            const t = parseTemporalValue(axis.explicitMin);
            if (t !== undefined) {
                minTime = t;
            }
        }
        if (axis.explicitMax !== undefined) {
            const t = parseTemporalValue(axis.explicitMax);
            if (t !== undefined) {
                maxTime = t;
            }
        }

        for (const s of boundSeries) {
            const data = resolveData("data" in s && typeof (s as any).data === "function" ? ((s as any).data() as readonly unknown[] | undefined) : undefined, rootData);
            const field = isTemporalAxis
                ? (("xField" in s && typeof s.xField === "function" && s.xField() !== undefined) ? s.xField() : (axis.field !== undefined ? axis.field : rootXField))
                : ("field" in s && typeof s.field === "function" ? s.field() : undefined);

            for (let i = 0; i < data.length; i++) {
                const item = data[i];
                const val = resolveValue(item, field, i);
                const t = parseTemporalValue(val);
                if (t !== undefined) {
                    if (axis.explicitMin === undefined && t < minTime) minTime = t;
                    if (axis.explicitMax === undefined && t > maxTime) maxTime = t;
                }
            }
        }

        if (minTime === Infinity || maxTime === -Infinity) {
            return [new Date(0), new Date(1)];
        }
        if (minTime > maxTime) {
            const temp = minTime;
            minTime = maxTime;
            maxTime = temp;
        }
        if (minTime === maxTime) {
            return [new Date(minTime - 86400000), new Date(maxTime + 86400000)];
        }
        return [new Date(minTime), new Date(maxTime)];
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
            const min = axis.explicitMin !== undefined ? Number(axis.explicitMin) : 0;
            const max = axis.explicitMax !== undefined ? Number(axis.explicitMax) : 100;
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
                    : (axis.field !== undefined ? axis.field : rootXField);
                for (let i = 0; i < data.length; i++) {
                    const item = data[i];
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
                if ("fromField" in s && "toField" in s && typeof (s as any).fromField === "function" && typeof (s as any).toField === "function") {
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
                }
                if ("openField" in s && "closeField" in s && "lowField" in s && "highField" in s) {
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
                    warnings
                };
            }

            if (zeroCount > 0) {
                warnings.push(
                    `[MonaChart] Log axis "${axis.axisId}" received zero values. Zero values are excluded from the log scale domain.`
                );
            }

            const activeValues = posValues.length > 0 ? posValues : negValues;
            let min = Math.min(...activeValues);
            let max = Math.max(...activeValues);

            if (axis.explicitMin !== undefined) {
                const em = Number(axis.explicitMin);
                if (Number.isFinite(em)) {
                    if ((posValues.length > 0 && em > 0) || (negValues.length > 0 && em < 0)) {
                        min = em;
                    } else {
                        warnings.push(`[MonaChart] Log axis "${axis.axisId}" has invalid explicit min ${axis.explicitMin}; positive log scale requires min > 0.`);
                    }
                }
            }
            if (axis.explicitMax !== undefined) {
                const em = Number(axis.explicitMax);
                if (Number.isFinite(em)) {
                    if ((posValues.length > 0 && em > 0) || (negValues.length > 0 && em < 0)) {
                        max = em;
                    } else {
                        warnings.push(`[MonaChart] Log axis "${axis.axisId}" has invalid explicit max ${axis.explicitMax}; negative log scale requires max < 0.`);
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

        let min = rawValues.length > 0 ? Math.min(...rawValues) : 0;
        let max = rawValues.length > 0 ? Math.max(...rawValues) : 1;

        if (axis.explicitMin !== undefined) {
            const em = Number(axis.explicitMin);
            if (Number.isFinite(em)) min = em;
        }
        if (axis.explicitMax !== undefined) {
            const em = Number(axis.explicitMax);
            if (Number.isFinite(em)) max = em;
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
