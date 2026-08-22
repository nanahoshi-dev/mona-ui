import type { ChartXAxisType } from "../../models/chart-axis.models";
import type { ChartFinancialDirection } from "../../models/chart-financial.models";
import type { ChartField } from "../../models/chart.models";
import type { ResolvedChartCartesianAxisType } from "../scale/chart-scale";
import type { ChartInteractionXKey } from "../scene/scene-geometry";
import { normalizeSeriesKey, serializeKeyPart } from "../animation/animation-identity";
import { ChartDiagnostics } from "../utils/chart-diagnostics";
import { resolveValue } from "./chart-value-resolver";
import { resolveCartesianTemporalValue } from "./cartesian-temporal-value-resolver";

export interface ResolvedFinancialMark {
    readonly animationKey: string;
    readonly categoryIndex: number;
    readonly change: number;
    readonly changePercentage?: number;
    readonly close: number;
    readonly dataIndex: number;
    readonly datum: unknown;
    readonly direction: ChartFinancialDirection;
    readonly high: number;
    readonly low: number;
    readonly open: number;
    readonly xKey: ChartInteractionXKey;
    readonly xRaw: unknown;
    readonly xScaleValue: string | number | Date;
}

export interface FinancialResolutionOptions {
    readonly closeField: ChartField;
    readonly data: readonly unknown[];
    readonly highField: ChartField;
    readonly keyField?: ChartField;
    readonly lowField: ChartField;
    readonly openField: ChartField;
    readonly seriesId: string;
    readonly seriesKey?: string;
    readonly seriesName: string;
    readonly warnedDiagnosticSignatures?: Set<string>;
    readonly xAxisType?: ChartXAxisType;
    readonly xField?: ChartField;
}

export interface ResolvedFinancialDataset {
    readonly closeValues: readonly number[];
    readonly hasData: boolean;
    readonly highValues: readonly number[];
    readonly lowValues: readonly number[];
    readonly marks: readonly ResolvedFinancialMark[];
    readonly openValues: readonly number[];
}

export interface ResolvedFinancialX {
    readonly isContinuousInvalid?: boolean;
    readonly key: ChartInteractionXKey;
    readonly rawValue: unknown;
    readonly scaleValue: string | number | Date;
}

function isFiniteNumericValue(val: unknown): val is number {
    return typeof val === "number" && Number.isFinite(val);
}

export function resolveFinancialX(
    row: unknown,
    xField: ChartField | undefined,
    dataIndex: number,
    xAxisType?: ChartXAxisType | ResolvedChartCartesianAxisType
): ResolvedFinancialX {
    const rawX = xField !== undefined ? resolveValue(row, xField, dataIndex) : dataIndex;

    if (
        xAxisType === "linear" ||
        xAxisType === "log" ||
        xAxisType === "symlog" ||
        xAxisType === "pow" ||
        xAxisType === "sqrt"
    ) {
        if (typeof rawX !== "number" || !Number.isFinite(rawX)) {
            return {
                isContinuousInvalid: true,
                key: "",
                rawValue: rawX,
                scaleValue: 0
            };
        }
        return {
            key: rawX,
            rawValue: rawX,
            scaleValue: rawX
        };
    }

    if (xAxisType === "time" || xAxisType === "utc") {
        const resolved = resolveCartesianTemporalValue(rawX);
        if (!resolved) {
            return {
                isContinuousInvalid: true,
                key: 0,
                rawValue: rawX,
                scaleValue: new Date(0)
            };
        }

        return {
            key: resolved.epochMs,
            rawValue: rawX,
            scaleValue: resolved.date
        };
    }

    // Default: category
    const categoryValue = rawX !== null && rawX !== undefined ? String(rawX) : String(dataIndex);
    return {
        key: categoryValue,
        rawValue: rawX,
        scaleValue: categoryValue
    };
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
            xAxisType,
            xField
        } = options;

        if (!data || data.length === 0) {
            return {
                closeValues: [],
                hasData: false,
                highValues: [],
                lowValues: [],
                marks: [],
                openValues: []
            };
        }

        const marks: ResolvedFinancialMark[] = [];
        const openValues: number[] = [];
        const highValues: number[] = [];
        const lowValues: number[] = [];
        const closeValues: number[] = [];

        const seenXKeys = new Set<ChartInteractionXKey>();
        const seenCustomKeys = new Set<string>();

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rawOpen = resolveValue(row, openField, i);
            const rawHigh = resolveValue(row, highField, i);
            const rawLow = resolveValue(row, lowField, i);
            const rawClose = resolveValue(row, closeField, i);

            if (
                !isFiniteNumericValue(rawOpen) ||
                !isFiniteNumericValue(rawHigh) ||
                !isFiniteNumericValue(rawLow) ||
                !isFiniteNumericValue(rawClose)
            ) {
                if (warnedDiagnosticSignatures) {
                    ChartDiagnostics.warnOnce(
                        warnedDiagnosticSignatures,
                        `Financial series "${seriesName}" encountered non-finite OHLC values at data index ${i}. Skipping row.`,
                        `${seriesId}:invalid-ohlc-values`
                    );
                }
                continue;
            }

            const open = rawOpen;
            const high = rawHigh;
            const low = rawLow;
            const close = rawClose;

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

            const resolvedX = resolveFinancialX(row, xField, i, xAxisType);
            if (resolvedX.isContinuousInvalid) {
                if (warnedDiagnosticSignatures) {
                    ChartDiagnostics.warnOnce(
                        warnedDiagnosticSignatures,
                        `Financial series "${seriesName}" encountered invalid continuous X value at data index ${i}. Skipping row.`,
                        `${seriesId}:invalid-continuous-x`
                    );
                }
                continue;
            }

            if (seenXKeys.has(resolvedX.key)) {
                if (warnedDiagnosticSignatures) {
                    ChartDiagnostics.warnOnce(
                        warnedDiagnosticSignatures,
                        `Financial series "${seriesName}" encountered duplicate X key "${String(resolvedX.key)}" at data index ${i}. First valid datum wins.`,
                        `${seriesId}:duplicate-financial-x`
                    );
                }
                continue;
            }

            const identityPrefix = normalizeSeriesKey(options.seriesKey) ?? seriesId;
            let customKeyIdentifier: string | undefined;
            let animationKey = `${identityPrefix}:fin:x:${String(resolvedX.key)}`;
            if (keyField !== undefined) {
                const customKey = resolveValue(row, keyField, i);
                const keyPart = serializeKeyPart(customKey);
                if (keyPart !== null) {
                    customKeyIdentifier = `${keyPart.type}:${String(keyPart.value)}`;
                    if (seenCustomKeys.has(customKeyIdentifier)) {
                        if (warnedDiagnosticSignatures) {
                            ChartDiagnostics.warnOnce(
                                warnedDiagnosticSignatures,
                                `Financial series "${seriesName}" encountered duplicate explicit animation key "${customKeyIdentifier}" at data index ${i}. First valid datum wins.`,
                                `${seriesId}:duplicate-financial-key`
                            );
                        }
                        continue;
                    }
                    animationKey = `${identityPrefix}:fin:key:${customKeyIdentifier}`;
                }
            }

            seenXKeys.add(resolvedX.key);
            if (customKeyIdentifier !== undefined) {
                seenCustomKeys.add(customKeyIdentifier);
            }

            const direction: ChartFinancialDirection = close > open ? "rising" : close < open ? "falling" : "neutral";

            const change = close - open;
            const changePercentage = open !== 0 ? change / Math.abs(open) : undefined;

            marks.push({
                animationKey,
                categoryIndex: i,
                change,
                changePercentage,
                close,
                dataIndex: i,
                datum: row,
                direction,
                high,
                low,
                open,
                xKey: resolvedX.key,
                xRaw: resolvedX.rawValue,
                xScaleValue: resolvedX.scaleValue
            });

            openValues.push(open);
            highValues.push(high);
            lowValues.push(low);
            closeValues.push(close);
        }

        const hasData = marks.length > 0;

        return {
            closeValues,
            hasData,
            highValues,
            lowValues,
            marks,
            openValues
        };
    }
}
