import type { ChartFinancialDirection } from "../../models/chart-financial.models";
import type { ChartField } from "../../models/chart.models";
import { resolveValue } from "./chart-value-resolver";
import { ChartDiagnostics } from "../utils/chart-diagnostics";

export interface ResolvedFinancialMark {
    readonly animationKey: string;
    readonly categoryIndex: number;
    readonly close: number;
    readonly dataIndex: number;
    readonly datum: unknown;
    readonly direction: ChartFinancialDirection;
    readonly high: number;
    readonly low: number;
    readonly open: number;
    readonly xRaw: unknown;
}

export interface FinancialResolutionOptions {
    readonly closeField: ChartField;
    readonly data: readonly unknown[];
    readonly highField: ChartField;
    readonly keyField?: ChartField;
    readonly lowField: ChartField;
    readonly openField: ChartField;
    readonly seriesId: string;
    readonly seriesName: string;
    readonly warnedDiagnosticSignatures?: Set<string>;
    readonly xField?: ChartField;
}

export interface ResolvedFinancialDataset {
    readonly closeValues: readonly number[];
    readonly hasData: boolean;
    readonly highValues: readonly number[];
    readonly lowValues: readonly number[];
    readonly marks: readonly ResolvedFinancialMark[];
    readonly openValues: readonly number[];
    readonly yDomain: readonly [number, number];
}

function parseFiniteNumber(val: unknown): number | null {
    if (typeof val === "number" && Number.isFinite(val)) {
        return val;
    }
    if (typeof val === "string" && val.trim().length > 0) {
        const num = Number(val);
        return Number.isFinite(num) ? num : null;
    }
    return null;
}

export class FinancialDataResolver {
    public static resolve(options: FinancialResolutionOptions): ResolvedFinancialDataset {
        const {
            closeField,
            data,
            highField,
            keyField,
            lowField,
            openField,
            seriesId,
            seriesName,
            warnedDiagnosticSignatures,
            xField
        } = options;

        if (!data || data.length === 0) {
            return {
                closeValues: [],
                hasData: false,
                highValues: [],
                lowValues: [],
                marks: [],
                openValues: [],
                yDomain: [0, 0]
            };
        }

        const marks: ResolvedFinancialMark[] = [];
        const openValues: number[] = [];
        const highValues: number[] = [];
        const lowValues: number[] = [];
        const closeValues: number[] = [];

        let minLow = Number.POSITIVE_INFINITY;
        let maxHigh = Number.NEGATIVE_INFINITY;

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rawOpen = resolveValue(row, openField, i);
            const rawHigh = resolveValue(row, highField, i);
            const rawLow = resolveValue(row, lowField, i);
            const rawClose = resolveValue(row, closeField, i);

            const open = parseFiniteNumber(rawOpen);
            const high = parseFiniteNumber(rawHigh);
            const low = parseFiniteNumber(rawLow);
            const close = parseFiniteNumber(rawClose);

            if (open === null || high === null || low === null || close === null) {
                if (warnedDiagnosticSignatures) {
                    ChartDiagnostics.warnOnce(
                        warnedDiagnosticSignatures,
                        `Financial series "${seriesName}" encountered non-finite OHLC values at data index ${i}. Skipping row.`,
                        `${seriesId}:invalid-ohlc-values`
                    );
                }
                continue;
            }

            const minBody = Math.min(open, close);
            const maxBody = Math.max(open, close);

            // Envelope check: low must be <= min(open, close) and high must be >= max(open, close)
            if (low > minBody || high < maxBody) {
                if (warnedDiagnosticSignatures) {
                    ChartDiagnostics.warnOnce(
                        warnedDiagnosticSignatures,
                        `Financial series "${seriesName}" encountered invalid OHLC envelope at data index ${i} (open=${open}, high=${high}, low=${low}, close=${close}). Skipping row.`,
                        `${seriesId}:invalid-ohlc-envelope`
                    );
                }
                continue;
            }

            const direction: ChartFinancialDirection =
                close > open ? "rising" : close < open ? "falling" : "neutral";

            const xRaw = xField !== undefined ? resolveValue(row, xField, i) : i;

            let animationKey = `${seriesId}:fin:${i}`;
            if (keyField !== undefined) {
                const customKey = resolveValue(row, keyField, i);
                if (customKey !== undefined && customKey !== null) {
                    animationKey = `${seriesId}:fin:${String(customKey)}:${i}`;
                }
            }

            marks.push({
                animationKey,
                categoryIndex: i,
                close,
                dataIndex: i,
                datum: row,
                direction,
                high,
                low,
                open,
                xRaw
            });

            openValues.push(open);
            highValues.push(high);
            lowValues.push(low);
            closeValues.push(close);

            if (low < minLow) {
                minLow = low;
            }
            if (high > maxHigh) {
                maxHigh = high;
            }
        }

        const hasData = marks.length > 0;
        let yDomain: [number, number] = [0, 0];

        if (hasData) {
            if (minLow === maxHigh) {
                yDomain = [minLow - 1, maxHigh + 1];
            } else {
                yDomain = [minLow, maxHigh];
            }
        }

        return {
            closeValues,
            hasData,
            highValues,
            lowValues,
            marks,
            openValues,
            yDomain
        };
    }
}
