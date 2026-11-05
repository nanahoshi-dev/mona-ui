import { formatChartNumber } from "./chart-locale";

export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

export function isFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
}

export function normalizeFiniteNumber(value: unknown, fallback: number): number {
    return isFiniteNumber(value) ? value : fallback;
}

export function normalizeNonNegativeNumber(value: unknown, fallback: number): number {
    return isFiniteNumber(value) && value >= 0 ? value : fallback;
}

export function normalizePositiveNumber(value: unknown, fallback?: number): number | undefined {
    return isFiniteNumber(value) && value > 0 ? value : fallback;
}

export function normalizeMarkerRadius(
    value: unknown,
    fallback: number = 4,
    min: number = 1,
    max: number = 100
): number {
    if (isFiniteNumber(value)) {
        return clamp(value, min, max);
    }
    return clamp(fallback, min, max);
}

export function normalizeRatio(value: unknown, fallback: number = 0.5, min: number = 0, max: number = 1): number {
    return isFiniteNumber(value) ? clamp(value, min, max) : clamp(fallback, min, max);
}

export function normalizeOpacity(value: unknown, fallback: number = 1): number {
    return isFiniteNumber(value) ? clamp(value, 0, 1) : clamp(fallback, 0, 1);
}

export function normalizeTickCount(value: unknown, fallback: number = 5, min: number = 1, max: number = 100): number {
    if (isFiniteNumber(value)) {
        const intVal = Math.floor(value);
        if (intVal >= min) {
            return Math.min(max, intVal);
        }
        if (intVal > 0) {
            return min;
        }
        return fallback;
    }
    return fallback;
}

/**
 * Formats a tick or value label for the chart locale: compact from a thousand up ("1.2K", "3.4M", "200T" in English,
 * "1,5 Mio." in German), grouped decimals below, and significant digits for tiny values instead of a run of zeros.
 */
export function formatCompactNumber(value: number): string {
    if (!Number.isFinite(value)) {
        return "";
    }
    const abs = Math.abs(value);
    if (abs >= 1_000) {
        return formatChartNumber(value, { maximumFractionDigits: 1, notation: "compact" });
    }
    if (abs !== 0 && abs < 1e-6) {
        return formatChartNumber(value, { maximumSignificantDigits: 6 });
    }
    return formatChartNumber(value, { maximumFractionDigits: 6 });
}
