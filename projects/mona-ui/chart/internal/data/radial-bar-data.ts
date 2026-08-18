import { isDevMode } from "@angular/core";
import type { ChartField } from "../../models/chart.models";
import type { ChartValueFormatter } from "../../models/chart-polar.models";
import { resolveData, resolveValue } from "./chart-value-resolver";
import { deriveRadialDatumId } from "./radial-datum-identity";
import { ChartDiagnostics } from "../utils/chart-diagnostics";
import type { ChartStyleResolver } from "../style/chart-style-resolver";

export interface PreparedRadialBarDatum {
    readonly animationKey: string;
    readonly category: unknown;
    readonly categoryKey: string;
    readonly color: string;
    readonly dataIndex: number;
    readonly datum: unknown;
    readonly formattedCategory: string;
    readonly formattedValue: string;
    readonly itemId: string;
    readonly normalizedValue: number;
    readonly rawValue: number;
    readonly visible: boolean;
}

export interface RadialBarDataOptions {
    readonly categoryField: ChartField;
    readonly categoryFormatter?: ChartValueFormatter;
    readonly colorField?: ChartField;
    readonly colors?: readonly string[];
    readonly data?: readonly unknown[];
    readonly isDatumVisible: (itemId: string) => boolean;
    readonly keyField?: ChartField;
    readonly max?: number;
    readonly min?: number;
    readonly rootData: readonly unknown[];
    readonly seriesElement?: HTMLElement | null;
    readonly seriesField: ChartField;
    readonly seriesId: string;
    readonly seriesName: string;
    readonly styleResolver: ChartStyleResolver;
    readonly valueFormatter?: ChartValueFormatter;
    readonly warnedDiagnosticSignatures?: Set<string>;
}

export interface PreparedRadialBarData {
    readonly allItems: readonly PreparedRadialBarDatum[];
    readonly domain: readonly [number, number];
    readonly hasValidData: boolean;
    readonly visibleItems: readonly PreparedRadialBarDatum[];
}

function isFiniteNonNegative(val: unknown): val is number {
    return typeof val === "number" && Number.isFinite(val) && val >= 0;
}

export class RadialBarDataProcessor {
    public static process(options: RadialBarDataOptions): PreparedRadialBarData {
        const {
            categoryField,
            categoryFormatter,
            colorField,
            colors,
            data,
            isDatumVisible,
            keyField,
            rootData,
            seriesElement,
            seriesField,
            seriesId,
            seriesName,
            styleResolver,
            valueFormatter,
            warnedDiagnosticSignatures
        } = options;

        const rawData = resolveData(data, rootData);
        if (!rawData || rawData.length === 0) {
            return {
                allItems: [],
                domain: [0, 1],
                hasValidData: false,
                visibleItems: []
            };
        }

        const validEntries: {
            category: unknown;
            categoryKey: string;
            dataIndex: number;
            datum: unknown;
            formattedCategory: string;
            itemId: string;
            value: number;
        }[] = [];

        const seenItemIds = new Set<string>();
        const seenCategories = new Set<string>();
        const seenCustomKeys = new Set<string>();

        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            const rawVal = resolveValue(row, seriesField, i);

            if (typeof rawVal === "number" && rawVal < 0) {
                if (warnedDiagnosticSignatures) {
                    ChartDiagnostics.warnOnce(
                        warnedDiagnosticSignatures,
                        `Radial Bar series "${seriesName}" encountered negative value ${rawVal} at data index ${i}. Negative values are invalid and skipped.`,
                        `${seriesId}:negative-radial-bar-value`
                    );
                }
                continue;
            }

            if (!isFiniteNonNegative(rawVal)) {
                continue;
            }

            const rawCat = resolveValue(row, categoryField, i);
            const categoryKey = rawCat !== undefined && rawCat !== null ? String(rawCat) : String(i);

            if (seenCategories.has(categoryKey)) {
                if (warnedDiagnosticSignatures) {
                    ChartDiagnostics.warnOnce(
                        warnedDiagnosticSignatures,
                        `Radial Bar series "${seriesName}" encountered duplicate category "${categoryKey}" at data index ${i}. First valid datum wins.`,
                        `${seriesId}:duplicate-radial-bar-category`
                    );
                }
                continue;
            }

            const rawKey = keyField ? resolveValue(row, keyField, i) : undefined;
            if (rawKey !== undefined && rawKey !== null) {
                const keyStr = String(rawKey);
                if (seenCustomKeys.has(keyStr)) {
                    if (warnedDiagnosticSignatures) {
                        ChartDiagnostics.warnOnce(
                            warnedDiagnosticSignatures,
                            `Radial Bar series "${seriesName}" encountered duplicate explicit key "${keyStr}" at data index ${i}. First valid datum wins.`,
                            `${seriesId}:duplicate-explicit-key`
                        );
                    }
                    continue;
                }
                seenCustomKeys.add(keyStr);
            }

            seenCategories.add(categoryKey);
            const itemId = deriveRadialDatumId(row, rawCat, rawKey, i);
            seenItemIds.add(itemId);

            const formattedCategory = categoryFormatter
                ? categoryFormatter(rawCat ?? categoryKey, i)
                : categoryKey;

            validEntries.push({
                category: rawCat ?? categoryKey,
                categoryKey,
                dataIndex: i,
                datum: row,
                formattedCategory,
                itemId,
                value: rawVal
            });
        }

        if (validEntries.length === 0) {
            return {
                allItems: [],
                domain: [0, 1],
                hasValidData: false,
                visibleItems: []
            };
        }

        // Domain calculation
        let domainMin = options.min !== undefined && Number.isFinite(options.min) ? options.min : 0;
        if (domainMin < 0) {
            if (warnedDiagnosticSignatures) {
                ChartDiagnostics.warnOnce(
                    warnedDiagnosticSignatures,
                    `Radial Bar series "${seriesName}" encountered negative min (${domainMin}). Normalizing to 0.`,
                    `${seriesId}:negative-radial-bar-min`
                );
            }
            domainMin = 0;
        }

        const maxVal = Math.max(...validEntries.map(e => e.value));
        let domainMax = options.max !== undefined && Number.isFinite(options.max) ? options.max : maxVal;

        if (domainMax <= domainMin) {
            if (warnedDiagnosticSignatures) {
                ChartDiagnostics.warnOnce(
                    warnedDiagnosticSignatures,
                    `Radial Bar series "${seriesName}" encountered max (${domainMax}) <= min (${domainMin}). Normalizing max.`,
                    `${seriesId}:invalid-radial-bar-domain`
                );
            }
            domainMax = domainMin + (maxVal > domainMin ? maxVal - domainMin : 1);
        }

        if (domainMax === domainMin) {
            domainMax = domainMin + 1;
        }

        const span = domainMax - domainMin;
        const allItems: PreparedRadialBarDatum[] = [];
        const visibleItems: PreparedRadialBarDatum[] = [];

        for (let i = 0; i < validEntries.length; i++) {
            const entry = validEntries[i];
            const color = styleResolver.resolveDatumColor(
                colorField,
                colors,
                entry.datum,
                entry.dataIndex,
                i,
                seriesElement
            );

            const ratio = Math.max(0, Math.min(1, (entry.value - domainMin) / span));
            const formattedValue = valueFormatter
                ? valueFormatter(entry.value, entry.dataIndex)
                : String(entry.value);

            const visible = isDatumVisible(entry.itemId);
            const animationKey = `${seriesId}:rb:${entry.itemId}`;

            const item: PreparedRadialBarDatum = {
                animationKey,
                category: entry.category,
                categoryKey: entry.categoryKey,
                color,
                dataIndex: entry.dataIndex,
                datum: entry.datum,
                formattedCategory: entry.formattedCategory,
                formattedValue,
                itemId: entry.itemId,
                normalizedValue: ratio,
                rawValue: entry.value,
                visible
            };

            allItems.push(item);
            if (visible) {
                visibleItems.push(item);
            }
        }

        const hasValidData = allItems.length > 0;

        return {
            allItems,
            domain: [domainMin, domainMax],
            hasValidData,
            visibleItems
        };
    }
}
