import type { ChartField } from "../../models/chart.models";
import type { ChartSeriesRegistration } from "../context/chart-registration-context";
import type { CartesianStackAnalysis } from "../data/cartesian-stack-engine";
import type { ResolvedChartCartesianAxisType } from "../scale/chart-scale";
import type { ResolvedCartesianAxisDescriptor } from "./cartesian-axis-registry-resolver";

export interface AxisDomainResult {
    readonly domain: readonly unknown[];
    readonly warnings: readonly string[];
}

export class CartesianAxisDomainResolver {
    public static resolveDomain(
        axis: ResolvedCartesianAxisDescriptor,
        resolvedType: ResolvedChartCartesianAxisType,
        boundSeries: readonly ChartSeriesRegistration[],
        rootData?: readonly unknown[],
        rootXField?: ChartField,
        stackedExtents?: { min: number; max: number },
        stackAnalysis?: CartesianStackAnalysis
    ): AxisDomainResult {
        const warnings: string[] = [];

        if (resolvedType === "category") {
            const categories = this.#resolveCategoryDomain(axis, boundSeries, rootData, rootXField);
            return {
                domain: categories,
                warnings
            };
        }

        if (resolvedType === "time" || resolvedType === "utc") {
            const domain = this.#resolveTemporalDomain(axis, boundSeries, rootData, rootXField);
            return {
                domain,
                warnings
            };
        }

        // Numeric scales: linear, log, symlog, pow, sqrt
        const domain = this.#resolveNumericDomain(
            axis,
            resolvedType,
            boundSeries,
            rootData,
            rootXField,
            stackedExtents,
            stackAnalysis,
            warnings
        );

        return {
            domain,
            warnings
        };
    }

    static #resolveCategoryDomain(
        axis: ResolvedCartesianAxisDescriptor,
        boundSeries: readonly ChartSeriesRegistration[],
        rootData?: readonly unknown[],
        rootXField?: ChartField
    ): readonly string[] {
        const seen = new Set<string>();
        const categories: string[] = [];

        for (const s of boundSeries) {
            const data = ((s.data?.() ?? rootData) ?? []) as readonly unknown[];
            const field = axis.dimension === "x"
                ? ("xField" in s ? s.xField?.() : undefined) ?? rootXField
                : ("field" in s ? s.field?.() : undefined);

            for (const item of data) {
                let catVal: unknown;
                if (field && item && typeof item === "object") {
                    catVal = (item as Record<string, unknown>)[field as string];
                } else {
                    catVal = item;
                }
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
        rootXField?: ChartField
    ): readonly [Date, Date] {
        let minTime = Infinity;
        let maxTime = -Infinity;

        if (axis.explicitMin !== undefined) {
            const d = axis.explicitMin instanceof Date ? axis.explicitMin.getTime() : Number(axis.explicitMin);
            if (!Number.isNaN(d)) {
                minTime = d;
            }
        }
        if (axis.explicitMax !== undefined) {
            const d = axis.explicitMax instanceof Date ? axis.explicitMax.getTime() : Number(axis.explicitMax);
            if (!Number.isNaN(d)) {
                maxTime = d;
            }
        }

        for (const s of boundSeries) {
            const data = ((s.data?.() ?? rootData) ?? []) as readonly unknown[];
            const field = axis.dimension === "x"
                ? ("xField" in s ? s.xField?.() : undefined) ?? rootXField
                : ("field" in s ? s.field?.() : undefined);

            for (const item of data) {
                let val: unknown;
                if (field && item && typeof item === "object") {
                    val = (item as Record<string, unknown>)[field as string];
                } else {
                    val = item;
                }
                if (val instanceof Date) {
                    const t = val.getTime();
                    if (!Number.isNaN(t)) {
                        if (axis.explicitMin === undefined && t < minTime) minTime = t;
                        if (axis.explicitMax === undefined && t > maxTime) maxTime = t;
                    }
                } else if (typeof val === "number" && !Number.isNaN(val)) {
                    if (axis.explicitMin === undefined && val < minTime) minTime = val;
                    if (axis.explicitMax === undefined && val > maxTime) maxTime = val;
                }
            }
        }

        if (minTime === Infinity || maxTime === -Infinity) {
            return [new Date(0), new Date(1)];
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
        warnings: string[] = []
    ): readonly [number, number] {
        if (stackAnalysis && stackAnalysis.axisUnitMode === "percent") {
            const min = axis.explicitMin !== undefined ? Number(axis.explicitMin) : 0;
            const max = axis.explicitMax !== undefined ? Number(axis.explicitMax) : 100;
            return [min, max];
        }

        const rawValues: number[] = [];

        if (stackedExtents) {
            rawValues.push(stackedExtents.min, stackedExtents.max);
        }

        const stackedSeriesIds = stackAnalysis?.visibleLayout?.bySeriesId;

        for (const s of boundSeries) {
            if (axis.dimension === "y" && stackedSeriesIds && stackedSeriesIds.has(s.id)) {
                continue;
            }
            const data = ((s.data?.() ?? rootData) ?? []) as readonly unknown[];
            if (axis.dimension === "x") {
                const field = ("xField" in s ? s.xField?.() : undefined) ?? rootXField;
                for (const item of data) {
                    const val = field && item && typeof item === "object"
                        ? (item as Record<string, unknown>)[field as string]
                        : item;
                    if (typeof val === "number" && Number.isFinite(val)) {
                        rawValues.push(val);
                    }
                }
            } else {
                // Y dimension
                if ("field" in s && s.field) {
                    const f = s.field();
                    for (const item of data) {
                        const val = f && item && typeof item === "object"
                            ? (item as Record<string, unknown>)[f as string]
                            : item;
                        if (typeof val === "number" && Number.isFinite(val)) {
                            rawValues.push(val);
                        }
                    }
                }
                if ("fromField" in s && "toField" in s) {
                    const ff = s.fromField();
                    const tf = s.toField();
                    for (const item of data) {
                        if (item && typeof item === "object") {
                            const fv = (item as Record<string, unknown>)[ff as string];
                            const tv = (item as Record<string, unknown>)[tf as string];
                            if (typeof fv === "number" && Number.isFinite(fv)) rawValues.push(fv);
                            if (typeof tv === "number" && Number.isFinite(tv)) rawValues.push(tv);
                        }
                    }
                }
                if ("lowField" in s && "highField" in s) {
                    const lf = s.lowField();
                    const hf = s.highField();
                    for (const item of data) {
                        if (item && typeof item === "object") {
                            const lv = (item as Record<string, unknown>)[lf as string];
                            const hv = (item as Record<string, unknown>)[hf as string];
                            if (typeof lv === "number" && Number.isFinite(lv)) rawValues.push(lv);
                            if (typeof hv === "number" && Number.isFinite(hv)) rawValues.push(hv);
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

            if (zeroCount > 0 || (posValues.length > 0 && negValues.length > 0)) {
                warnings.push(
                    `[MonaChart] Log axis "${axis.axisId}" received zero or mixed-sign values. Zero and opposite sign values are excluded from the scale domain.`
                );
            }

            let validValues = posValues.length >= negValues.length ? posValues : negValues;
            let min: number;
            let max: number;

            if (validValues.length === 0) {
                min = 1;
                max = 10;
            } else {
                min = Math.min(...validValues);
                max = Math.max(...validValues);
            }

            if (axis.explicitMin !== undefined) {
                const em = Number(axis.explicitMin);
                if (Number.isFinite(em) && em > 0 && min > 0) min = em;
                else if (Number.isFinite(em) && em < 0 && min < 0) min = em;
            }
            if (axis.explicitMax !== undefined) {
                const em = Number(axis.explicitMax);
                if (Number.isFinite(em) && em > 0 && max > 0) max = em;
                else if (Number.isFinite(em) && em < 0 && max < 0) max = em;
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

            return [min, max];
        }

        // Linear, symlog, pow, sqrt scales
        // Baseline zero inclusion for Bar/Area on value axis when unstacked
        const hasBarOrArea = boundSeries.some(s => s.type === "bar" || s.type === "area");
        if (hasBarOrArea && axis.dimension === "y" && rawValues.length > 0) {
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

        if (min === max) {
            const pad = min === 0 ? 1 : Math.abs(min) * 0.1;
            min -= pad;
            max += pad;
        }

        return [min, max];
    }
}
