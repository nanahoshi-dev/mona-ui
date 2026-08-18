import type { ChartField, ChartValueFormatter } from "../../models/chart.models";
import type { ChartLegendItem } from "../../models/chart-series.models";
import type { ChartWaterfallDatumKind, ChartWaterfallVisualKind } from "../../models/chart-waterfall.models";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import type { ChartWaterfallSeriesStyle } from "../scene/waterfall-scene";
import { resolveValue } from "./chart-value-resolver";
import { isFiniteNumber } from "../utils/number-utils";

export interface PreparedWaterfallPoint {
    readonly animationKey: string;
    readonly barEnd: number;
    readonly barStart: number;
    readonly category: unknown;
    readonly color: string;
    readonly cumulativeAfter: number;
    readonly cumulativeBefore: number;
    readonly dataIndex: number;
    readonly datum: unknown;
    readonly deltaValue?: number;
    readonly formattedCategory: string;
    readonly formattedCumulativeAfter: string;
    readonly formattedCumulativeBefore: string;
    readonly formattedDelta?: string;
    readonly formattedValue: string;
    readonly isZeroChange: boolean;
    readonly itemId: string;
    readonly kind: ChartWaterfallDatumKind;
    readonly rawValue: number;
    readonly value: number;
    readonly visualKind: ChartWaterfallVisualKind;
}

export interface PreparedWaterfallData {
    readonly categories: readonly unknown[];
    readonly hasRenderableData: boolean;
    readonly kindSignature: string;
    readonly legendItems: readonly ChartLegendItem[];
    readonly maxY: number;
    readonly minY: number;
    readonly points: readonly PreparedWaterfallPoint[];
    readonly sequenceSignature: string;
}

export interface WaterfallDataOptions {
    readonly data?: readonly unknown[] | unknown;
    readonly field?: ChartField;
    readonly isDatumVisible?: (kind: string) => boolean;
    readonly kindField?: ChartField;
    readonly rootData?: readonly unknown[];
    readonly seriesElement?: HTMLElement;
    readonly seriesId: string;
    readonly seriesName: string;
    readonly startValue?: number;
    readonly style: ChartWaterfallSeriesStyle;
    readonly styleResolver: ChartStyleResolver;
    readonly valueFormatter?: ChartValueFormatter;
    readonly xField?: ChartField;
}

export class WaterfallDataProcessor {
    public static process(options: WaterfallDataOptions): PreparedWaterfallData {
        const {
            data,
            field = "value",
            isDatumVisible,
            kindField = "kind",
            rootData,
            seriesId,
            seriesName,
            startValue = 0,
            style,
            valueFormatter,
            xField = "category"
        } = options;

        let rawData: readonly unknown[];
        if (data !== undefined && data !== null) {
            rawData = Array.isArray(data) ? data : [data];
        } else if (Array.isArray(rootData) && rootData.length > 0) {
            rawData = rootData;
        } else if (rootData !== undefined && rootData !== null) {
            rawData = [rootData];
        } else {
            rawData = [];
        }

        if (rawData.length === 0) {
            return {
                categories: [],
                hasRenderableData: false,
                kindSignature: "",
                legendItems: [],
                maxY: 0,
                minY: 0,
                points: [],
                sequenceSignature: JSON.stringify([])
            };
        }

        let runningTotal = isFiniteNumber(startValue) ? startValue : 0;
        let minY = Math.min(0, runningTotal);
        let maxY = Math.max(0, runningTotal);

        const points: PreparedWaterfallPoint[] = [];
        const usedVisualKinds = new Set<ChartWaterfallVisualKind>();
        const categories: unknown[] = [];

        for (let i = 0; i < rawData.length; i++) {
            const datum = rawData[i];
            const rawVal = resolveValue(datum, field, i);
            const numVal = typeof rawVal === "number" && isFiniteNumber(rawVal) ? rawVal : 0;

            const rawCat = resolveValue(datum, xField, i);
            const formattedCategory = rawCat !== undefined && rawCat !== null ? String(rawCat) : `Step ${i + 1}`;
            categories.push(rawCat ?? formattedCategory);

            const rawKind = resolveValue(datum, kindField, i);
            let kind: ChartWaterfallDatumKind = "change";
            if (typeof rawKind === "string") {
                const lower = rawKind.toLowerCase().trim();
                if (lower === "subtotal") {
                    kind = "subtotal";
                } else if (lower === "total") {
                    kind = "total";
                }
            }

            let barStart: number;
            let barEnd: number;
            let cumulativeBefore: number;
            let cumulativeAfter: number;
            let deltaValue: number | undefined;
            let visualKind: ChartWaterfallVisualKind;
            let color: string;

            if (kind === "subtotal") {
                cumulativeBefore = runningTotal;
                cumulativeAfter = runningTotal;
                barStart = 0;
                barEnd = runningTotal;
                visualKind = "subtotal";
                color = style.subtotalColor;
            } else if (kind === "total") {
                cumulativeBefore = runningTotal;
                cumulativeAfter = runningTotal;
                barStart = 0;
                barEnd = runningTotal;
                visualKind = "total";
                color = style.totalColor;
            } else {
                deltaValue = numVal;
                cumulativeBefore = runningTotal;
                runningTotal += deltaValue;
                cumulativeAfter = runningTotal;
                barStart = cumulativeBefore;
                barEnd = cumulativeAfter;

                if (deltaValue > 0) {
                    visualKind = "increase";
                    color = style.increaseColor;
                } else if (deltaValue < 0) {
                    visualKind = "decrease";
                    color = style.decreaseColor;
                } else {
                    visualKind = "neutral";
                    color = style.neutralColor;
                }
            }

            usedVisualKinds.add(visualKind);

            minY = Math.min(minY, barStart, barEnd);
            maxY = Math.max(maxY, barStart, barEnd);

            const isZeroChange = kind === "change" && deltaValue === 0;

            const formattedValue = valueFormatter ? valueFormatter(barEnd, i) : String(barEnd);
            const formattedDelta = deltaValue !== undefined
                ? (valueFormatter ? valueFormatter(deltaValue, i) : `${deltaValue >= 0 ? "+" : ""}${deltaValue}`)
                : undefined;
            const formattedCumulativeBefore = valueFormatter ? valueFormatter(cumulativeBefore, i) : String(cumulativeBefore);
            const formattedCumulativeAfter = valueFormatter ? valueFormatter(cumulativeAfter, i) : String(cumulativeAfter);

            const itemId = `w:${i}`;
            const animationKey = `${seriesId}:waterfall:${itemId}`;

            points.push({
                animationKey,
                barEnd,
                barStart,
                category: rawCat,
                color,
                cumulativeAfter,
                cumulativeBefore,
                dataIndex: i,
                datum,
                deltaValue,
                formattedCategory,
                formattedCumulativeAfter,
                formattedCumulativeBefore,
                formattedDelta,
                formattedValue,
                isZeroChange,
                itemId,
                kind,
                rawValue: numVal,
                value: kind === "change" ? (deltaValue ?? 0) : barEnd,
                visualKind
            });
        }

        const kindSignature = points.map(p => `${p.kind}:${p.visualKind}`).join(";");
        const sequenceSignature = JSON.stringify(points.map(p => p.animationKey));

        const KIND_NAMES: Record<ChartWaterfallVisualKind, string> = {
            decrease: "Decrease",
            increase: "Increase",
            neutral: "No Change",
            subtotal: "Subtotal",
            total: "Total"
        };
        const KIND_COLORS: Record<ChartWaterfallVisualKind, string> = {
            decrease: style.decreaseColor,
            increase: style.increaseColor,
            neutral: style.neutralColor,
            subtotal: style.subtotalColor,
            total: style.totalColor
        };

        const legendItems: ChartLegendItem[] = [];
        const kindOrder: readonly ChartWaterfallVisualKind[] = ["increase", "decrease", "subtotal", "total", "neutral"];
        for (const k of kindOrder) {
            if (usedVisualKinds.has(k)) {
                const isVisible = isDatumVisible ? isDatumVisible(k) : true;
                legendItems.push({
                    color: KIND_COLORS[k],
                    itemId: k,
                    kind: "datum",
                    name: KIND_NAMES[k],
                    seriesId,
                    seriesType: "waterfall",
                    visible: isVisible
                });
            }
        }

        return {
            categories,
            hasRenderableData: points.length > 0,
            kindSignature,
            legendItems,
            maxY,
            minY,
            points,
            sequenceSignature
        };
    }
}
