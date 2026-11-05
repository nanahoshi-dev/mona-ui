import { computed, isSignal, type Signal } from "@angular/core";

/** Reports an error thrown by a callback the app gave the chart, naming the callback (`"field"`, `"formatter"`). */
export type ChartCallbackErrorReporter = (callbackName: string, error: unknown) => void;

function isAccessorKey(key: string): boolean {
    return key === "field" || key.endsWith("Field");
}

function isFormatterKey(key: string): boolean {
    return key === "formatter" || key.endsWith("Formatter");
}

/** What a formatter that threw shows instead: the value as text. */
export function fallbackFormat(value: unknown): string {
    if (value === null || value === undefined) {
        return "";
    }
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? "" : value.toISOString();
    }
    return String(value);
}

/**
 * Wraps a field accessor or formatter so that an error it throws is reported and doesn't escape the chart's layout:
 * an accessor that throws reads as a gap (`undefined`), so only its own series loses those points, and a formatter
 * that throws shows the value as text.
 */
export function guardChartCallback<T>(callback: T, callbackName: string, report: ChartCallbackErrorReporter): T {
    if (typeof callback !== "function") {
        return callback;
    }
    const formatter = isFormatterKey(callbackName);
    const fn = callback as (...args: unknown[]) => unknown;
    return ((...args: unknown[]): unknown => {
        try {
            return fn(...args);
        } catch (error) {
            report(callbackName, error);
            return formatter ? fallbackFormat(args[0]) : undefined;
        }
    }) as T;
}

/**
 * Guards every field accessor (`field`, `xField`, `sizeField`, …) and formatter (`formatter`, `valueFormatter`, …) of a
 * series or axis registration, in place: each such signal is replaced by one that returns the guarded callback.
 */
export function guardRegistrationCallbacks<T extends object>(
    registration: T,
    owner: () => string,
    report: ChartCallbackErrorReporter
): T {
    const record = registration as Record<string, unknown>;
    for (const key of Object.keys(record)) {
        if (!isAccessorKey(key) && !isFormatterKey(key)) {
            continue;
        }
        const source = record[key];
        if (!isSignal(source)) {
            continue;
        }
        record[key] = computed(() =>
            guardChartCallback((source as Signal<unknown>)(), key, (_, error) => report(`${owner()} ${key}`, error))
        );
    }
    return registration;
}
