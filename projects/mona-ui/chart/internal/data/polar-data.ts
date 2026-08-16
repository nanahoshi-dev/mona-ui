import type { ChartPolarSeriesRegistration } from "../context/chart-registration-context";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { isFiniteNumber } from "../utils/number-utils";
import { resolveData, resolveValue } from "./chart-value-resolver";

export interface PolarDatum {
    category: unknown;
    color: string;
    dataIndex: number;
    datum: unknown;
    formattedCategory: string;
    formattedValue: string;
    paletteIndex: number;
    sliceId: string;
    value: number;
    visible: boolean;
}

export interface PolarDataResult {
    allData: readonly PolarDatum[];
    hasRenderableData: boolean;
    total: number;
    visibleData: readonly PolarDatum[];
    visibleTotal: number;
}

const DEFAULT_PERCENT_FORMATTER = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 1,
    style: "percent"
});

const DEFAULT_NUMBER_FORMATTER = new Intl.NumberFormat();

export function formatPolarPercentage(ratio: number): string {
    if (!isFiniteNumber(ratio)) {
        return "0%";
    }
    return DEFAULT_PERCENT_FORMATTER.format(ratio);
}

export function formatPolarValue(value: number): string {
    if (!isFiniteNumber(value)) {
        return "0";
    }
    return DEFAULT_NUMBER_FORMATTER.format(value);
}

export function preparePolarData(
    series: ChartPolarSeriesRegistration,
    rootData: readonly unknown[],
    styleResolver: ChartStyleResolver
): PolarDataResult {
    const rawData = resolveData(series.data(), rootData);
    const valueField = series.field();
    const categoryField = series.categoryField();
    const valueFormatter = series.valueFormatter();
    const categoryFormatter = series.categoryFormatter();
    const isSeriesVisible = series.visible();

    const allData: PolarDatum[] = [];
    let validPaletteIndex = 0;
    let total = 0;
    let visibleTotal = 0;

    for (let dataIndex = 0; dataIndex < rawData.length; dataIndex++) {
        const item = rawData[dataIndex];
        let val: unknown = resolveValue(item, valueField, dataIndex);

        if (val === undefined && isFiniteNumber(item)) {
            val = item;
        }

        if (!isFiniteNumber(val) || (val as number) <= 0) {
            continue;
        }

        const numVal = val as number;
        let cat = resolveValue(item, categoryField, dataIndex);
        if (cat === undefined || cat === null || cat === "") {
            cat = `Item ${dataIndex + 1}`;
        }

        const formattedCategory = categoryFormatter
            ? categoryFormatter(cat, dataIndex)
            : String(cat);

        const formattedValue = valueFormatter
            ? valueFormatter(numVal, dataIndex)
            : formatPolarValue(numVal);

        const paletteIndex = validPaletteIndex++;
        const sliceId = `${series.id}:slice:${dataIndex}`;
        const color = styleResolver.resolveSliceColor(series, item, dataIndex, paletteIndex);
        const isSliceVisible = isSeriesVisible && series.isSliceVisible(dataIndex);

        const polarDatum: PolarDatum = {
            category: cat,
            color,
            dataIndex,
            datum: item,
            formattedCategory,
            formattedValue,
            paletteIndex,
            sliceId,
            value: numVal,
            visible: isSliceVisible
        };

        allData.push(polarDatum);
        total += numVal;
        if (isSliceVisible) {
            visibleTotal += numVal;
        }
    }

    const visibleData = allData.filter(d => d.visible);
    const hasRenderable = isSeriesVisible && visibleData.length > 0 && visibleTotal > 0;

    return {
        allData,
        hasRenderableData: hasRenderable,
        total,
        visibleData,
        visibleTotal
    };
}
