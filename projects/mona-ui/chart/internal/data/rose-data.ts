import type { ChartField } from "../../models/chart.models";
import type { ChartValueFormatter } from "../../models/chart-polar.models";
import type { ChartRoseScaleMode } from "../../models/chart-radial-arc.models";
import { resolveData, resolveValue } from "./chart-value-resolver";
import {
    deriveRadialDatumId,
    serializeRadialCategoryKey,
    serializeRadialExplicitKey
} from "./radial-datum-identity";
import { ChartDiagnostics } from "../utils/chart-diagnostics";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { formatYValue } from "../utils/chart-formatter";

export interface PreparedRoseCategory {
    readonly category: unknown;
    readonly categoryKey: string;
    readonly formattedCategory: string;
    readonly index: number;
    readonly itemId: string;
}

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
    readonly max?: number;
    readonly min?: number;
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
    readonly allCategories: readonly PreparedRoseCategory[];
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
            scaleMode,
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

        // 1. First pass: establish unique category slots in source order, even if first occurrence value is invalid
        interface CategorySlot {
            category: unknown;
            categoryKey: string;
            dataIndex: number;
            datum: unknown;
            explicitKey?: string;
            formattedCategory: string;
            index: number;
            itemId: string;
            validDatum?: {
                dataIndex: number;
                datum: unknown;
                itemId: string;
                value: number;
            };
        }

        const categorySlots: CategorySlot[] = [];
        const slotByKey = new Map<string, CategorySlot>();
        const seenCustomKeys = new Set<string>();

        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            const rawCat = resolveValue(row, categoryField, i);
            const catKey = serializeRadialCategoryKey(rawCat, i);

            let slot = slotByKey.get(catKey);
            const rawKey = keyField ? resolveValue(row, keyField, i) : undefined;
            const customKey = serializeRadialExplicitKey(rawKey);

            if (!slot) {
                if (customKey !== null) {
                    if (seenCustomKeys.has(customKey)) {
                        if (warnedDiagnosticSignatures) {
                            ChartDiagnostics.warnOnce(
                                warnedDiagnosticSignatures,
                                `Rose series "${seriesName}" encountered duplicate explicit key "${String(rawKey)}" at data index ${i}. First valid datum wins.`,
                                `${seriesId}:duplicate-explicit-key`
                            );
                        }
                        continue;
                    }
                    seenCustomKeys.add(customKey);
                }

                const itemId = deriveRadialDatumId(row, rawCat, rawKey, i);
                const formattedCategory = categoryFormatter
                    ? categoryFormatter(rawCat ?? `Item ${i + 1}`, i)
                    : rawCat !== undefined && rawCat !== null
                      ? String(rawCat)
                      : `Item ${i + 1}`;

                slot = {
                    category: rawCat ?? `Item ${i + 1}`,
                    categoryKey: catKey,
                    dataIndex: i,
                    datum: row,
                    explicitKey: customKey ?? undefined,
                    formattedCategory,
                    index: categorySlots.length,
                    itemId
                };
                categorySlots.push(slot);
                slotByKey.set(catKey, slot);
            }

            // Check if this row can provide the valid datum for this category slot (if not already populated)
            if (!slot.validDatum) {
                const rawVal = resolveValue(row, seriesField, i);
                if (typeof rawVal === "number" && rawVal < 0) {
                    if (warnedDiagnosticSignatures) {
                        ChartDiagnostics.warnOnce(
                            warnedDiagnosticSignatures,
                            `Rose series "${seriesName}" encountered negative value ${rawVal} at data index ${i}. Negative values are invalid and skipped.`,
                            `${seriesId}:negative-rose-value`
                        );
                    }
                } else if (isFiniteNonNegative(rawVal)) {
                    const markItemId = deriveRadialDatumId(row, rawCat, rawKey, i);
                    slot.validDatum = {
                        dataIndex: i,
                        datum: row,
                        itemId: markItemId,
                        value: rawVal
                    };
                }
            }
        }

        if (categorySlots.length === 0) {
            return {
                allCategories: [],
                allItems: [],
                domain: [0, 1],
                hasValidData: false,
                maxVal: 1,
                visibleItems: []
            };
        }

        const validEntries = categorySlots.filter((slot): slot is CategorySlot & { validDatum: NonNullable<CategorySlot["validDatum"]> } => slot.validDatum !== undefined);

        const rawMax = validEntries.length > 0 ? Math.max(...validEntries.map(e => e.validDatum.value)) : 0;
        let domainMin = options.min !== undefined && Number.isFinite(options.min) ? options.min : 0;
        if (domainMin < 0) {
            if (warnedDiagnosticSignatures) {
                ChartDiagnostics.warnOnce(
                    warnedDiagnosticSignatures,
                    `Rose series "${seriesName}" encountered negative radial min (${domainMin}). Normalizing to 0.`,
                    `${seriesId}:negative-rose-min`
                );
            }
            domainMin = 0;
        }

        let domainMax = options.max !== undefined && Number.isFinite(options.max) ? options.max : rawMax;
        if (domainMax <= domainMin) {
            domainMax = domainMin + (rawMax > domainMin ? rawMax - domainMin : 1);
        }
        if (domainMax === domainMin) {
            domainMax = domainMin + 1;
        }

        const maxVal = domainMax;
        const span = domainMax - domainMin;

        const allCategories: PreparedRoseCategory[] = categorySlots.map(s => ({
            category: s.category,
            categoryKey: s.categoryKey,
            formattedCategory: s.formattedCategory,
            index: s.index,
            itemId: s.itemId
        }));

        const allItems: PreparedRoseDatum[] = [];
        const visibleItems: PreparedRoseDatum[] = [];

        for (const slot of validEntries) {
            const entry = slot.validDatum;
            const color = styleResolver.resolveDatumColor(
                colorField,
                colors,
                entry.datum,
                entry.dataIndex,
                slot.index,
                seriesElement
            );

            const ratio = Math.max(0, Math.min(1, (entry.value - domainMin) / span));
            const formattedValue = valueFormatter
                ? valueFormatter(entry.value, entry.dataIndex)
                : formatYValue(entry.value, entry.dataIndex);

            const visible = isDatumVisible(entry.itemId);
            const animationKey = `${seriesId}:rose:${entry.itemId}`;

            const item: PreparedRoseDatum = {
                animationKey,
                category: slot.category,
                categoryIndex: slot.index,
                categoryKey: slot.categoryKey,
                color,
                dataIndex: entry.dataIndex,
                datum: entry.datum,
                formattedCategory: slot.formattedCategory,
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
            domain: [domainMin, maxVal],
            hasValidData: allItems.length > 0,
            maxVal,
            visibleItems
        };
    }
}
