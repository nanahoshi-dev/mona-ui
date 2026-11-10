/** One trading day of the Financial playground: the open, high, low and close of a share price. */
export interface PricePoint {
    readonly close: number;
    readonly date: Date;
    readonly high: number;
    readonly low: number;
    readonly open: number;
}

export type PriceDataSet = "empty" | "halfYear" | "month";

function round(value: number): number {
    return Math.round(value * 100) / 100;
}

/** Monday to Friday from a start date, in local time so a time axis shows the same day everywhere. */
function tradingDays(count: number): readonly Date[] {
    const days: Date[] = [];
    for (let offset = 0; days.length < count; offset++) {
        const date = new Date(2026, 0, 5 + offset);
        const weekday = date.getDay();
        if (weekday !== 0 && weekday !== 6) {
            days.push(date);
        }
    }
    return days;
}

/**
 * A deterministic random walk: each day opens near the last close, moves by a drift and a wave, and reaches a little
 * past its body. Every row keeps low ≤ min(open, close) and high ≥ max(open, close), which the series requires.
 */
function priceSeries(count: number, start: number, flatDays: readonly number[] = []): readonly PricePoint[] {
    let previousClose = start;
    return tradingDays(count).map((date, index) => {
        const open = round(previousClose + Math.sin(index * 1.7) * 0.8);
        const move = Math.sin(index / 6) * 2.4 + Math.cos(index * 2.3) * 1.6 + 0.12;
        const close = flatDays.includes(index) ? open : round(open + move);
        const high = round(Math.max(open, close) + 0.3 + Math.abs(Math.sin(index * 0.9)) * 1.4);
        const low = round(Math.min(open, close) - 0.3 - Math.abs(Math.cos(index * 1.3)) * 1.4);
        previousClose = close;
        return { close, date, high, low, open };
    });
}

/** About a month of trading days, with two days that close where they opened. */
export const MONTH_PRICES = priceSeries(22, 182, [6, 15]);

/** Half a year of trading days, enough to pan and zoom. */
export const HALF_YEAR_PRICES = priceSeries(126, 168);

export function priceData(set: PriceDataSet): readonly PricePoint[] {
    switch (set) {
        case "empty":
            return [];
        case "halfYear":
            return HALF_YEAR_PRICES;
        case "month":
            return MONTH_PRICES;
    }
}
