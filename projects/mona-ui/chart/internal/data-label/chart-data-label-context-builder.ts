import type { ChartDataLabelContext } from "../../models/chart-data-label.models";
import type { NormalizedChartDataLabelOptions } from "./chart-data-label-options";
import type { SceneHitTarget } from "../scene/scene-geometry";
import { ChartMarkIdentityResolver } from "../interaction/chart-mark-identity-resolver";

export class ChartDataLabelContextBuilder {
    public static buildContext<T = unknown>(
        hit: SceneHitTarget,
        selected: boolean = false
    ): ChartDataLabelContext<T> {
        const markId = ChartMarkIdentityResolver.resolve(hit);
        const fromValue = hit.fromValue ?? hit.range?.fromValue;
        const toValue = hit.toValue ?? hit.range?.toValue;
        const formattedFrom = hit.formattedFrom ?? hit.range?.formattedFrom;
        const formattedTo = hit.formattedTo ?? hit.range?.formattedTo;
        const isRange = hit.valueKind === "range" || hit.range !== undefined;

        const value =
            hit.value ??
            (isRange && fromValue !== undefined && toValue !== undefined
                ? [fromValue, toValue]
                : (hit.hierarchy?.aggregateValue ?? hit.yValue));

        const formattedX =
            hit.formattedXValue ??
            hit.formattedCategory ??
            (hit.xValue !== undefined && hit.xValue !== null ? String(hit.xValue) : "");

        const formattedY =
            hit.formattedValue ??
            (isRange && formattedFrom && formattedTo
                ? `${formattedFrom} – ${formattedTo}`
                : hit.yValue !== undefined && hit.yValue !== null
                  ? String(hit.yValue)
                  : "");

        const formattedValue =
            isRange && formattedFrom && formattedTo
                ? `${formattedFrom} – ${formattedTo}`
                : (hit.formattedValue ?? formattedY);

        const context: ChartDataLabelContext<T> = {
            $implicit: undefined as unknown as ChartDataLabelContext<T>,
            close: hit.close ?? hit.financial?.close,
            color: hit.color ?? "#000000",
            dataIndex: hit.dataIndex ?? hit.index ?? 0,
            datum: hit.datum as T,
            formattedClose: hit.formattedClose ?? hit.financial?.formattedClose,
            formattedFrom,
            formattedHigh: hit.formattedHigh ?? hit.financial?.formattedHigh,
            formattedLow: hit.formattedLow ?? hit.financial?.formattedLow,
            formattedOpen: hit.formattedOpen ?? hit.financial?.formattedOpen,
            formattedSize: hit.formattedSize,
            formattedStackPercentage: hit.formattedStackPercentage ?? hit.formattedPercentage,
            formattedStackTotal: hit.formattedStackTotal,
            formattedTo,
            formattedValue,
            formattedX,
            formattedY,
            fromValue,
            high: hit.high ?? hit.financial?.high,
            low: hit.low ?? hit.financial?.low,
            markId,
            open: hit.open ?? hit.financial?.open,
            rawValue: hit.rawValue,
            selected,
            seriesId: hit.seriesId,
            seriesName: hit.seriesName,
            seriesType: hit.seriesType,
            sizeValue: hit.sizeValue,
            stackEnd: hit.stackEnd,
            stackMode: hit.stackMode,
            stackPercentage: hit.stackPercentage ?? hit.percentage,
            stackStart: hit.stackStart,
            stackTotal: hit.stackTotal,
            toValue,
            value,
            xValue: hit.xValue ?? hit.category,
            yValue: hit.yValue
        };

        (context as { $implicit: ChartDataLabelContext<T> }).$implicit = context;
        return context;
    }

    public static resolveDefaultText(
        context: ChartDataLabelContext,
        options: NormalizedChartDataLabelOptions
    ): string | null {
        if (options.formatter) {
            const formatted = options.formatter(context);
            if (formatted === null || formatted === undefined || formatted === "") {
                return null;
            }
            return String(formatted);
        }

        switch (context.seriesType) {
            case "line":
            case "scatter":
            case "bubble":
                return context.formattedValue || (context.yValue !== undefined ? String(context.yValue) : "");

            case "area":
            case "bar":
                if (context.stackMode === "percent") {
                    return context.formattedStackPercentage ?? (context.stackPercentage !== undefined ? `${context.stackPercentage}%` : "");
                }
                return context.formattedValue || (context.yValue !== undefined ? String(context.yValue) : "");

            case "rangeBar":
            case "rangeArea":
                if (context.formattedFrom !== undefined && context.formattedTo !== undefined) {
                    return `${context.formattedFrom} – ${context.formattedTo}`;
                }
                if (context.fromValue !== undefined && context.toValue !== undefined) {
                    return `${context.fromValue} – ${context.toValue}`;
                }
                return context.formattedValue;

            case "candlestick":
            case "ohlc":
                return context.formattedClose ?? (context.close !== undefined ? String(context.close) : "");

            default:
                return context.formattedValue;
        }
    }
}
