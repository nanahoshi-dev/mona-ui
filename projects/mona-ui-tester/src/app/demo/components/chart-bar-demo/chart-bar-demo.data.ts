import type { ChartWaterfallDatumKind } from "@nanahoshi/mona-ui/chart";

/** One period of the Bar & Waterfall playground: revenue per channel for the bars, and a deal size range. */
export interface ChannelSalesPoint {
    readonly high: number | null;
    readonly low: number | null;
    readonly online: number | null;
    readonly partners: number | null;
    readonly period: string;
    readonly retail: number | null;
}

/** One step of the waterfall: a change, or a subtotal or total the chart works out. */
export interface ProfitStep {
    readonly amount: number | null;
    readonly kind: ChartWaterfallDatumKind;
    readonly step: string;
}

export type SalesDataSet = "empty" | "losses" | "months" | "quarters";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Four quarters, in thousands of dollars. */
export const QUARTERLY_SALES: readonly ChannelSalesPoint[] = [
    { high: 96, low: 18, online: 142, partners: 64, period: "Q1", retail: 118 },
    { high: 104, low: 22, online: 158, partners: 71, period: "Q2", retail: 109 },
    { high: 121, low: 25, online: 171, partners: 83, period: "Q3", retail: 124 },
    { high: 138, low: 31, online: 196, partners: 92, period: "Q4", retail: 151 }
];

/** Twelve months, enough categories to pan and zoom. */
export const MONTHLY_SALES: readonly ChannelSalesPoint[] = MONTHS.map((period, index) => {
    const season = Math.sin((index / 11) * Math.PI) * 14;
    const online = Math.round(44 + index * 2.6 + season);
    return {
        high: Math.round(30 + index * 1.8 + season),
        low: Math.round(5 + (index % 4) * 2),
        online,
        partners: Math.round(18 + index * 1.1 + Math.cos(index / 2) * 4),
        period,
        retail: Math.round(36 + Math.cos(index / 1.9) * 9 + (index > 9 ? 16 : 0))
    };
});

/** Profit per channel, where some quarters lose money, to show bars and stacks below zero. */
export const SALES_WITH_LOSSES: readonly ChannelSalesPoint[] = [
    { high: 24, low: -16, online: 38, partners: -12, period: "Q1", retail: -21 },
    { high: 31, low: -9, online: 44, partners: 6, period: "Q2", retail: -8 },
    { high: 36, low: -4, online: 52, partners: 14, period: "Q3", retail: 11 },
    { high: 45, low: 3, online: 61, partners: -5, period: "Q4", retail: 23 }
];

/** A quarter's profit and loss, from revenue to net profit. */
export const QUARTERLY_PROFIT: readonly ProfitStep[] = [
    { amount: 420, kind: "change", step: "Revenue" },
    { amount: -168, kind: "change", step: "Cost of sales" },
    { amount: null, kind: "subtotal", step: "Gross profit" },
    { amount: -64, kind: "change", step: "Marketing" },
    { amount: -112, kind: "change", step: "Salaries" },
    { amount: 18, kind: "change", step: "Other income" },
    { amount: null, kind: "subtotal", step: "Operating profit" },
    { amount: -23, kind: "change", step: "Tax" },
    { amount: null, kind: "total", step: "Net profit" }
];

/** A year of monthly net cash flow, with a subtotal after each quarter. */
export const MONTHLY_PROFIT: readonly ProfitStep[] = MONTHS.flatMap((month, index): ProfitStep[] => {
    const change: ProfitStep = {
        amount: Math.round(Math.sin(index / 1.6) * 38 + (index % 3 === 1 ? -26 : 14)),
        kind: "change",
        step: month
    };
    if (index % 3 !== 2) {
        return [change];
    }
    const subtotal: ProfitStep = { amount: null, kind: "subtotal", step: `Q${(index + 1) / 3}` };
    return index === 11 ? [change, subtotal, { amount: null, kind: "total", step: "Year" }] : [change, subtotal];
});

/** A launch that ends below zero, with a step that changes nothing. */
export const PROFIT_WITH_LOSSES: readonly ProfitStep[] = [
    { amount: 120, kind: "change", step: "Pre-orders" },
    { amount: -185, kind: "change", step: "Production" },
    { amount: -32, kind: "change", step: "Refunds" },
    { amount: 0, kind: "change", step: "Insurance" },
    { amount: null, kind: "subtotal", step: "Launch" },
    { amount: 46, kind: "change", step: "Grants" },
    { amount: null, kind: "total", step: "Net" }
];

export function salesData(set: SalesDataSet): readonly ChannelSalesPoint[] {
    switch (set) {
        case "empty":
            return [];
        case "losses":
            return SALES_WITH_LOSSES;
        case "months":
            return MONTHLY_SALES;
        case "quarters":
            return QUARTERLY_SALES;
    }
}

export function profitData(set: SalesDataSet): readonly ProfitStep[] {
    switch (set) {
        case "empty":
            return [];
        case "losses":
            return PROFIT_WITH_LOSSES;
        case "months":
            return MONTHLY_PROFIT;
        case "quarters":
            return QUARTERLY_PROFIT;
    }
}
