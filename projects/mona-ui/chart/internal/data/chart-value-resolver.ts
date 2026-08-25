import type { ChartField, ChartValueAccessor } from "../../models/chart.models";

export function resolveData(
    seriesData: readonly unknown[] | undefined,
    rootData: readonly unknown[] | undefined
): readonly unknown[] {
    return seriesData === undefined ? (rootData ?? []) : seriesData;
}

export function resolveValue<T = unknown>(
    datum: unknown,
    fieldOrAccessor: ChartField | undefined,
    index: number = 0
): T | undefined {
    if (datum === null || datum === undefined) {
        return undefined;
    }
    if (typeof fieldOrAccessor === "function") {
        return (fieldOrAccessor as ChartValueAccessor<unknown, T>)(datum, index);
    }
    if (typeof fieldOrAccessor === "string" && fieldOrAccessor.length > 0) {
        if (typeof datum === "object") {
            return (datum as Record<string, unknown>)[fieldOrAccessor] as T;
        }
        return undefined;
    }
    if (typeof datum === "number" || typeof datum === "string" || datum instanceof Date) {
        return datum as unknown as T;
    }
    return undefined;
}

export function resolveSeriesDisplayName(
    series: { field?: () => ChartField; name?: () => string },
    seriesIndex: number = 0
): string {
    const rawName = series.name?.()?.trim();
    if (rawName) {
        return rawName;
    }
    const field = series.field?.();
    if (typeof field === "string" && field.trim().length > 0) {
        return field.trim();
    }
    return `Series ${seriesIndex + 1}`;
}
