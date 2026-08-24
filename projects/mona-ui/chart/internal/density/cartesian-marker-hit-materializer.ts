import type { ChartAxisFormatter, ChartXAxisType } from "../../models/chart-axis.models";
import type { ChartField, ChartPoint } from "../../models/chart.models";
import type { ChartMarkKeyResolver } from "../animation/animation-identity";
import type {
    ChartCartesianSeriesRegistration,
    ChartXAxisRegistration,
    ChartYAxisRegistration
} from "../context/chart-registration-context";
import { resolveValue } from "../data/chart-value-resolver";
import type { ChartPositionScale } from "../scale/chart-scale";
import type { SceneHitTarget, SceneMarker, ChartInteractionXKey } from "../scene/scene-geometry";
import { formatXValue, formatYValue } from "../utils/chart-formatter";
import { formatCompactNumber, isFiniteNumber } from "../utils/number-utils";
import { resolveCartesianContinuousXCoordinate } from "../layout/cartesian-marker-coordinate-resolver";

export interface MaterializeCartesianMarkerParams {
    readonly animationKey: string;
    readonly color?: string;
    readonly datum: unknown;
    readonly formattedCategory?: string;
    readonly formattedSize?: string;
    readonly formattedValue: string;
    readonly point: ChartPoint;
    readonly radius: number;
    readonly seriesDisplayName: string;
    readonly seriesId: string;
    readonly seriesType: "bubble" | "scatter";
    readonly sizeValue?: number;
    readonly sourceIndex: number;
    readonly value: number;
    readonly visualRadius: number;
    readonly xAxis?: ChartXAxisRegistration;
    readonly xAxisId: string;
    readonly xKey: ChartInteractionXKey;
    readonly xValue: unknown;
    readonly yAxis?: ChartYAxisRegistration;
    readonly yAxisId: string;
    readonly yValue: number;
}

/** Shared forgiving hit expansion for bubble markers. */
export const cartesianBubbleMarkerHitPadding = 4;
export const cartesianMarkerHitEpsilon = 1e-9;

export function resolveCartesianBubbleHitRadius(visualRadius: number): number {
    return Math.max(0, visualRadius) + cartesianBubbleMarkerHitPadding;
}

export function materializeCartesianMarkerDatum(params: MaterializeCartesianMarkerParams): SceneHitTarget {
    return {
        animationKey: params.animationKey,
        color: params.color,
        datum: params.datum,
        formattedCategory: params.formattedCategory,
        formattedSize: params.formattedSize,
        formattedValue: params.formattedValue,
        index: params.sourceIndex,
        point: params.point,
        radius: params.radius,
        seriesId: params.seriesId,
        seriesName: params.seriesDisplayName,
        seriesType: params.seriesType,
        sizeValue: params.sizeValue,
        value: params.value,
        visualRadius: params.visualRadius,
        xAxisId: params.xAxisId,
        xAxisTitle: params.xAxis?.title?.() ?? "",
        xKey: params.xKey,
        xValue: params.xValue,
        yAxisId: params.yAxisId,
        yAxisTitle: params.yAxis?.title?.() ?? "",
        yValue: params.yValue
    };
}

import type { ChartSeriesMarkIdentityAuthority } from "../animation/chart-series-mark-identity-authority";

export interface ResolveMarkerDatumContext {
    readonly bubbleRadiusScale?: (size: number) => number;
    readonly color?: string;
    readonly data: readonly unknown[];
    readonly defaultMinRadius: number;
    readonly defaultScatterRadius: number;
    readonly identity?: ChartSeriesMarkIdentityAuthority;
    readonly keyResolver?: ChartMarkKeyResolver;
    readonly series: ChartCartesianSeriesRegistration;
    readonly seriesDisplayName: string;
    readonly seriesOrdinal?: number;
    readonly seriesType: "bubble" | "scatter";
    readonly sizeField?: ChartField;
    readonly sizeFormatter?: (size: number, index: number) => string;
    readonly valueField: ChartField;
    readonly valueFormatter?: (value: number, index: number) => string;
    readonly xAxis?: ChartXAxisRegistration;
    readonly xAxisFormatter?: ChartAxisFormatter;
    readonly xAxisId: string;
    readonly xAxisTitle?: string;
    readonly xAxisType: ChartXAxisType;
    readonly xField?: ChartField;
    readonly xScale: ChartPositionScale;
    readonly xTimeSpanMs?: number;
    readonly yAxis?: ChartYAxisRegistration;
    readonly yAxisFormatter?: ChartAxisFormatter;
    readonly yAxisId: string;
    readonly yAxisTitle?: string;
    readonly yScale: ChartPositionScale;
}

export interface ResolvedMarkerDatumResult {
    readonly isBubble: boolean;
    readonly marker: SceneMarker;
    readonly markerRadius: number;
    readonly target: SceneHitTarget;
    readonly xPos: number;
    readonly yPos: number;
}

/**
 * Shared authoritative semantic resolution for scatter and bubble markers (§56/§218).
 * Ordinary layout and dense raw materialization share the same underlying builder (SD3-R09).
 */
export function resolveCartesianMarkerDatum(
    context: ResolveMarkerDatumContext,
    sourceIndex: number,
    renderOrder: number = 0,
    occurrenceRank?: number
): ResolvedMarkerDatumResult | null {
    const datum = context.data[sourceIndex];
    if (datum === undefined) {
        return null;
    }
    const rawXVal = resolveValue(datum, context.xField, sourceIndex);
    const rawYVal = resolveValue(datum, context.valueField, sourceIndex);

    const resolvedX = resolveCartesianContinuousXCoordinate(rawXVal, undefined, undefined, sourceIndex, context.xScale);
    if (!resolvedX.valid || !isFiniteNumber(rawYVal)) {
        return null;
    }

    const yVal = Number(rawYVal);
    const xPos = resolvedX.coordinate;
    const yPos = context.yScale.map(yVal);
    if (xPos === undefined || yPos === undefined || !Number.isFinite(xPos) || !Number.isFinite(yPos)) {
        return null;
    }

    const isBubble = context.seriesType === "bubble";
    let markerRadius: number;
    let sizeVal: number | undefined;
    let formattedSizeStr: string | undefined;

    if (isBubble) {
        const rawSize = resolveValue(datum, context.sizeField, sourceIndex);
        if (!isFiniteNumber(rawSize) || (rawSize as number) <= 0) {
            return null;
        }
        sizeVal = Number(rawSize);
        markerRadius = context.bubbleRadiusScale ? context.bubbleRadiusScale(sizeVal) : context.defaultMinRadius;
        formattedSizeStr = context.sizeFormatter
            ? context.sizeFormatter(sizeVal, sourceIndex)
            : formatCompactNumber(sizeVal);
    } else {
        markerRadius = context.defaultScatterRadius;
    }

    const animationKey = context.identity
        ? context.identity.resolveKeyAt(sourceIndex, resolvedX.interactionKey, datum)
        : occurrenceRank !== undefined
          ? (context.keyResolver?.resolveKeyWithRank(datum, resolvedX.interactionKey, sourceIndex, occurrenceRank) ??
            "")
          : (context.keyResolver?.resolveKey(datum, resolvedX.interactionKey, sourceIndex) ?? "");

    const marker: SceneMarker = {
        animationKey,
        datum,
        formattedSize: formattedSizeStr,
        index: sourceIndex,
        radius: markerRadius,
        sizeValue: sizeVal,
        x: xPos,
        xValue: rawXVal,
        y: yPos,
        yValue: yVal
    };

    const hitRadius = isBubble ? resolveCartesianBubbleHitRadius(markerRadius) : Math.max(markerRadius + 6, 10);
    const point: ChartPoint = { x: xPos, y: yPos };

    const target: SceneHitTarget = {
        animationKey,
        color: context.color,
        datum,
        formattedCategory: formatXValue(
            rawXVal,
            sourceIndex,
            context.xAxisFormatter,
            context.xAxisType,
            context.xTimeSpanMs
        ),
        formattedSize: formattedSizeStr,
        formattedValue: formatYValue(
            yVal,
            sourceIndex,
            context.yAxisFormatter ?? (context.valueFormatter as ChartAxisFormatter<unknown> | undefined)
        ),
        index: sourceIndex,
        markerInteractionOrder: {
            seriesOrdinal: context.seriesOrdinal ?? 0,
            sourceOrdinal: sourceIndex
        },
        point,
        radius: hitRadius,
        renderOrder,
        seriesId: context.series.id,
        seriesName: context.seriesDisplayName,
        seriesType: context.seriesType,
        sizeValue: sizeVal,
        value: yVal,
        visualRadius: markerRadius,
        xAxisId: context.xAxisId,
        xAxisTitle: context.xAxisTitle ?? context.xAxis?.title?.() ?? "",
        xKey: resolvedX.interactionKey,
        xValue: rawXVal,
        yAxisId: context.yAxisId,
        yAxisTitle: context.yAxisTitle ?? context.yAxis?.title?.() ?? "",
        yValue: yVal
    };

    return {
        isBubble,
        marker,
        markerRadius,
        target,
        xPos,
        yPos
    };
}
