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

function isDateString(val: string): boolean {
    if (!val || val.trim().length === 0) return false;
    if (/^\s*-?\d+(\.\d+)?\s*$/.test(val)) {
        return false;
    }
    const t = Date.parse(val);
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

export class CartesianAxisCompatibilityPolicy {
    public static isSeriesCompatibleWithAxis(
        series: ChartSeriesRegistration,
        axis: ResolvedCartesianAxisDescriptor,
        resolvedType: ResolvedChartCartesianAxisType,
        orientation: "horizontal" | "vertical" = "vertical"
    ): boolean {
        const isValueAxis = orientation === "horizontal" ? axis.dimension === "x" : axis.dimension === "y";

        if (isValueAxis) {
            if (resolvedType === "log") {
                if (series.type === "bar") {
                    return false;
                }
                if (series.type === "area" && orientation !== "horizontal") {
                    return false;
                }
            }
            if (resolvedType === "category") {
                return false;
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

        if (configuredType !== "auto") {
            let resolvedType: ResolvedChartCartesianAxisType = configuredType;

            // Enforce horizontal orientation axis type constraints
            if (orientation === "horizontal") {
                if (axis.dimension === "y" && resolvedType !== "category") {
                    warnings.push(
                        `[MonaChart] Horizontal Bar charts require a categorical Y axis; '${configuredType}' is not supported and will be treated as category.`
                    );
                    resolvedType = "category";
                } else if (axis.dimension === "x" && resolvedType === "category") {
                    warnings.push(
                        `[MonaChart] Horizontal Bar charts require a numeric X value axis; '${configuredType}' is not supported and will be treated as linear.`
                    );
                    resolvedType = "linear";
                }
            }

            // Check series compatibility without mutating explicit requested scale
            const isValueAxis = orientation === "horizontal" ? axis.dimension === "x" : axis.dimension === "y";
            if (resolvedType === "log" && isValueAxis) {
                for (const s of boundSeries) {
                    if (s.type === "bar" || (s.type === "area" && orientation !== "horizontal")) {
                        incompatibleSeriesIds.push(s.id);
                        const sName = "name" in s && typeof s.name === "function" ? s.name() : s.id;
                        warnings.push(
                            `[MonaChart] Scale "log" on axis "${axis.axisId}" is incompatible with ${s.type} series "${sName}" which requires a zero-baseline. Series geometry is omitted from layout.`
                        );
                    }
                }
            }

            return {
                incompatibleSeriesIds,
                resolvedType,
                warnings
            };
        }

        // Auto inference based on bound series data
        const sampleValues = this.#collectSampleValues(axis, boundSeries, rootData, rootXField, orientation);
        const resolvedType = this.#inferScaleType(axis.dimension, sampleValues, orientation);

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
            const data = resolveData("data" in s && typeof (s as any).data === "function" ? ((s as any).data() as readonly unknown[] | undefined) : undefined, rootData);
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
                    if ("field" in s && typeof (s as any).field === "function") {
                        const val = resolveValue(item, (s as any).field(), i);
                        if (val !== null && val !== undefined) samples.push(val);
                    } else if ("fromField" in s && typeof (s as any).fromField === "function") {
                        const fv = resolveValue(item, (s as any).fromField(), i);
                        if (fv !== null && fv !== undefined) samples.push(fv);
                    } else if ("closeField" in s && typeof (s as any).closeField === "function") {
                        const cv = resolveValue(item, (s as any).closeField(), i);
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
