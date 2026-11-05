import type { ChartAxisFormatter, ChartXAxisType } from "../../models/chart-axis.models";
import { resolveCartesianTemporalValue } from "../data/cartesian-temporal-value-resolver";
import { formatChartDate, formatChartNumber } from "./chart-locale";
import { formatCompactNumber, isFiniteNumber } from "./number-utils";

/** Formats a time tick for the chart locale, with the precision the axis span needs. */
export function formatTimeRange(date: Date, spanMs: number, utc: boolean = false): string {
    const timeZone = utc ? "UTC" : undefined;
    // < ~2 days: hour/minute
    if (spanMs <= 2 * 86400000) {
        return formatChartDate(date, { hour: "2-digit", hourCycle: "h23", minute: "2-digit", timeZone });
    }
    // < ~60 days: month + day
    if (spanMs <= 60 * 86400000) {
        return formatChartDate(date, { day: "numeric", month: "short", timeZone });
    }
    // < ~730 days: month + year
    if (spanMs <= 730 * 86400000) {
        return formatChartDate(date, { month: "short", timeZone, year: "numeric" });
    }
    // > 2 years: year
    return formatChartDate(date, { timeZone, year: "numeric" });
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

export function formatYValue(value: unknown, index: number = 0, formatter?: ChartAxisFormatter<unknown>): string {
    if (formatter) {
        return formatter(value, index);
    }
    if (isFiniteNumber(value)) {
        return formatCompactNumber(value);
    }
    return value !== undefined && value !== null ? String(value) : "";
}

/** Formats a percentage point value (12.5 for 12.5 %) for the chart locale. */
export function formatPercentagePoint(value: number, digits: number = 1): string {
    if (!isFiniteNumber(value)) {
        return "";
    }
    return formatChartNumber(value / 100, { maximumFractionDigits: digits, style: "percent" });
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
        return formatXValue(value, index, undefined, axisScene.scaleType as ChartXAxisType, xTimeSpanMs);
    }
    return formatYValue(value, index, undefined);
}
