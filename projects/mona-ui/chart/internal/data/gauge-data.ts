import type { ChartField } from "../../models/chart.models";
import type { ChartValueFormatter } from "../../models/chart-polar.models";
import { resolveData, resolveValue } from "./chart-value-resolver";
import { deriveRadialDatumId } from "./radial-datum-identity";
import { ChartDiagnostics } from "../utils/chart-diagnostics";
import { formatYValue } from "../utils/chart-formatter";

export interface PreparedGaugeData {
    readonly animationKey: string;
    readonly dataIndex: number;
    readonly datum: unknown;
    readonly domain: readonly [number, number];
    readonly formattedMax: string;
    readonly formattedMin: string;
    readonly formattedValue: string;
    readonly hasValidData: boolean;
    readonly isClamped: boolean;
    readonly max: number;
    readonly min: number;
    readonly ratio: number;
    readonly rawValue: number;
}

export interface GaugeDataOptions {
    readonly data?: readonly unknown[];
    readonly explicitValue?: number;
    readonly keyField?: ChartField;
    readonly max: number;
    readonly min: number;
    readonly rootData: readonly unknown[];
    readonly seriesField: ChartField;
    readonly seriesId: string;
    readonly seriesName: string;
    readonly valueFormatter?: ChartValueFormatter;
    readonly warnedDiagnosticSignatures?: Set<string>;
}

export class GaugeDataProcessor {
    public static process(options: GaugeDataOptions): PreparedGaugeData {
        const {
            data,
            explicitValue,
            keyField,
            rootData,
            seriesField,
            seriesId,
            seriesName,
            valueFormatter,
            warnedDiagnosticSignatures
        } = options;

        let domainMin = Number.isFinite(options.min) ? options.min : 0;
        let domainMax = Number.isFinite(options.max) ? options.max : 100;

        if (domainMax <= domainMin) {
            if (warnedDiagnosticSignatures) {
                ChartDiagnostics.warnOnce(
                    warnedDiagnosticSignatures,
                    `Gauge series "${seriesName}" encountered max (${domainMax}) <= min (${domainMin}). Normalizing max.`,
                    `${seriesId}:invalid-gauge-domain`
                );
            }
            domainMax = domainMin + 1;
        }

        let rawValue: number | undefined;
        let matchedDatum: unknown;
        let matchedDataIndex = -1;
        let hasValidData = false;

        // 1. Explicit value input takes top precedence
        if (explicitValue !== undefined && Number.isFinite(explicitValue)) {
            rawValue = explicitValue;
            hasValidData = true;
        } else {
            // 2. Resolve from series data or rootData
            const rawData = resolveData(data, rootData);
            if (rawData && rawData.length > 0) {
                for (let i = 0; i < rawData.length; i++) {
                    const row = rawData[i];
                    const val = resolveValue(row, seriesField, i);
                    if (typeof val === "number" && Number.isFinite(val)) {
                        rawValue = val;
                        matchedDatum = row;
                        matchedDataIndex = i;
                        hasValidData = true;
                        break;
                    }
                }
            }
        }

        const effectiveValue = rawValue ?? domainMin;
        const isClamped = effectiveValue < domainMin || effectiveValue > domainMax;
        const clampedValue = Math.max(domainMin, Math.min(domainMax, effectiveValue));
        const ratio = (clampedValue - domainMin) / (domainMax - domainMin);

        const formattedValue = valueFormatter
            ? valueFormatter(effectiveValue, matchedDataIndex >= 0 ? matchedDataIndex : 0)
            : formatYValue(effectiveValue, matchedDataIndex >= 0 ? matchedDataIndex : 0);

        const formattedMin = valueFormatter
            ? valueFormatter(domainMin, 0)
            : formatYValue(domainMin, 0);

        const formattedMax = valueFormatter
            ? valueFormatter(domainMax, 0)
            : formatYValue(domainMax, 0);

        const rawKey = matchedDatum && keyField ? resolveValue(matchedDatum, keyField, matchedDataIndex) : undefined;
        const itemId = deriveRadialDatumId(matchedDatum, undefined, rawKey, matchedDataIndex >= 0 ? matchedDataIndex : 0);
        const animationKey = `${seriesId}:gauge:${itemId}`;

        return {
            animationKey,
            dataIndex: matchedDataIndex,
            datum: matchedDatum,
            domain: [domainMin, domainMax],
            formattedMax,
            formattedMin,
            formattedValue,
            hasValidData,
            isClamped,
            max: domainMax,
            min: domainMin,
            ratio,
            rawValue: effectiveValue
        };
    }
}
