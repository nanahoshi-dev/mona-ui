import type { ChartField } from "../../models/chart.models";
import type { ChartSeriesRegistration } from "../context/chart-registration-context";
import { isCartesianSeriesCompatibleWithXAxisType } from "../data/chart-domain";
import { resolveData, resolveNumericValue, resolveValue } from "../data/chart-value-resolver";
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
    highField?: () => ChartField | undefined;
    lowField?: () => ChartField | undefined;
    openField?: () => ChartField | undefined;
    toField?: () => ChartField | undefined;
};

/** Series that draw one band per category, so their X axis can only be a category axis. */
const CATEGORY_X_SERIES_TYPES: ReadonlySet<string> = new Set(["bar", "rangeBar"]);

/** Series whose X axis types `isCartesianSeriesCompatibleWithXAxisType` decides. */
const X_AXIS_CHECKED_SERIES_TYPES: ReadonlySet<string> = new Set([
    "area",
    "bar",
    "bubble",
    "candlestick",
    "line",
    "ohlc",
    "rangeArea",
    "rangeBar",
    "scatter"
]);

const VALUE_FIELD_NAMES = [
    "field",
    "fromField",
    "toField",
    "openField",
    "highField",
    "lowField",
    "closeField"
] as const;

/** A sample that says something about the axis type: not a gap, not blank text, and not NaN or Infinity. */
function isUsableSample(value: unknown): boolean {
    if (value === null || value === undefined) {
        return false;
    }
    if (typeof value === "number") {
        return Number.isFinite(value);
    }
    if (typeof value === "string") {
        return value.trim().length > 0;
    }
    return true;
}

function seriesName(series: ChartSeriesRegistration): string {
    return "name" in series && typeof series.name === "function" ? (series.name() ?? series.id) : series.id;
}

function isDevMode(): boolean {
    return typeof ngDevMode === "undefined" || !!ngDevMode;
}

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
            resolvedType = this.#inferScaleType(axis.dimension, sampleValues, orientation, boundSeries);
        }

        if (orientation === "vertical" && axis.dimension === "x") {
            for (const s of boundSeries) {
                if (
                    X_AXIS_CHECKED_SERIES_TYPES.has(s.type) &&
                    !isCartesianSeriesCompatibleWithXAxisType(s.type, resolvedType)
                ) {
                    if (!incompatibleSeriesIds.includes(s.id)) {
                        incompatibleSeriesIds.push(s.id);
                    }
                    const needs = CATEGORY_X_SERIES_TYPES.has(s.type) ? "a category" : "a numeric or time";
                    const inferred = configuredType === "auto" ? " (inferred from the data)" : "";
                    warnings.push(
                        `[MonaChart] ${s.type} series "${seriesName(s)}" needs ${needs} X axis, but axis "${axis.axisId}" is "${resolvedType}"${inferred}. Series geometry is omitted.`
                    );
                }
            }
        }

        const isValueAxis = orientation === "horizontal" ? axis.dimension === "x" : axis.dimension === "y";
        if (isValueAxis && isDevMode()) {
            warnings.push(...this.#droppedValueWarnings(axis, boundSeries, rootData));
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
            const accessors = s as SeriesWithOptionalFieldAccessors;
            const data = resolveData(typeof accessors.data === "function" ? accessors.data() : undefined, rootData);
            const valueAccessor = accessors.field ?? accessors.fromField ?? accessors.closeField;
            const valueField = typeof valueAccessor === "function" ? valueAccessor() : undefined;
            const categoryField =
                "xField" in s && typeof s.xField === "function" && s.xField() !== undefined
                    ? s.xField()
                    : orientation === "vertical" && axis.field !== undefined
                      ? axis.field
                      : rootXField;

            // Gaps, blank text and NaN or Infinity are skipped, so one bad value doesn't decide the axis type.
            for (let i = 0; i < data.length && samples.length < maxSamples; i++) {
                const item = data[i];
                if (isCategoryDim) {
                    const val = resolveValue(item, categoryField, i);
                    if (isUsableSample(val)) {
                        samples.push(val);
                    }
                } else if (typeof valueAccessor === "function") {
                    const val = resolveNumericValue(item, valueField, i);
                    if (isUsableSample(val)) {
                        samples.push(val);
                    }
                }
            }
            if (samples.length >= maxSamples) {
                break;
            }
        }

        return samples;
    }

    /**
     * In dev mode, names each series on a value axis that has values the chart can't place (NaN, Infinity, or text
     * that isn't a number); those points are left out. Gaps (`null`, `undefined`) are expected and not reported.
     */
    static #droppedValueWarnings(
        axis: ResolvedCartesianAxisDescriptor,
        boundSeries: readonly ChartSeriesRegistration[],
        rootData?: readonly unknown[]
    ): string[] {
        const warnings: string[] = [];
        for (const s of boundSeries) {
            const accessors = s as SeriesWithOptionalFieldAccessors;
            const fields = VALUE_FIELD_NAMES.flatMap(name => {
                const accessor = accessors[name];
                return typeof accessor === "function" ? [accessor()] : [];
            });
            if (fields.length === 0) {
                continue;
            }
            const data = resolveData(typeof accessors.data === "function" ? accessors.data() : undefined, rootData);
            const hasDropped = data.some((datum, i) =>
                fields.some(field => {
                    const val = resolveNumericValue(datum, field, i);
                    return val !== null && val !== undefined && !(typeof val === "number" && Number.isFinite(val));
                })
            );
            if (hasDropped) {
                warnings.push(
                    `[MonaChart] ${s.type} series "${seriesName(s)}" has values on axis "${axis.axisId}" that aren't finite numbers (NaN, Infinity, or text that isn't a number). Those points are left out.`
                );
            }
        }
        return warnings;
    }

    static #inferScaleType(
        dimension: "x" | "y",
        values: unknown[],
        orientation: "horizontal" | "vertical",
        boundSeries: readonly ChartSeriesRegistration[]
    ): ResolvedChartCartesianAxisType {
        const defaultType =
            orientation === "horizontal"
                ? dimension === "x"
                    ? "linear"
                    : "category"
                : dimension === "x"
                  ? "category"
                  : "linear";

        const isValueAxis = orientation === "horizontal" ? dimension === "x" : dimension === "y";

        // Bars draw one band per category, so numbers (years, ids) on their axis are categories too.
        if (!isValueAxis && boundSeries.some(s => CATEGORY_X_SERIES_TYPES.has(s.type))) {
            return "category";
        }

        if (values.length === 0) {
            return defaultType;
        }

        const allTemporal = values.every(v => isTemporalSample(v));
        if (allTemporal) {
            return "time";
        }

        const allNumbers = values.every(v => typeof v === "number");
        if (allNumbers) {
            return "linear";
        }

        // No series can draw on a category value axis, so text among the values doesn't make it one.
        return isValueAxis ? "linear" : "category";
    }
}
