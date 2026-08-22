import type { ChartAxisFormatter, ChartXAxisType } from "../../models/chart-axis.models";
import { resolveCartesianTemporalValue } from "../data/cartesian-temporal-value-resolver";
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

    const temporal = resolveCartesianTemporalValue(value);
    if (value instanceof Date && temporal) {
        const span = timeSpanMs ?? 86400000;
        return formatTimeRange(temporal.date, span, xAxisType === "utc");
    }

    if (xAxisType === "time" || xAxisType === "utc") {
        if (temporal) {
            const span = timeSpanMs ?? 86400000;
            return formatTimeRange(temporal.date, span, xAxisType === "utc");
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

export function formatPercentagePoint(value: number, digits: number = 1): string {
    if (!isFiniteNumber(value)) {
        return "";
    }
    const fixed = Number(value.toFixed(digits));
    return `${fixed}%`;
}

export interface CartesianAxisSemanticFormatOptions {
    readonly axisScene?: import("../scene/cartesian-scene").ChartAxisScene;
    readonly index?: number;
    readonly value: unknown;
    readonly xTimeSpanMs?: number;
}

export function formatCartesianAxisSemanticValue(options: CartesianAxisSemanticFormatOptions): string {
    const { axisScene, index = 0, value, xTimeSpanMs } = options;
    if (axisScene?.formatter) {
        return axisScene.formatter(value, index);
    }
    if (axisScene?.unitMode === "percent" && isFiniteNumber(value)) {
        return formatPercentagePoint(value);
    }
    if (axisScene?.axis === "x") {
        return formatXValue(
            value,
            index,
            undefined,
            axisScene.scaleType as ChartXAxisType,
            xTimeSpanMs
        );
    }
    return formatYValue(value, index, undefined);
}
