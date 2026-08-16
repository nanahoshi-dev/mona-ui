export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

export function isFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
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
