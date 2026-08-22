import type { ChartAxisFormatter, ChartXAxisType } from "../../models/chart-axis.models";
import type { ChartField, ChartRect } from "../../models/chart.models";
import type { ChartSeriesStyle } from "../../models/chart-style.models";
import { ChartMarkKeyResolver } from "../animation/animation-identity";
import type {
    ChartAxisRegistration,
    ChartRangeAreaSeriesRegistration,
    ChartRangeBarSeriesRegistration
} from "../context/chart-registration-context";
import { resolveFiniteRangeValues } from "../data/chart-range-resolver";
import { resolveValue } from "../data/chart-value-resolver";
import type {
    ChartBandScale,
    ChartContinuousScale,
    ChartPositionScale,
    ResolvedChartCartesianAxisType
} from "../scale/chart-scale";
import type { ChartRangeAreaSeriesScene, ChartRangeBarSeriesScene } from "../scene/cartesian-scene";
import type { SceneHitTarget, SceneRangeAreaPoint, SceneRangeBar } from "../scene/scene-geometry";
import { formatXValue, formatYValue } from "../utils/chart-formatter";
import { isFiniteNumber, normalizeNonNegativeNumber, normalizeOpacity } from "../utils/number-utils";
import { ChartDensityTracker, type ChartDensityStageCVisitMode } from "./chart-density-instrumentation";
import { resolveRangeAreaHitGeometry } from "./cartesian-range-hit-geometry";
import { resolveRangeTemporalXValue } from "../density/cartesian-range-temporal";

export interface RangeBarLayoutContext {
    bandScale?: ChartBandScale;
    barSlotLayout: {
        bySeriesId: ReadonlyMap<string, { id: string; maxBarWidth?: number }>;
    };
    nestedBarScale?: ChartBandScale;
    recordHitTarget: (target: SceneHitTarget, isBar: boolean, isPoint: boolean) => void;
    renderOrderCounter: { value: number };
    rootData: readonly unknown[];
    rootXField?: ChartField;
    series: ChartRangeBarSeriesRegistration;
    seriesDisplayName: string;
    style: ChartSeriesStyle;
    xAxis?: ChartAxisRegistration;
    xAxisId?: string;
    xAxisTitle?: string;
    yAxis?: ChartAxisRegistration;
    yAxisId?: string;
    yAxisTitle?: string;
    yFormatter?: (val: number, idx: number) => string;
    yScale: ChartContinuousScale;
}

export function computeRangeBarLayout(ctx: RangeBarLayoutContext): ChartRangeBarSeriesScene | null {
    const {
        bandScale,
        barSlotLayout,
        nestedBarScale,
        recordHitTarget,
        renderOrderCounter,
        rootData,
        rootXField,
        series: s,
        seriesDisplayName,
        style: sStyle,
        xAxis,
        xAxisId,
        xAxisTitle,
        yAxis,
        yAxisId,
        yAxisTitle,
        yFormatter,
        yScale
    } = ctx;

    const slot = barSlotLayout.bySeriesId.get(s.id);
    if (!slot || !bandScale || !nestedBarScale) {
        return null;
    }

    const sData = s.data?.() ?? rootData;
    const sFromField = s.fromField();
    const sToField = s.toField();
    const sKeyField = s.keyField?.();
    const sXField = s.xField?.() ?? rootXField;
    const sRadius = s.borderRadius?.();
    const seriesRawFormatter = s.valueFormatter?.() as ChartAxisFormatter<unknown> | undefined;
    const effectiveRawFormatter = seriesRawFormatter ?? (yFormatter as ChartAxisFormatter<unknown> | undefined);

    const radius = normalizeNonNegativeNumber(sRadius, 4);
    const slotWidth = nestedBarScale.bandwidth();
    const barWidth = Math.min(slotWidth, slot.maxBarWidth ?? Number.POSITIVE_INFINITY);
    const centerOffset = (slotWidth - barWidth) / 2;
    const subX = nestedBarScale.map(slot.id) ?? 0;

    const keyResolver = new ChartMarkKeyResolver(s.id, sKeyField, s.seriesKey?.());
    const bars: SceneRangeBar[] = [];

    for (let dIdx = 0; dIdx < sData.length; dIdx++) {
        const datum = sData[dIdx];
        const xVal = resolveValue(datum, sXField, dIdx);
        const catKey = xVal !== undefined && xVal !== null ? String(xVal) : String(dIdx);
        const bandOuterX = bandScale.map(catKey);

        if (bandOuterX === undefined) {
            continue;
        }

        const range = resolveFiniteRangeValues(datum, sFromField, sToField, dIdx);

        if (!range) {
            continue;
        }

        const rawFromY = (yScale as any).map(range.fromValue);
        const rawToY = (yScale as any).map(range.toValue);
        if (rawFromY === undefined || !Number.isFinite(rawFromY) || rawToY === undefined || !Number.isFinite(rawToY)) {
            continue;
        }

        const barX = bandOuterX + subX + centerOffset;
        const fromY = rawFromY;
        const toY = rawToY;
        const topY = Math.min(fromY, toY);
        const barHeight = Math.abs(toY - fromY);

        const cornerRadii = {
            bottomLeft: radius,
            bottomRight: radius,
            topLeft: radius,
            topRight: radius
        };

        const animationKey = keyResolver.resolveKey(datum, catKey, dIdx);
        const formattedFrom = formatYValue(range.fromValue, dIdx, effectiveRawFormatter);
        const formattedTo = formatYValue(range.toValue, dIdx, effectiveRawFormatter);
        const formattedValue = `${formattedFrom} - ${formattedTo}`;

        const bar: SceneRangeBar = {
            animationKey,
            categorySize: barWidth,
            categoryStartPixel: barX,
            cornerRadii,
            datum,
            formattedFrom,
            formattedTo,
            fromValue: range.fromValue,
            fromValuePixel: fromY,
            fromY,
            height: barHeight,
            highValue: range.highValue,
            index: dIdx,
            lowValue: range.lowValue,
            radius,
            renderOpacity: 1,
            toValue: range.toValue,
            toValuePixel: toY,
            toY,
            width: barWidth,
            x: barX,
            xValue: xVal,
            y: topY
        };
        bars.push(bar);

        const currentRenderOrder = ++renderOrderCounter.value;
        const barTarget: SceneHitTarget = {
            animationKey,
            borderRadius: radius,
            bounds: {
                height: barHeight,
                width: barWidth,
                x: barX,
                y: topY
            },
            cornerRadii,
            datum,
            formattedCategory: formatXValue(catKey, dIdx, xAxis?.formatter?.(), "category"),
            formattedFrom,
            formattedTo,
            formattedValue,
            fromValue: range.fromValue,
            highValue: range.highValue,
            index: dIdx,
            lowValue: range.lowValue,
            range: {
                formattedFrom,
                formattedTo,
                fromValue: range.fromValue,
                highValue: range.highValue,
                lowValue: range.lowValue,
                toValue: range.toValue
            },
            renderOrder: currentRenderOrder,
            seriesId: s.id,
            seriesName: seriesDisplayName,
            seriesType: "rangeBar",
            toValue: range.toValue,
            value: [range.fromValue, range.toValue],
            valueKind: "range",
            visualBounds: {
                height: barHeight,
                width: barWidth,
                x: barX,
                y: topY
            },
            xAxisId: xAxisId ?? xAxis?.axisId?.() ?? "default-x",
            xAxisTitle: xAxisTitle ?? xAxis?.title?.() ?? "",
            xKey: catKey,
            xValue: xVal,
            yAxisId: yAxisId ?? yAxis?.axisId?.() ?? "default-y",
            yAxisTitle: yAxisTitle ?? yAxis?.title?.() ?? ""
        };
        recordHitTarget(barTarget, true, false);
    }

    return {
        bars,
        borderRadius: radius,
        fillOpacity: normalizeOpacity(s.fillOpacity?.(), sStyle.fillOpacity ?? 1),
        id: s.id,
        name: seriesDisplayName,
        style: sStyle,
        type: "rangeBar",
        xAxisId: xAxisId ?? xAxis?.axisId?.() ?? "default-x",
        yAxisId: yAxisId ?? yAxis?.axisId?.() ?? "default-y"
    };
}

export interface RangeAreaLayoutContext {
    bandScale?: ChartBandScale;
    /** Sampled source-index view; null renders every datum (ordinary layout). */
    indexView?: readonly number[] | null;
    linearXScale?: ChartContinuousScale;
    /** Segment ordinal per source index (-1 = invalid) for gap topology when sampled. */
    rangeSegmentIds?: Int32Array;
    /** endIndexExclusive per segment ordinal for gap-marker lookup when sampled. */
    rangeSegmentEnds?: readonly number[];
    /** Contiguous range slice for non-sampled visible window projection */
    rangeSlice?: { readonly startIndex: number; readonly endIndexExclusive: number } | null;
    /** Segment ordinal per source index (-1 = invalid) for gap topology when sampled. (deprecated alias) */
    scalarSegmentIds?: Int32Array;
    /** endIndexExclusive per segment ordinal for gap-marker lookup when sampled. (deprecated alias) */
    scalarSegmentEnds?: readonly number[];
    identity?: import("../animation/chart-series-mark-identity-authority").ChartSeriesMarkIdentityAuthority;
    plotRect: ChartRect;
    recordHitTarget: (target: SceneHitTarget, isBar: boolean, isPoint: boolean) => void;
    renderOrderCounter: { value: number };
    rootData: readonly unknown[];
    rootXField?: ChartField;
    series: ChartRangeAreaSeriesRegistration;
    seriesDisplayName: string;
    readonly sourceVisitMode?: ChartDensityStageCVisitMode;
    style: ChartSeriesStyle;
    timeScale?: ChartContinuousScale;
    timeSpanMs?: number;
    xAxis?: ChartAxisRegistration;
    xAxisId?: string;
    xAxisTitle?: string;
    xAxisType: ChartXAxisType | ResolvedChartCartesianAxisType;
    xScale?: ChartPositionScale;
    yAxis?: ChartAxisRegistration;
    yAxisId?: string;
    yAxisTitle?: string;
    yFormatter?: (val: number, idx: number) => string;
    yScale: ChartContinuousScale;
}

export function computeRangeAreaLayout(ctx: RangeAreaLayoutContext): ChartRangeAreaSeriesScene {
    const {
        bandScale,
        identity,
        indexView,
        linearXScale,
        plotRect,
        recordHitTarget,
        renderOrderCounter,
        rootData,
        rootXField,
        scalarSegmentEnds,
        scalarSegmentIds,
        series: s,
        seriesDisplayName,
        style: sStyle,
        timeScale,
        timeSpanMs,
        xAxis,
        xAxisId,
        xAxisTitle,
        xAxisType,
        xScale,
        yAxis,
        yAxisId,
        yAxisTitle,
        yFormatter,
        yScale
    } = ctx;

    const sData = s.data?.() ?? rootData;
    const sFromField = s.fromField();
    const sToField = s.toField();
    const sKeyField = s.keyField?.();
    const sXField = s.xField?.() ?? rootXField;
    const sConnectNulls = s.connectNulls?.() ?? false;
    const sCurve = s.curve?.() ?? "linear";
    const sShowPoints = s.showPoints?.() ?? false;
    const sPointRadius = s.pointRadius?.();
    const sStrokeWidth = s.strokeWidth?.();
    const sFillOpacity = s.fillOpacity?.();
    const seriesRawFormatter = s.valueFormatter?.() as ChartAxisFormatter<unknown> | undefined;
    const effectiveRawFormatter = seriesRawFormatter ?? (yFormatter as ChartAxisFormatter<unknown> | undefined);

    const pointRadius = normalizeNonNegativeNumber(sPointRadius, sStyle.pointRadius ?? 4);
    const strokeWidth = normalizeNonNegativeNumber(sStrokeWidth, sStyle.lineWidth ?? 2);
    const fillOpacity = normalizeOpacity(sFillOpacity, sStyle.fillOpacity ?? 0.18);

    const keyResolver = new ChartMarkKeyResolver(s.id, sKeyField, s.seriesKey?.());
    const points: SceneRangeAreaPoint[] = [];

    const effectiveXScale = xScale ?? bandScale ?? linearXScale ?? timeScale;

    const visitRangeDatum = (dIdx: number): void => {
        if (ctx.sourceVisitMode === "sampled") {
            ChartDensityTracker.current?.onSampledProjectedRowsVisited?.();
        } else if (ctx.sourceVisitMode === "exact") {
            ChartDensityTracker.current?.onExactProjectedRowsVisited?.();
        } else {
            ChartDensityTracker.current?.onRawStageCSourceRowsVisited?.();
        }
        const datum = sData[dIdx];
        const xVal = resolveValue(datum, sXField, dIdx);

        let xPos = plotRect.x;
        let isXValid = false;
        let normalizedXKey: number | string = dIdx;

        if (xAxisType === "category") {
            const bScale = (effectiveXScale as ChartBandScale) ?? bandScale;
            if (bScale) {
                const catKey = xVal !== undefined && xVal !== null ? String(xVal) : String(dIdx);
                normalizedXKey = catKey;
                const bPos = bScale.map(catKey);
                if (bPos !== undefined) {
                    xPos = bPos + bScale.bandwidth() / 2;
                    isXValid = true;
                }
            }
        } else if (xAxisType === "time" || xAxisType === "utc") {
            const temporalX = resolveRangeTemporalXValue(xVal);
            if (temporalX) {
                normalizedXKey = temporalX.epochMs;
                const tScale = (effectiveXScale as ChartContinuousScale<Date>) ?? timeScale;
                const mappedX = tScale?.map(temporalX.date);
                if (mappedX !== undefined && Number.isFinite(mappedX)) {
                    xPos = mappedX;
                    isXValid = true;
                }
            }
        } else {
            // Numeric scale: linear, log, symlog, pow, sqrt
            if (isFiniteNumber(xVal)) {
                const numVal = Number(xVal);
                normalizedXKey = numVal;
                const numScale = (effectiveXScale as ChartContinuousScale<number>) ?? linearXScale;
                const mappedX = numScale?.map(numVal);
                if (mappedX !== undefined && Number.isFinite(mappedX)) {
                    xPos = mappedX;
                    isXValid = true;
                }
            }
        }

        const range = resolveFiniteRangeValues(datum, sFromField, sToField, dIdx);
        const defined = isXValid && range !== null;
        const animationKey = identity
            ? identity.resolveKeyAt(dIdx, normalizedXKey, datum)
            : keyResolver.resolveKey(datum, normalizedXKey, dIdx);

        if (!defined || !range) {
            points.push({
                animationKey,
                datum,
                defined: false,
                index: dIdx,
                renderOpacity: 1,
                x: xPos,
                xValue: xVal
            });
            return;
        }

        const rawFromY = yScale.map(range.fromValue);
        const rawToY = yScale.map(range.toValue);
        if (rawFromY === undefined || !Number.isFinite(rawFromY) || rawToY === undefined || !Number.isFinite(rawToY)) {
            points.push({
                animationKey,
                datum,
                defined: false,
                index: dIdx,
                renderOpacity: 1,
                x: xPos,
                xValue: xVal
            });
            return;
        }
        const fromY = rawFromY;
        const toY = rawToY;
        const lowY = Math.max(fromY, toY);
        const highY = Math.min(fromY, toY);
        const fromPoint = { x: xPos, y: fromY };
        const toPoint = { x: xPos, y: toY };
        const lowPoint = { x: xPos, y: lowY };
        const highPoint = { x: xPos, y: highY };

        const formattedFrom = formatYValue(range.fromValue, dIdx, effectiveRawFormatter);
        const formattedTo = formatYValue(range.toValue, dIdx, effectiveRawFormatter);
        const formattedValue = `${formattedFrom} \u2013 ${formattedTo}`;

        const point: SceneRangeAreaPoint = {
            animationKey,
            datum,
            defined: true,
            formattedFrom,
            formattedTo,
            fromPoint,
            fromValue: range.fromValue,
            highPoint,
            highValue: range.highValue,
            index: dIdx,
            lowPoint,
            lowValue: range.lowValue,
            renderOpacity: 1,
            toPoint,
            toValue: range.toValue,
            x: xPos,
            xValue: xVal
        };
        points.push(point);

        const currentRenderOrder = ++renderOrderCounter.value;
        const formattedCategory = formatXValue(normalizedXKey, dIdx, xAxis?.formatter?.(), xAxisType, timeSpanMs);
        const hitGeometry = resolveRangeAreaHitGeometry(sShowPoints, pointRadius);

        const rangeTarget: SceneHitTarget = {
            animationKey,
            datum,
            formattedCategory,
            formattedFrom,
            formattedTo,
            formattedValue,
            fromValue: range.fromValue,
            highPoint,
            highValue: range.highValue,
            index: dIdx,
            lowPoint,
            lowValue: range.lowValue,
            point: { x: xPos, y: (fromY + toY) / 2 },
            radius: hitGeometry.hitRadius,
            range: {
                formattedFrom,
                formattedTo,
                fromValue: range.fromValue,
                highValue: range.highValue,
                lowValue: range.lowValue,
                toValue: range.toValue
            },
            rangeBand: {
                fromPoint,
                toPoint
            },
            renderOrder: currentRenderOrder,
            seriesId: s.id,
            seriesName: seriesDisplayName,
            seriesType: "rangeArea",
            toValue: range.toValue,
            value: [range.fromValue, range.toValue],
            valueKind: "range",
            visualRadius: hitGeometry.visualRadius,
            xAxisId: xAxisId ?? xAxis?.axisId?.() ?? "default-x",
            xAxisTitle: xAxisTitle ?? xAxis?.title?.() ?? "",
            xKey: normalizedXKey,
            xValue: xVal,
            yAxisId: yAxisId ?? yAxis?.axisId?.() ?? "default-y",
            yAxisTitle: yAxisTitle ?? yAxis?.title?.() ?? ""
        };
        recordHitTarget(rangeTarget, false, true);
    };

    const effectiveSegmentIds = ctx.rangeSegmentIds ?? scalarSegmentIds;
    const effectiveSegmentEnds = ctx.rangeSegmentEnds ?? scalarSegmentEnds;

    if (indexView) {
        let previousSegmentId = -1;
        let hasPrevious = false;
        for (const dIdx of indexView) {
            const segmentId = effectiveSegmentIds ? effectiveSegmentIds[dIdx] : -2;
            if (
                !sConnectNulls &&
                hasPrevious &&
                previousSegmentId >= 0 &&
                segmentId >= 0 &&
                segmentId !== previousSegmentId
            ) {
                const markerIdx = effectiveSegmentEnds?.[previousSegmentId] ?? -1;
                if (markerIdx >= 0 && markerIdx < sData.length && effectiveSegmentIds?.[markerIdx] === -1) {
                    visitRangeDatum(markerIdx);
                }
            }
            if (segmentId >= 0) {
                previousSegmentId = segmentId;
                hasPrevious = true;
            }
            visitRangeDatum(dIdx);
        }
    } else if (ctx.rangeSlice) {
        const start = Math.max(0, ctx.rangeSlice.startIndex - 1);
        const end = Math.min(sData.length, ctx.rangeSlice.endIndexExclusive + 1);
        for (let dIdx = start; dIdx < end; dIdx++) {
            visitRangeDatum(dIdx);
        }
    } else {
        for (let dIdx = 0; dIdx < sData.length; dIdx++) {
            visitRangeDatum(dIdx);
        }
    }

    return {
        connectNulls: sConnectNulls,
        curve: sCurve,
        fillOpacity,
        id: s.id,
        name: seriesDisplayName,
        pointRadius,
        points,
        renderOpacity: 1,
        showPoints: sShowPoints,
        strokeWidth,
        style: sStyle,
        type: "rangeArea",
        xAxisId: xAxisId ?? xAxis?.axisId?.() ?? "default-x",
        yAxisId: yAxisId ?? yAxis?.axisId?.() ?? "default-y"
    };
}
