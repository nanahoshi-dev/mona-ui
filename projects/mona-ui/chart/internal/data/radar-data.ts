import { isDevMode } from "@angular/core";
import type { ChartRadarSeriesRegistration } from "../context/chart-registration-context";
import type { ChartAxisFormatter } from "../../models/chart-axis.models";
import { isFiniteNumber } from "../utils/number-utils";
import { resolveData, resolveValue } from "./chart-value-resolver";

const warnedSignatures = new Set<string>();

function warnOnce(signature: string, message: string): void {
    if (isDevMode() && !warnedSignatures.has(signature)) {
        warnedSignatures.add(signature);
        console.warn(message);
    }
}

export interface RadarDatumPoint {
    category: unknown;
    categoryKey: string;
    dataIndex: number;
    datum: unknown;
    defined: boolean;
    formattedCategory: string;
    formattedValue: string;
    value: number;
}

export interface RadarSeriesData {
    allValues: readonly number[];
    definedPoints: readonly RadarDatumPoint[];
    hasRenderableData: boolean;
    points: readonly RadarDatumPoint[];
    series: ChartRadarSeriesRegistration;
}

export interface RadarCategoryItem {
    formatted: string;
    key: string;
    raw: unknown;
}

export interface RadarDataResult {
    allValues: readonly number[];
    categories: readonly RadarCategoryItem[];
    hasRenderableData: boolean;
    seriesList: readonly RadarSeriesData[];
}

const DEFAULT_NUMBER_FORMATTER = new Intl.NumberFormat();

export function formatRadarValue(value: number): string {
    if (!isFiniteNumber(value)) {
        return "0";
    }
    return DEFAULT_NUMBER_FORMATTER.format(value);
}

export function prepareRadarData(
    seriesList: readonly ChartRadarSeriesRegistration[],
    rootData: readonly unknown[],
    angularFormatter?: ChartAxisFormatter
): RadarDataResult {
    // 1. Build unified category domain in first-seen order across visible series (fallback to all series if none visible)
    const categoryMap = new Map<string, { formatted: string; index: number; raw: unknown }>();
    const seriesDataEntries: {
        allValues: number[];
        pointsByCategory: Map<string, RadarDatumPoint>;
        series: ChartRadarSeriesRegistration;
    }[] = [];

    const targetSeriesList = seriesList;

    for (const series of targetSeriesList) {
        const rawData = resolveData(series.data(), rootData);
        const valueField = series.field();
        const categoryField = series.categoryField();
        const valueFormatter = series.valueFormatter();
        const pointsByCategory = new Map<string, RadarDatumPoint>();
        const allValues: number[] = [];
        const seenCategories = new Set<string>();

        for (let dataIndex = 0; dataIndex < rawData.length; dataIndex++) {
            const item = rawData[dataIndex];
            let rawCat = resolveValue(item, categoryField, dataIndex);
            if (rawCat === undefined || rawCat === null || rawCat === "") {
                rawCat = `Category ${dataIndex + 1}`;
            }
            const categoryKey = String(rawCat);

            if (seenCategories.has(categoryKey)) {
                warnOnce(
                    `radar-duplicate-category:${series.id}:${categoryKey}`,
                    `[MonaChart] Duplicate category "${categoryKey}" detected in radar series "${series.name()}". The first occurrence was used.`
                );
                continue;
            }
            seenCategories.add(categoryKey);

            if (!categoryMap.has(categoryKey)) {
                const formatted = angularFormatter
                    ? angularFormatter(rawCat, categoryMap.size)
                    : String(rawCat);
                categoryMap.set(categoryKey, {
                    formatted,
                    index: categoryMap.size,
                    raw: rawCat
                });
            }

            let val = resolveValue(item, valueField, dataIndex);
            if (val === undefined && isFiniteNumber(item)) {
                val = item;
            }

            const defined = isFiniteNumber(val);
            const numVal = defined ? (val as number) : 0;
            if (defined) {
                allValues.push(numVal);
            }

            const catInfo = categoryMap.get(categoryKey)!;
            const formattedVal = defined
                ? valueFormatter
                    ? valueFormatter(numVal, dataIndex)
                    : formatRadarValue(numVal)
                : "";

            const point: RadarDatumPoint = {
                category: rawCat,
                categoryKey,
                dataIndex,
                datum: item,
                defined,
                formattedCategory: catInfo.formatted,
                formattedValue: formattedVal,
                value: numVal
            };

            pointsByCategory.set(categoryKey, point);
        }

        seriesDataEntries.push({
            allValues,
            pointsByCategory,
            series
        });
    }

    const categories: RadarCategoryItem[] = Array.from(categoryMap.entries()).map(([key, info]) => ({
        formatted: info.formatted,
        key,
        raw: info.raw
    }));

    const allValuesAcrossAllSeries: number[] = [];
    const preparedSeriesList: RadarSeriesData[] = [];

    for (const entry of seriesDataEntries) {
        const { series, pointsByCategory, allValues } = entry;
        const isVisible = series.visible();
        const points: RadarDatumPoint[] = [];
        const definedPoints: RadarDatumPoint[] = [];

        for (const cat of categories) {
            const existing = pointsByCategory.get(cat.key);
            if (existing && existing.defined) {
                points.push(existing);
                definedPoints.push(existing);
            } else {
                points.push({
                    category: cat.raw,
                    categoryKey: cat.key,
                    dataIndex: existing ? existing.dataIndex : -1,
                    datum: existing ? existing.datum : null,
                    defined: false,
                    formattedCategory: cat.formatted,
                    formattedValue: "",
                    value: 0
                });
            }
        }

        if (isVisible) {
            allValuesAcrossAllSeries.push(...allValues);
        }

        const hasRenderable = isVisible && definedPoints.length >= 2;

        preparedSeriesList.push({
            allValues,
            definedPoints,
            hasRenderableData: hasRenderable,
            points,
            series
        });
    }

    const overallHasRenderable = preparedSeriesList.some(s => s.hasRenderableData);

    return {
        allValues: allValuesAcrossAllSeries,
        categories,
        hasRenderableData: overallHasRenderable,
        seriesList: preparedSeriesList
    };
}
