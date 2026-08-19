import type { ChartField } from "../../models/chart.models";
import type { ChartSeriesRegistration } from "../context/chart-registration-context";
import type { ResolvedChartCartesianAxisType } from "../scale/chart-scale";
import type { ResolvedCartesianAxisDescriptor } from "./cartesian-axis-registry-resolver";

export interface AxisCompatibilityResult {
    readonly resolvedType: ResolvedChartCartesianAxisType;
    readonly warnings: readonly string[];
}

export class CartesianAxisCompatibilityPolicy {
    public static resolveAxisType(
        axis: ResolvedCartesianAxisDescriptor,
        boundSeries: readonly ChartSeriesRegistration[],
        rootData?: readonly unknown[],
        rootXField?: ChartField,
        orientation: "horizontal" | "vertical" = "vertical"
    ): AxisCompatibilityResult {
        const warnings: string[] = [];
        const configuredType = axis.type;

        if (configuredType !== "auto") {
            let resolvedType: ResolvedChartCartesianAxisType = configuredType;

            // Validate log compatibility with series
            if (resolvedType === "log") {
                for (const s of boundSeries) {
                    if (axis.dimension === "y" && (s.type === "bar" || s.type === "area") && orientation !== "horizontal") {
                        warnings.push(
                            `[MonaChart] Scale "log" on axis "${axis.axisId}" is incompatible with ${s.type} series "${s.id}" which requires a zero-baseline. Falling back to "linear".`
                        );
                        resolvedType = "linear";
                        break;
                    }
                    // For horizontal bars, X is value axis
                    if (axis.dimension === "x" && (s.type === "bar" || s.type === "rangeBar") && orientation === "horizontal") {
                        warnings.push(
                            `[MonaChart] Scale "log" on axis "${axis.axisId}" is incompatible with horizontal bar series "${s.id}" which requires a zero-baseline. Falling back to "linear".`
                        );
                        resolvedType = "linear";
                        break;
                    }
                }
            }

            // Enforce horizontal orientation axis type constraints
            if (orientation === "horizontal") {
                if (axis.dimension === "y" && resolvedType !== "category") {
                    warnings.push(
                        `[MonaChart] Horizontal Bar charts require a categorical Y axis; '${configuredType}' is not supported and will be treated as category.`
                    );
                    resolvedType = "category";
                } else if (axis.dimension === "x" && resolvedType === "category") {
                    warnings.push(
                        `[MonaChart] Horizontal Bar charts require a linear X value axis; '${configuredType}' is not supported and will be treated as linear.`
                    );
                    resolvedType = "linear";
                }
            }

            return {
                resolvedType,
                warnings
            };
        }

        // Auto inference based on bound series data
        const isValueDimension = orientation === "horizontal" ? axis.dimension === "x" : axis.dimension === "y";
        const sampleValues = this.#collectSampleValues(axis.dimension, boundSeries, rootData, rootXField, orientation);
        const resolvedType = this.#inferScaleType(axis.dimension, sampleValues, orientation);

        return {
            resolvedType,
            warnings
        };
    }

    static #collectSampleValues(
        dimension: "x" | "y",
        boundSeries: readonly ChartSeriesRegistration[],
        rootData?: readonly unknown[],
        rootXField?: ChartField,
        orientation: "horizontal" | "vertical" = "vertical"
    ): unknown[] {
        const samples: unknown[] = [];
        const maxSamples = 20;
        const isCategoryDim = orientation === "horizontal" ? dimension === "y" : dimension === "x";

        for (const s of boundSeries) {
            const data = ((s.data?.() ?? rootData) ?? []) as readonly unknown[];
            for (let i = 0; i < data.length && samples.length < maxSamples; i++) {
                const item = data[i];
                if (isCategoryDim) {
                    const field = ("xField" in s ? s.xField?.() : undefined) ?? rootXField;
                    if (field && item && typeof item === "object") {
                        samples.push((item as Record<string, unknown>)[field as string]);
                    } else {
                        samples.push(item);
                    }
                } else {
                    if ("field" in s && s.field) {
                        const f = s.field();
                        if (f && item && typeof item === "object") {
                            samples.push((item as Record<string, unknown>)[f as string]);
                        }
                    } else if ("fromField" in s && s.fromField) {
                        const f = s.fromField();
                        if (f && item && typeof item === "object") {
                            samples.push((item as Record<string, unknown>)[f as string]);
                        }
                    } else if ("closeField" in s && s.closeField) {
                        const f = s.closeField();
                        if (f && item && typeof item === "object") {
                            samples.push((item as Record<string, unknown>)[f as string]);
                        }
                    }
                }
            }
            if (samples.length >= maxSamples) {
                break;
            }
        }

        return samples.filter(v => v !== null && v !== undefined);
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

        const allDates = values.every(v => v instanceof Date);
        if (allDates) {
            return "time";
        }

        const allNumbers = values.every(v => typeof v === "number" && !Number.isNaN(v));
        if (allNumbers) {
            return "linear";
        }

        return "category";
    }
}
