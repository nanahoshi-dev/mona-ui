import type { ChartField } from "../../models/chart.models";
import type { ChartValueFormatter } from "../../models/chart-polar.models";
import type { ChartRoseScaleMode } from "../../models/chart-radial-arc.models";
import { resolveData, resolveValue } from "./chart-value-resolver";
import { deriveRadialDatumId } from "./radial-datum-identity";
import { ChartDiagnostics } from "../utils/chart-diagnostics";
import type { ChartStyleResolver } from "../style/chart-style-resolver";

export interface PreparedRoseDatum {
    readonly animationKey: string;
    readonly category: unknown;
    readonly categoryIndex: number;
    readonly categoryKey: string;
    readonly color: string;
    readonly dataIndex: number;
    readonly datum: unknown;
    readonly formattedCategory: string;
    readonly formattedValue: string;
    readonly itemId: string;
    readonly normalizedRatio: number;
    readonly rawValue: number;
    readonly visible: boolean;
}

export interface RoseDataOptions {
    readonly categoryField: ChartField;
    readonly categoryFormatter?: ChartValueFormatter;
    readonly colorField?: ChartField;
    readonly colors?: readonly string[];
    readonly data?: readonly unknown[];
    readonly isDatumVisible: (itemId: string) => boolean;
    readonly keyField?: ChartField;
    readonly rootData: readonly unknown[];
    readonly scaleMode: ChartRoseScaleMode;
    readonly seriesElement?: HTMLElement | null;
    readonly seriesField: ChartField;
    readonly seriesId: string;
    readonly seriesName: string;
    readonly styleResolver: ChartStyleResolver;
    readonly valueFormatter?: ChartValueFormatter;
    readonly warnedDiagnosticSignatures?: Set<string>;
}

export interface PreparedRoseData {
    readonly allCategories: readonly { category: unknown; categoryKey: string; formattedCategory: string; itemId: string }[];
    readonly allItems: readonly PreparedRoseDatum[];
    readonly domain: readonly [number, number];
    readonly hasValidData: boolean;
    readonly maxVal: number;
    readonly visibleItems: readonly PreparedRoseDatum[];
}

function isFiniteNonNegative(val: unknown): val is number {
    return typeof val === "number" && Number.isFinite(val) && val >= 0;
}

export class RoseDataProcessor {
    public static process(options: RoseDataOptions): PreparedRoseData {
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
                allCategories: [],
                allItems: [],
                domain: [0, 1],
                hasValidData: false,
                maxVal: 1,
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

        const seenCategories = new Set<string>();
        const seenCustomKeys = new Set<string>();

        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            const rawVal = resolveValue(row, seriesField, i);

            if (typeof rawVal === "number" && rawVal < 0) {
                if (warnedDiagnosticSignatures) {
                    ChartDiagnostics.warnOnce(
                        warnedDiagnosticSignatures,
                        `Rose series "${seriesName}" encountered negative value ${rawVal} at data index ${i}. Negative values are invalid and skipped.`,
                        `${seriesId}:negative-rose-value`
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
                        `Rose series "${seriesName}" encountered duplicate category "${categoryKey}" at data index ${i}. First valid datum wins.`,
                        `${seriesId}:duplicate-rose-category`
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
                            `Rose series "${seriesName}" encountered duplicate explicit key "${keyStr}" at data index ${i}. First valid datum wins.`,
                            `${seriesId}:duplicate-explicit-key`
                        );
                    }
                    continue;
                }
                seenCustomKeys.add(keyStr);
            }

            seenCategories.add(categoryKey);
            const itemId = deriveRadialDatumId(row, rawCat, rawKey, i);

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
                allCategories: [],
                allItems: [],
                domain: [0, 1],
                hasValidData: false,
                maxVal: 1,
                visibleItems: []
            };
        }

        const rawMax = Math.max(...validEntries.map(e => e.value));
        const maxVal = rawMax > 0 ? rawMax : 1;

        const allCategories = validEntries.map(e => ({
            category: e.category,
            categoryKey: e.categoryKey,
            formattedCategory: e.formattedCategory,
            itemId: e.itemId
        }));

        const allItems: PreparedRoseDatum[] = [];
        const visibleItems: PreparedRoseDatum[] = [];

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

            const ratio = Math.max(0, Math.min(1, entry.value / maxVal));
            const formattedValue = valueFormatter
                ? valueFormatter(entry.value, entry.dataIndex)
                : String(entry.value);

            const visible = isDatumVisible(entry.itemId);
            const animationKey = `${seriesId}:rose:${entry.itemId}`;

            const item: PreparedRoseDatum = {
                animationKey,
                category: entry.category,
                categoryIndex: i,
                categoryKey: entry.categoryKey,
                color,
                dataIndex: entry.dataIndex,
                datum: entry.datum,
                formattedCategory: entry.formattedCategory,
                formattedValue,
                itemId: entry.itemId,
                normalizedRatio: ratio,
                rawValue: entry.value,
                visible
            };

            allItems.push(item);
            if (visible) {
                visibleItems.push(item);
            }
        }

        return {
            allCategories,
            allItems,
            domain: [0, maxVal],
            hasValidData: allItems.length > 0,
            maxVal,
            visibleItems
        };
    }
}
