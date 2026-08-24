import type { ChartField, ChartValueFormatter } from "../../models/chart.models";
import type { ChartLegendItem } from "../../models/chart-series.models";
import type { ChartWaterfallDatumKind, ChartWaterfallVisualKind } from "../../models/chart-waterfall.models";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import type { ChartWaterfallSeriesStyle } from "../scene/waterfall-scene";
import { ChartDiagnostics } from "../utils/chart-diagnostics";
import { serializeKeyPart } from "../animation/animation-identity";
import { resolveValue } from "./chart-value-resolver";

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
    readonly slotKey: string;
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
    readonly keyField?: ChartField;
    readonly kindField?: ChartField;
    readonly rootData?: readonly unknown[];
    readonly rootXField?: ChartField;
    readonly seriesElement?: HTMLElement;
    readonly seriesId: string;
    readonly seriesName: string;
    readonly startValue?: number;
    readonly style: ChartWaterfallSeriesStyle;
    readonly styleResolver: ChartStyleResolver;
    readonly valueFormatter?: ChartValueFormatter;
    readonly warnedDiagnosticSignatures?: Set<string>;
    readonly xField?: ChartField;
}

export class WaterfallDataProcessor {
    public static process(options: WaterfallDataOptions): PreparedWaterfallData {
        const {
            data,
            field = "value",
            keyField,
            kindField = "kind",
            rootData,
            rootXField,
            seriesId,
            seriesName,
            startValue = 0,
            style,
            valueFormatter,
            warnedDiagnosticSignatures,
            xField
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

        let runningTotal = 0;
        if (typeof startValue === "number" && Number.isFinite(startValue)) {
            runningTotal = startValue;
        } else if (startValue !== undefined) {
            if (warnedDiagnosticSignatures) {
                ChartDiagnostics.warnOnce(
                    warnedDiagnosticSignatures,
                    `Waterfall series "${seriesName}" received non-finite startValue "${String(startValue)}". Normalizing to 0.`,
                    `${seriesId}:invalid-startValue`
                );
            }
        }

        let minY = runningTotal;
        let maxY = runningTotal;
        let hasInitializedMinMax = false;

        const points: PreparedWaterfallPoint[] = [];
        const usedVisualKinds = new Set<ChartWaterfallVisualKind>();
        const categories: unknown[] = [];
        const seenExplicitKeys = new Set<string>();

        const effectiveXField = xField ?? rootXField;

        for (let i = 0; i < rawData.length; i++) {
            const datum = rawData[i];

            // 1. Resolve kind
            const rawKind = kindField ? resolveValue(datum, kindField, i) : undefined;
            let kind: ChartWaterfallDatumKind = "change";
            if (rawKind !== undefined && rawKind !== null && rawKind !== "") {
                const kindStr = String(rawKind).toLowerCase().trim();
                if (kindStr === "subtotal") {
                    kind = "subtotal";
                } else if (kindStr === "total") {
                    kind = "total";
                } else if (kindStr === "change") {
                    kind = "change";
                } else {
                    if (warnedDiagnosticSignatures) {
                        ChartDiagnostics.warnOnce(
                            warnedDiagnosticSignatures,
                            `Waterfall series "${seriesName}" encountered unknown step kind "${String(rawKind)}" at index ${i}. Treating as "change".`,
                            `${seriesId}:unknown-kind`
                        );
                    }
                    kind = "change";
                }
            }

            // 2. Validate value for change rows
            let numVal: number | undefined;
            if (kind === "change") {
                const rawVal = resolveValue(datum, field, i);
                if (typeof rawVal === "number" && Number.isFinite(rawVal)) {
                    numVal = rawVal;
                } else {
                    // Invalid change row is omitted
                    continue;
                }
            }

            // 3. Resolve identity (itemId, animationKey, slotKey)
            let explicitKey: string | undefined;
            if (keyField) {
                const rawKey = resolveValue(datum, keyField, i);
                const keyPart = serializeKeyPart(rawKey);
                if (keyPart !== null) {
                    const keyStr = `k:${keyPart.type}:${String(keyPart.value)}`;
                    if (seenExplicitKeys.has(keyStr)) {
                        if (warnedDiagnosticSignatures) {
                            ChartDiagnostics.warnOnce(
                                warnedDiagnosticSignatures,
                                `Waterfall series "${seriesName}" encountered duplicate explicit key "${String(rawKey)}" at index ${i}. Falling back to index identity.`,
                                `${seriesId}:duplicate-keys`
                            );
                        }
                    } else {
                        seenExplicitKeys.add(keyStr);
                        explicitKey = keyStr;
                    }
                }
            }
            const itemId = explicitKey ?? `i:${i}`;
            const animationKey = `${seriesId}:waterfall:${itemId}`;
            const slotKey = `${seriesId}:slot:${itemId}`;

            // 4. Resolve category
            const rawCat = effectiveXField !== undefined ? resolveValue(datum, effectiveXField, i) : undefined;
            const formattedCategory = rawCat !== undefined && rawCat !== null ? String(rawCat) : `Step ${i + 1}`;
            categories.push(rawCat ?? formattedCategory);

            // 5. Cumulative calculations
            let barStart: number;
            let barEnd: number;
            let cumulativeBefore: number;
            let cumulativeAfter: number;
            let deltaValue: number | undefined;
            let visualKind: ChartWaterfallVisualKind;
            let color: string;
            let primaryValue: number;

            if (kind === "subtotal") {
                cumulativeBefore = runningTotal;
                cumulativeAfter = runningTotal;
                barStart = 0;
                barEnd = runningTotal;
                visualKind = "subtotal";
                color = style.subtotalColor;
                primaryValue = runningTotal;
            } else if (kind === "total") {
                cumulativeBefore = runningTotal;
                cumulativeAfter = runningTotal;
                barStart = 0;
                barEnd = runningTotal;
                visualKind = "total";
                color = style.totalColor;
                primaryValue = runningTotal;
            } else {
                deltaValue = numVal!;
                cumulativeBefore = runningTotal;
                runningTotal += deltaValue;
                cumulativeAfter = runningTotal;
                barStart = cumulativeBefore;
                barEnd = cumulativeAfter;
                primaryValue = deltaValue;

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

            if (!hasInitializedMinMax) {
                minY = Math.min(barStart, barEnd);
                maxY = Math.max(barStart, barEnd);
                hasInitializedMinMax = true;
            } else {
                minY = Math.min(minY, barStart, barEnd);
                maxY = Math.max(maxY, barStart, barEnd);
            }

            const isZeroChange = kind === "change" && deltaValue === 0;

            const formattedValue = valueFormatter
                ? valueFormatter(primaryValue, i)
                : (kind === "change" && deltaValue !== undefined)
                  ? `${deltaValue >= 0 ? "+" : ""}${deltaValue}`
                  : String(primaryValue);

            const formattedDelta = kind === "change" && deltaValue !== undefined
                ? (valueFormatter ? valueFormatter(deltaValue, i) : `${deltaValue >= 0 ? "+" : ""}${deltaValue}`)
                : undefined;

            const formattedCumulativeBefore = valueFormatter ? valueFormatter(cumulativeBefore, i) : String(cumulativeBefore);
            const formattedCumulativeAfter = valueFormatter ? valueFormatter(cumulativeAfter, i) : String(cumulativeAfter);

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
                rawValue: primaryValue,
                slotKey,
                value: primaryValue,
                visualKind
            });
        }

        if (!hasInitializedMinMax) {
            minY = 0;
            maxY = 0;
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
        const kindOrder: readonly ChartWaterfallVisualKind[] = ["increase", "decrease", "neutral", "subtotal", "total"];
        for (const k of kindOrder) {
            if (usedVisualKinds.has(k)) {
                legendItems.push({
                    color: KIND_COLORS[k],
                    interactive: false,
                    itemId: k,
                    kind: "semantic",
                    name: KIND_NAMES[k],
                    seriesId,
                    seriesType: "waterfall",
                    visible: true
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
