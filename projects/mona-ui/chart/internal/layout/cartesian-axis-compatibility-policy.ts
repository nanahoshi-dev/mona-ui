import type { ChartField } from "../../models/chart.models";
import type { ChartSeriesRegistration } from "../context/chart-registration-context";
import { resolveData, resolveValue } from "../data/chart-value-resolver";
import type { ResolvedChartCartesianAxisType } from "../scale/chart-scale";
import type { ResolvedCartesianAxisDescriptor } from "./cartesian-axis-registry-resolver";

export interface AxisCompatibilityResult {
    readonly incompatibleSeriesIds: readonly string[];
    readonly resolvedType: ResolvedChartCartesianAxisType;
    readonly warnings: readonly string[];
}

const DATE_STRING_REGEX =
    /^(?:\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4})(?:[T ]\d{1,2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

function isDateString(val: string): boolean {
    if (!val || typeof val !== "string") return false;
    const trimmed = val.trim();
    if (!DATE_STRING_REGEX.test(trimmed)) {
        return false;
    }
    const t = Date.parse(trimmed);
    return !Number.isNaN(t);
}

function isTemporalSample(val: unknown): boolean {
    if (val instanceof Date) {
        return !Number.isNaN(val.getTime());
    }
    if (typeof val === "string") {
        return isDateString(val);
    }
    return false;
}

type SeriesWithOptionalFieldAccessors = {
    closeField?: () => ChartField | undefined;
    data?: () => readonly unknown[] | undefined;
    field?: () => ChartField | undefined;
    fromField?: () => ChartField | undefined;
};

export class CartesianAxisCompatibilityPolicy {
    public static isSeriesCompatibleWithAxis(
        series: ChartSeriesRegistration,
        axis: ResolvedCartesianAxisDescriptor,
        resolvedType: ResolvedChartCartesianAxisType,
        orientation: "horizontal" | "vertical" = "vertical"
    ): boolean {
        if (orientation === "horizontal") {
            if (axis.dimension === "y" && resolvedType !== "category") {
                return false;
            }
            if (axis.dimension === "x") {
                if (resolvedType === "category") {
                    return false;
                }
                if (resolvedType === "log" && series.type === "bar") {
                    return false;
                }
            }
        } else {
            const isValueAxis = axis.dimension === "y";
            if (isValueAxis) {
                if (resolvedType === "log") {
                    if (series.type === "bar" || series.type === "area") {
                        return false;
                    }
                }
                if (resolvedType === "category") {
                    return false;
                }
            }
        }

        return true;
    }

    public static resolveAxisType(
        axis: ResolvedCartesianAxisDescriptor,
        boundSeries: readonly ChartSeriesRegistration[],
        rootData?: readonly unknown[],
        rootXField?: ChartField,
        orientation: "horizontal" | "vertical" = "vertical"
    ): AxisCompatibilityResult {
        const warnings: string[] = [];
        const incompatibleSeriesIds: string[] = [];
        const configuredType = axis.type;

        let resolvedType: ResolvedChartCartesianAxisType;

        if (configuredType !== "auto") {
            resolvedType = configuredType;

            if (orientation === "horizontal") {
                if (axis.dimension === "y" && resolvedType !== "category") {
                    for (const s of boundSeries) {
                        incompatibleSeriesIds.push(s.id);
                        const sName = "name" in s && typeof s.name === "function" ? s.name() : s.id;
                        warnings.push(
                            `[MonaChart] Horizontal series "${sName}" requires a categorical Y axis, but axis "${axis.axisId}" is configured as "${configuredType}". Series geometry is omitted.`
                        );
                    }
                } else if (axis.dimension === "x" && resolvedType === "category") {
                    for (const s of boundSeries) {
                        incompatibleSeriesIds.push(s.id);
                        const sName = "name" in s && typeof s.name === "function" ? s.name() : s.id;
                        warnings.push(
                            `[MonaChart] Horizontal series "${sName}" requires a numeric X value axis, but axis "${axis.axisId}" is configured as "category". Series geometry is omitted.`
                        );
                    }
                }
            }

            const isValueAxis = orientation === "horizontal" ? axis.dimension === "x" : axis.dimension === "y";
            if (resolvedType === "log" && isValueAxis) {
                for (const s of boundSeries) {
                    if (s.type === "bar" || (s.type === "area" && orientation !== "horizontal")) {
                        if (!incompatibleSeriesIds.includes(s.id)) {
                            incompatibleSeriesIds.push(s.id);
                        }
                        const sName = "name" in s && typeof s.name === "function" ? s.name() : s.id;
                        warnings.push(
                            `[MonaChart] Scale "log" on axis "${axis.axisId}" is incompatible with ${s.type} series "${sName}" which requires a zero-baseline. Series geometry is omitted from layout.`
                        );
                    }
                }
            } else if (resolvedType === "category" && isValueAxis && orientation !== "horizontal") {
                for (const s of boundSeries) {
                    if (!incompatibleSeriesIds.includes(s.id)) {
                        incompatibleSeriesIds.push(s.id);
                    }
                    const sName = "name" in s && typeof s.name === "function" ? s.name() : s.id;
                    warnings.push(
                        `[MonaChart] Scale "category" on value axis "${axis.axisId}" is incompatible with ${s.type} series "${sName}". Series geometry is omitted from layout.`
                    );
                }
            }
        } else {
            // Auto inference based on bound series data
            const sampleValues = this.#collectSampleValues(axis, boundSeries, rootData, rootXField, orientation);
            resolvedType = this.#inferScaleType(axis.dimension, sampleValues, orientation);
        }

        return {
            incompatibleSeriesIds,
            resolvedType,
            warnings
        };
    }

    static #collectSampleValues(
        axis: ResolvedCartesianAxisDescriptor,
        boundSeries: readonly ChartSeriesRegistration[],
        rootData?: readonly unknown[],
        rootXField?: ChartField,
        orientation: "horizontal" | "vertical" = "vertical"
    ): unknown[] {
        const samples: unknown[] = [];
        const maxSamples = 30;
        const isCategoryDim = orientation === "horizontal" ? axis.dimension === "y" : axis.dimension === "x";

        for (const s of boundSeries) {
            const data = resolveData("data" in s && typeof (s as SeriesWithOptionalFieldAccessors).data === "function" ? (s as SeriesWithOptionalFieldAccessors).data!() : undefined, rootData);
            for (let i = 0; i < data.length && samples.length < maxSamples; i++) {
                const item = data[i];
                if (isCategoryDim) {
                    const field = ("xField" in s && typeof s.xField === "function" && s.xField() !== undefined)
                        ? s.xField()
                        : (orientation === "vertical" && axis.field !== undefined ? axis.field : rootXField);
                    const val = resolveValue(item, field, i);
                    if (val !== null && val !== undefined) {
                        samples.push(val);
                    }
                } else {
                    if ("field" in s && typeof (s as SeriesWithOptionalFieldAccessors).field === "function") {
                        const val = resolveValue(item, (s as SeriesWithOptionalFieldAccessors).field!(), i);
                        if (val !== null && val !== undefined) samples.push(val);
                    } else if ("fromField" in s && typeof (s as SeriesWithOptionalFieldAccessors).fromField === "function") {
                        const fv = resolveValue(item, (s as SeriesWithOptionalFieldAccessors).fromField!(), i);
                        if (fv !== null && fv !== undefined) samples.push(fv);
                    } else if ("closeField" in s && typeof (s as SeriesWithOptionalFieldAccessors).closeField === "function") {
                        const cv = resolveValue(item, (s as SeriesWithOptionalFieldAccessors).closeField!(), i);
                        if (cv !== null && cv !== undefined) samples.push(cv);
                    }
                }
            }
            if (samples.length >= maxSamples) {
                break;
            }
        }

        return samples;
    }

    static #inferScaleType(
        dimension: "x" | "y",
        values: unknown[],
        orientation: "horizontal" | "vertical" = "vertical"
    ): ResolvedChartCartesianAxisType {
        const defaultType = orientation === "horizontal"
            ? (dimension === "x" ? "linear" : "category")
            : (dimension === "x" ? "category" : "linear");

        if (values.length === 0) {
            return defaultType;
        }

        const allTemporal = values.every(v => isTemporalSample(v));
        if (allTemporal) {
            return "time";
        }

        const allNumbers = values.every(v => typeof v === "number" && Number.isFinite(v));
        if (allNumbers) {
            return "linear";
        }

        return "category";
    }
}
