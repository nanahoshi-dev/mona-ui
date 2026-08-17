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

export function normalizeRatio(value: unknown, fallback: number = 0.5, min: number = 0, max: number = 1): number {
    return isFiniteNumber(value) ? clamp(value, min, max) : clamp(fallback, min, max);
}

export function normalizeOpacity(value: unknown, fallback: number = 1): number {
    return isFiniteNumber(value) ? clamp(value, 0, 1) : clamp(fallback, 0, 1);
}

export function normalizeTickCount(value: unknown, fallback: number = 5): number {
    if (isFiniteNumber(value) && value >= 1) {
        return Math.min(100, Math.floor(value));
    }
    return fallback;
}

export function formatCompactNumber(value: number): string {
    if (!Number.isFinite(value)) {
        return "";
    }
    const abs = Math.abs(value);
    if (abs >= 1_000_000) {
        const formatted = (value / 1_000_000).toFixed(1).replace(/\.0$/, "");
        return `${formatted}M`;
    }
    if (abs >= 1_000) {
        const formatted = (value / 1_000).toFixed(1).replace(/\.0$/, "");
        return `${formatted}K`;
    }
    return String(value);
}
