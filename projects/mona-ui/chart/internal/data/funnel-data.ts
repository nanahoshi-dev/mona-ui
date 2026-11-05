import type { ChartField, ChartValueFormatter } from "../../models/chart.models";
import type {} from "../../models/chart-funnel.models";
import type { ChartLegendItem } from "../../models/chart-series.models";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { ChartDiagnostics } from "../utils/chart-diagnostics";
import { FunnelIdentity } from "./funnel-identity";
import { resolveNumericValue, resolveValue } from "./chart-value-resolver";
import { chartMessages, formatChartNumber, formatChartPercent } from "../utils/chart-locale";

export interface PreparedFunnelStage {
    readonly animationKey: string;
    readonly category: unknown;
    readonly color: string;
    readonly colorOverride?: string;
    readonly conversionRate?: number;
    readonly dataIndex: number;
    readonly datum: unknown;
    readonly dropOff?: number;
    readonly formattedCategory: string;
    readonly formattedConversionRate?: string;
    readonly formattedOverallConversionRate?: string;
    readonly formattedValue: string;
    readonly overallConversionRate?: number;
    readonly previousValue?: number;
    readonly sourceIndex: number;
    readonly stageId: string;
    readonly stageIndex: number;
    readonly value: number;
    readonly visible: boolean;
}

export interface PreparedFunnelData {
    readonly allStages: readonly PreparedFunnelStage[];
    readonly hasPositiveStage: boolean;
    readonly legendItems: readonly ChartLegendItem[];
    readonly maxValue: number;
    readonly sequenceSignature: string;
    readonly visibleStages: readonly PreparedFunnelStage[];
}

export interface FunnelDataOptions {
    readonly categoryField?: ChartField;
    readonly categoryFormatter?: ChartValueFormatter;
    readonly color?: string;
    readonly colorField?: ChartField;
    readonly colors?: readonly string[];
    readonly data?: readonly unknown[] | unknown;
    readonly field?: ChartField;
    readonly isDatumVisible: (itemId: string) => boolean;
    readonly keyField?: ChartField;
    readonly rootData?: readonly unknown[];
    readonly seriesElement?: HTMLElement;
    readonly seriesId: string;
    readonly seriesName: string;
    readonly styleResolver: ChartStyleResolver;
    readonly valueFormatter?: ChartValueFormatter;
    readonly warnedDiagnosticSignatures?: Set<string>;
}

/** Formats a conversion rate for the chart locale, with at most one decimal. */
export function formatFunnelPercentage(ratio: number): string {
    return formatChartPercent(ratio);
}

export class FunnelDataProcessor {
    public static process(options: FunnelDataOptions): PreparedFunnelData {
        const {
            categoryField = "category",
            categoryFormatter,
            color,
            colorField,
            colors,
            data,
            field = "value",
            isDatumVisible,
            keyField,
            rootData,
            seriesElement,
            seriesId,
            seriesName,
            styleResolver,
            valueFormatter,
            warnedDiagnosticSignatures
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
                allStages: [],
                hasPositiveStage: false,
                legendItems: [],
                maxValue: 0,
                sequenceSignature: JSON.stringify([]),
                visibleStages: []
            };
        }

        let seriesExplicitHostColor = "";
        if (typeof window !== "undefined" && seriesElement) {
            try {
                const userClass = seriesElement.className || "";
                const hasTextClass =
                    typeof userClass === "string" && (/\btext-/.test(userClass) || /\btext\[/.test(userClass));
                if (seriesElement.style?.color) {
                    seriesExplicitHostColor = styleResolver.resolveCssVariable(
                        seriesElement.style.color,
                        seriesElement
                    );
                } else if (hasTextClass) {
                    const computed = window.getComputedStyle(seriesElement);
                    if (computed.color && computed.color !== "rgba(0, 0, 0, 0)" && computed.color !== "transparent") {
                        seriesExplicitHostColor = styleResolver.resolveCssVariable(computed.color, seriesElement);
                    }
                }
            } catch {
                // Ignore style resolution errors
            }
        }

        const seenExplicitKeys = new Set<string>();
        const allStages: PreparedFunnelStage[] = [];
        let hasNegative = false;
        let hasInvalid = false;

        for (let i = 0; i < rawData.length; i++) {
            const datum = rawData[i];
            const rawVal = resolveNumericValue(datum, field, i);

            if (typeof rawVal === "number" && Number.isFinite(rawVal) && rawVal < 0) {
                hasNegative = true;
            } else if (
                rawVal !== null &&
                rawVal !== undefined &&
                !(typeof rawVal === "number" && Number.isFinite(rawVal))
            ) {
                hasInvalid = true;
            }

            if (!FunnelIdentity.isValidFunnelValue(rawVal)) {
                continue;
            }

            const numVal = rawVal;
            const rawCat = resolveValue(datum, categoryField, i);
            const formattedCategory = categoryFormatter
                ? categoryFormatter(rawCat, i)
                : rawCat !== undefined && rawCat !== null
                  ? String(rawCat)
                  : chartMessages().stageFallbackName(i + 1);

            const identity = FunnelIdentity.resolveStageIdentity(
                datum,
                i,
                seriesId,
                keyField,
                seenExplicitKeys,
                warnedDiagnosticSignatures,
                seriesName
            );

            const stageId = identity.stageId;
            const animationKey = identity.animationKey;
            const visible = isDatumVisible(stageId);

            let stageColor = "";
            let colorOverride: string | undefined;

            if (colorField) {
                const rawCol = resolveValue(datum, colorField, i);
                if (typeof rawCol === "string" && rawCol.length > 0) {
                    const resolved = styleResolver.resolveCssVariable(rawCol, seriesElement);
                    if (resolved) {
                        colorOverride = resolved;
                    }
                }
            }

            if (colorOverride) {
                stageColor = colorOverride;
            } else if (colors && colors.length > 0) {
                const rawCol = colors[i % colors.length];
                if (rawCol) {
                    stageColor = styleResolver.resolveCssVariable(rawCol, seriesElement);
                }
            }

            if (!stageColor && color && color.trim().length > 0) {
                stageColor = styleResolver.resolveCssVariable(color, seriesElement);
            }
            if (!stageColor && seriesExplicitHostColor) {
                stageColor = seriesExplicitHostColor;
            }
            if (!stageColor) {
                stageColor = styleResolver.resolvePaletteColor(i);
            }

            const formattedValue = valueFormatter ? valueFormatter(numVal, i) : formatChartNumber(numVal);

            allStages.push({
                animationKey,
                category: rawCat,
                color: stageColor,
                colorOverride,
                dataIndex: i,
                datum,
                formattedCategory,
                formattedValue,
                sourceIndex: i,
                stageId,
                stageIndex: allStages.length,
                value: numVal,
                visible
            });
        }

        if (hasNegative && warnedDiagnosticSignatures) {
            ChartDiagnostics.warnOnce(
                warnedDiagnosticSignatures,
                `Funnel series "${seriesName}" encountered negative values. Negative values are omitted.`,
                `${seriesId}:negative-values`
            );
        }
        if (hasInvalid && warnedDiagnosticSignatures) {
            ChartDiagnostics.warnOnce(
                warnedDiagnosticSignatures,
                `Funnel series "${seriesName}" has values that aren't finite numbers (NaN, Infinity, or text that isn't a number). Those stages are left out.`,
                `${seriesId}:invalid-values`
            );
        }
        if (warnedDiagnosticSignatures && allStages.length > 0 && allStages.every(stage => stage.value === 0)) {
            ChartDiagnostics.warnOnce(
                warnedDiagnosticSignatures,
                `Funnel series "${seriesName}" has no values above zero, so nothing is drawn.`,
                `${seriesId}:no-positive-values`
            );
        }

        const visibleStagesRaw = allStages.filter(s => s.visible);
        const firstVisibleValue = visibleStagesRaw.length > 0 ? visibleStagesRaw[0].value : 0;
        let maxValue = 0;
        let hasPositiveStage = false;

        const visibleStages: PreparedFunnelStage[] = [];

        for (let vIdx = 0; vIdx < visibleStagesRaw.length; vIdx++) {
            const rawStage = visibleStagesRaw[vIdx];
            if (rawStage.value > maxValue) {
                maxValue = rawStage.value;
            }
            if (rawStage.value > 0) {
                hasPositiveStage = true;
            }

            const previousValue = vIdx > 0 ? visibleStagesRaw[vIdx - 1].value : undefined;
            const conversionRate =
                previousValue !== undefined && previousValue > 0 ? rawStage.value / previousValue : undefined;
            const overallConversionRate = firstVisibleValue > 0 ? rawStage.value / firstVisibleValue : undefined;
            const dropOff = previousValue !== undefined ? previousValue - rawStage.value : undefined;

            const formattedConversionRate =
                conversionRate !== undefined ? formatFunnelPercentage(conversionRate) : undefined;
            const formattedOverallConversionRate =
                overallConversionRate !== undefined ? formatFunnelPercentage(overallConversionRate) : undefined;

            visibleStages.push({
                ...rawStage,
                conversionRate,
                dropOff,
                formattedConversionRate,
                formattedOverallConversionRate,
                overallConversionRate,
                previousValue,
                stageIndex: vIdx
            });
        }

        const legendItems: ChartLegendItem[] = allStages.map(s => ({
            color: s.colorOverride ?? s.color,
            dataIndex: s.dataIndex,
            datum: s.datum,
            interactive: true,
            itemId: s.stageId,
            kind: "datum",
            name: s.formattedCategory,
            seriesId,
            seriesType: "funnel",
            value: s.value,
            visible: s.visible
        }));

        const sequenceSignature = JSON.stringify(visibleStages.map(s => s.animationKey));

        return {
            allStages,
            hasPositiveStage,
            legendItems,
            maxValue,
            sequenceSignature,
            visibleStages
        };
    }
}
