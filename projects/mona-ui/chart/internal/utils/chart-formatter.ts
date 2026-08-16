import type { ChartAxisFormatter, ChartXAxisType } from "../../models/chart-axis.models";
import { formatCompactNumber, isFiniteNumber } from "./number-utils";

export function formatTimeRange(date: Date, spanMs: number, utc: boolean = false): string {
    const timeZone = utc ? "UTC" : undefined;
    // < ~2 days: hour/minute
    if (spanMs <= 2 * 86400000) {
        return new Intl.DateTimeFormat(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone
        }).format(date);
    }
    // < ~60 days: month + day
    if (spanMs <= 60 * 86400000) {
        return new Intl.DateTimeFormat(undefined, {
            month: "short",
            day: "numeric",
            timeZone
        }).format(date);
    }
    // < ~730 days: month + year
    if (spanMs <= 730 * 86400000) {
        return new Intl.DateTimeFormat(undefined, {
            month: "short",
            year: "numeric",
            timeZone
        }).format(date);
    }
    // > 2 years: year
    return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        timeZone
    }).format(date);
}

export function formatXValue(
    value: unknown,
    index: number = 0,
    formatter?: ChartAxisFormatter<unknown>,
    xAxisType?: ChartXAxisType,
    timeSpanMs?: number
): string {
    if (formatter) {
        return formatter(value, index);
    }

    if (value instanceof Date) {
        const span = timeSpanMs ?? 86400000;
        return formatTimeRange(value, span, xAxisType === "utc");
    }

    if (xAxisType === "time" || xAxisType === "utc") {
        let dateVal: Date | undefined;
        if (typeof value === "number" && Number.isFinite(value)) {
            dateVal = new Date(value);
        } else if (typeof value === "string") {
            const parsed = Date.parse(value);
            if (!Number.isNaN(parsed)) {
                dateVal = new Date(parsed);
            }
        }
        if (dateVal) {
            const span = timeSpanMs ?? 86400000;
            return formatTimeRange(dateVal, span, xAxisType === "utc");
        }
    }

    if (isFiniteNumber(value)) {
        return formatCompactNumber(value);
    }

    return value !== undefined && value !== null ? String(value) : "";
}

export function formatYValue(
    value: unknown,
    index: number = 0,
    formatter?: ChartAxisFormatter<unknown>
): string {
    if (formatter) {
        return formatter(value, index);
    }
    if (isFiniteNumber(value)) {
        return formatCompactNumber(value);
    }
    return value !== undefined && value !== null ? String(value) : "";
}
