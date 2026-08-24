import { isDevMode } from "@angular/core";
import type { ChartField } from "../../models/chart.models";
import type { ChartHeatmapCategory } from "../../models/chart-heatmap.models";
import { resolveValue } from "./chart-value-resolver";
import { isFiniteNumber } from "../utils/number-utils";

export type ChartCategoryKey = string;

export function toCategoryKey(value: unknown): ChartCategoryKey | null {
    if (value === null || value === undefined) {
        return null;
    }
    if (typeof value === "string") {
        return `s:${value}`;
    }
    if (typeof value === "number") {
        return isFiniteNumber(value) ? `n:${value}` : null;
    }
    if (typeof value === "boolean") {
        return `b:${value ? 1 : 0}`;
    }
    if (value instanceof Date) {
        const time = value.getTime();
        return Number.isNaN(time) ? null : `d:${time}`;
    }
    return null;
}

export function toFormattedCategoryValue(value: unknown): string {
    if (value === null || value === undefined) {
        return "";
    }
    if (value instanceof Date) {
        return value.toLocaleDateString();
    }
    return String(value);
}

export interface ResolvedHeatmapDatum {
    readonly animationKey: string;
    readonly dataIndex: number;
    readonly datum: unknown;
    readonly value: number;
    readonly xKey: ChartCategoryKey;
    readonly xValue: unknown;
    readonly yKey: ChartCategoryKey;
    readonly yValue: unknown;
}

export interface ResolvedHeatmapMatrix {
    readonly cellCount: number;
    readonly cells: readonly ResolvedHeatmapDatum[];
    readonly hasData: boolean;
    readonly valueDomain: readonly [number, number];
    readonly xCategories: readonly ChartHeatmapCategory[];
    readonly yCategories: readonly ChartHeatmapCategory[];
}

export interface HeatmapDataResolutionOptions {
    readonly data: readonly unknown[];
    readonly field: ChartField;
    readonly keyField?: ChartField;
    readonly max?: number;
    readonly min?: number;
    readonly rootXField?: ChartField;
    readonly seriesId: string;
    readonly seriesName: string;
    readonly warnedDiagnosticSignatures?: Set<string>;
    readonly xCategories?: readonly unknown[];
    readonly xField?: ChartField;
    readonly yCategories?: readonly unknown[];
    readonly yField: ChartField;
}

const defaultWarnedSignatures = new Set<string>();

function warnOnce(signature: string, message: string, warnedSet: Set<string> = defaultWarnedSignatures): void {
    if (isDevMode() && !warnedSet.has(signature)) {
        warnedSet.add(signature);
        console.warn(message);
    }
}

export class HeatmapDataResolver {
    public static resolve(options: HeatmapDataResolutionOptions): ResolvedHeatmapMatrix {
        const {
            data,
            field,
            keyField,
            max: explicitMax,
            min: explicitMin,
            rootXField,
            seriesId,
            seriesName,
            warnedDiagnosticSignatures = defaultWarnedSignatures,
            xCategories: explicitXCategories,
            xField: explicitXField,
            yCategories: explicitYCategories,
            yField
        } = options;

        const effectiveXField = explicitXField ?? rootXField;

        // 1. Resolve X categories
        const xCategoryMap = new Map<ChartCategoryKey, ChartHeatmapCategory>();
        const xCategoryList: ChartHeatmapCategory[] = [];

        if (explicitXCategories && explicitXCategories.length > 0) {
            for (const item of explicitXCategories) {
                const key = toCategoryKey(item);
                if (key !== null && !xCategoryMap.has(key)) {
                    const cat: ChartHeatmapCategory = {
                        formattedValue: toFormattedCategoryValue(item),
                        index: xCategoryList.length,
                        key,
                        value: item
                    };
                    xCategoryMap.set(key, cat);
                    xCategoryList.push(cat);
                }
            }
        }

        // 2. Resolve Y categories
        const yCategoryMap = new Map<ChartCategoryKey, ChartHeatmapCategory>();
        const yCategoryList: ChartHeatmapCategory[] = [];

        if (explicitYCategories && explicitYCategories.length > 0) {
            for (const item of explicitYCategories) {
                const key = toCategoryKey(item);
                if (key !== null && !yCategoryMap.has(key)) {
                    const cat: ChartHeatmapCategory = {
                        formattedValue: toFormattedCategoryValue(item),
                        index: yCategoryList.length,
                        key,
                        value: item
                    };
                    yCategoryMap.set(key, cat);
                    yCategoryList.push(cat);
                }
            }
        }

        // 3. Scan rows to append unobserved categories and resolve valid finite cells
        const validCells: ResolvedHeatmapDatum[] = [];
        const seenCellKeys = new Set<string>();

        let observedMin: number | undefined;
        let observedMax: number | undefined;

        for (let i = 0; i < data.length; i++) {
            const datum = data[i];
            const rawX = resolveValue(datum, effectiveXField, i);
            const rawY = resolveValue(datum, yField, i);

            const xKey = toCategoryKey(rawX);
            const yKey = toCategoryKey(rawY);

            // Valid category keys contribute to structural domains even if value is invalid
            if (xKey !== null && !xCategoryMap.has(xKey)) {
                const cat: ChartHeatmapCategory = {
                    formattedValue: toFormattedCategoryValue(rawX),
                    index: xCategoryList.length,
                    key: xKey,
                    value: rawX
                };
                xCategoryMap.set(xKey, cat);
                xCategoryList.push(cat);
            }

            if (yKey !== null && !yCategoryMap.has(yKey)) {
                const cat: ChartHeatmapCategory = {
                    formattedValue: toFormattedCategoryValue(rawY),
                    index: yCategoryList.length,
                    key: yKey,
                    value: rawY
                };
                yCategoryMap.set(yKey, cat);
                yCategoryList.push(cat);
            }

            // Check if coordinates are valid for a cell
            if (xKey === null || yKey === null) {
                continue;
            }

            const rawVal = resolveValue(datum, field, i);
            if (rawVal === undefined || rawVal === null || typeof rawVal !== "number" || !isFiniteNumber(rawVal)) {
                continue;
            }

            const cellKey = `${xKey}::${yKey}`;
            if (seenCellKeys.has(cellKey)) {
                const diagSig = `duplicate-heatmap-cell-${seriesId}-${xKey}-${yKey}`;
                warnOnce(
                    diagSig,
                    `[MonaChart] Duplicate heatmap cell at X "${toFormattedCategoryValue(rawX)}" and Y "${toFormattedCategoryValue(rawY)}" in series "${seriesName}" (data index ${i}). First valid datum is retained.`,
                    warnedDiagnosticSignatures
                );
                continue;
            }
            seenCellKeys.add(cellKey);

            if (observedMin === undefined || rawVal < observedMin) {
                observedMin = rawVal;
            }
            if (observedMax === undefined || rawVal > observedMax) {
                observedMax = rawVal;
            }

            const customKey = keyField ? resolveValue<string>(datum, keyField, i) : undefined;
            const animationKey =
                customKey !== undefined && customKey !== null && String(customKey).length > 0
                    ? `${seriesId}:heat:${String(customKey)}:${xKey}:${yKey}`
                    : `${seriesId}:heat:${xKey}:${yKey}`;

            validCells.push({
                animationKey,
                dataIndex: i,
                datum,
                value: rawVal,
                xKey,
                xValue: rawX,
                yKey,
                yValue: rawY
            });
        }

        // 4. Compute value domain
        let finalMin = 0;
        let finalMax = 1;

        const hasExplicitMin = explicitMin !== undefined && isFiniteNumber(explicitMin);
        const hasExplicitMax = explicitMax !== undefined && isFiniteNumber(explicitMax);

        if (hasExplicitMin && hasExplicitMax) {
            finalMin = Math.min(explicitMin, explicitMax);
            finalMax = Math.max(explicitMin, explicitMax);
        } else if (hasExplicitMin) {
            finalMin = explicitMin;
            finalMax = observedMax !== undefined ? Math.max(explicitMin, observedMax) : explicitMin + 1;
        } else if (hasExplicitMax) {
            finalMax = explicitMax;
            finalMin = observedMin !== undefined ? Math.min(explicitMax, observedMin) : explicitMax - 1;
        } else if (observedMin !== undefined && observedMax !== undefined) {
            finalMin = observedMin;
            finalMax = observedMax;
        }

        return {
            cellCount: validCells.length,
            cells: validCells,
            hasData: validCells.length > 0,
            valueDomain: [finalMin, finalMax],
            xCategories: xCategoryList,
            yCategories: yCategoryList
        };
    }
}
