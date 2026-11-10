/** A month of the Overview playground: revenue and cost, drawn as two lines on a category axis. */
export interface FinancePoint {
    readonly cost: number;
    readonly month: string;
    readonly note?: string;
    readonly revenue: number;
}

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export const FINANCE: readonly FinancePoint[] = MONTHS.map((month, index) => ({
    cost: Math.round(4200 + index * 180 + Math.cos(index / 1.8) * 500),
    month,
    note: index === 6 ? "Summer launch" : undefined,
    revenue: Math.round(5000 + index * 320 + Math.sin(index / 1.5) * 1200)
}));

/**
 * Reads a playground text box as a value on an axis: a number for the Y axis, or a month name for the category X
 * axis. Empty text gives `0`, so a required input always has a value.
 */
export function parseAxisValue(text: unknown): Date | number | string {
    if (text instanceof Date || typeof text === "number") {
        return text;
    }
    const trimmed = String(text ?? "").trim();
    if (trimmed === "") {
        return 0;
    }
    const number = Number(trimmed.replaceAll(",", ""));
    return Number.isFinite(number) ? number : trimmed;
}
