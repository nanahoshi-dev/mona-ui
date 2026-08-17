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
import type { ChartBandScale, ChartContinuousScale } from "../scale/chart-scale";
import type { ChartRangeAreaSeriesScene, ChartRangeBarSeriesScene } from "../scene/cartesian-scene";
import type { SceneHitTarget, SceneRangeAreaPoint, SceneRangeBar } from "../scene/scene-geometry";
import { formatXValue, formatYValue } from "../utils/chart-formatter";
import { isFiniteNumber, normalizeNonNegativeNumber, normalizeOpacity } from "../utils/number-utils";

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
    yAxis?: ChartAxisRegistration;
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
    const sBorderRadius = s.borderRadius?.();
    const sFillOpacity = s.fillOpacity?.();
    const seriesRawFormatter = s.valueFormatter?.() as ChartAxisFormatter<unknown> | undefined;
    const effectiveRawFormatter = seriesRawFormatter ?? (yFormatter as ChartAxisFormatter<unknown> | undefined);

    const radius = normalizeNonNegativeNumber(sBorderRadius, 4);
    const cornerRadii =
        radius > 0
            ? {
                  bottomLeft: radius,
                  bottomRight: radius,
                  topLeft: radius,
                  topRight: radius
              }
            : undefined;

    const slotWidth = nestedBarScale.bandwidth();
    const barWidth = Math.min(slotWidth, slot.maxBarWidth ?? Number.POSITIVE_INFINITY);
    const centerOffset = (slotWidth - barWidth) / 2;
    const subX = nestedBarScale.map(slot.id) ?? 0;

    const keyResolver = new ChartMarkKeyResolver(s.id, sKeyField);
    const bars: SceneRangeBar[] = [];

    for (let dIdx = 0; dIdx < sData.length; dIdx++) {
        const datum = sData[dIdx];
        const xVal = resolveValue(datum, sXField, dIdx);
        const catKey = xVal !== undefined && xVal !== null ? String(xVal) : String(dIdx);
        const bandOuterX = bandScale.map(catKey);
        if (bandOuterX === undefined) continue;

        const range = resolveFiniteRangeValues(datum, sFromField, sToField, dIdx);
        if (!range) continue;

        const fromY = yScale.map(range.fromValue);
        const toY = yScale.map(range.toValue);
        const topY = Math.min(fromY, toY);
        const barHeight = Math.abs(fromY - toY);
        const barX = bandOuterX + subX + centerOffset;

        const animationKey = keyResolver.resolveKey(datum, catKey, dIdx);
        const formattedFrom = formatYValue(range.fromValue, dIdx, effectiveRawFormatter);
        const formattedTo = formatYValue(range.toValue, dIdx, effectiveRawFormatter);
        const formattedValue = `${formattedFrom} \u2013 ${formattedTo}`;

        const bar: SceneRangeBar = {
            animationKey,
            cornerRadii,
            datum,
            formattedFrom,
            formattedTo,
            fromValue: range.fromValue,
            height: barHeight,
            highValue: range.highValue,
            index: dIdx,
            lowValue: range.lowValue,
            radius,
            renderOpacity: 1,
            toValue: range.toValue,
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
                height: Math.max(4, barHeight),
                width: barWidth,
                x: barX,
                y: barHeight === 0 ? topY - 2 : topY
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
            valueKind: "range",
            visualBounds: {
                height: barHeight,
                width: barWidth,
                x: barX,
                y: topY
            },
            xKey: catKey,
            xValue: xVal
        };
        recordHitTarget(barTarget, true, false);
    }

    return {
        bars,
        borderRadius: radius,
        fillOpacity: normalizeOpacity(sFillOpacity, sStyle.fillOpacity ?? 1),
        id: s.id,
        name: seriesDisplayName,
        style: sStyle,
        type: "rangeBar"
    };
}

export interface RangeAreaLayoutContext {
    bandScale?: ChartBandScale;
    linearXScale?: ChartContinuousScale;
    plotRect: ChartRect;
    recordHitTarget: (target: SceneHitTarget, isBar: boolean, isPoint: boolean) => void;
    renderOrderCounter: { value: number };
    rootData: readonly unknown[];
    rootXField?: ChartField;
    series: ChartRangeAreaSeriesRegistration;
    seriesDisplayName: string;
    style: ChartSeriesStyle;
    timeScale?: ChartContinuousScale;
    timeSpanMs?: number;
    xAxis?: ChartAxisRegistration;
    xAxisType: ChartXAxisType;
    yAxis?: ChartAxisRegistration;
    yFormatter?: (val: number, idx: number) => string;
    yScale: ChartContinuousScale;
}

export function computeRangeAreaLayout(ctx: RangeAreaLayoutContext): ChartRangeAreaSeriesScene {
    const {
        bandScale,
        linearXScale,
        plotRect,
        recordHitTarget,
        renderOrderCounter,
        rootData,
        rootXField,
        series: s,
        seriesDisplayName,
        style: sStyle,
        timeScale,
        timeSpanMs,
        xAxis,
        xAxisType,
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

    const keyResolver = new ChartMarkKeyResolver(s.id, sKeyField);
    const points: SceneRangeAreaPoint[] = [];

    for (let dIdx = 0; dIdx < sData.length; dIdx++) {
        const datum = sData[dIdx];
        const xVal = resolveValue(datum, sXField, dIdx);

        let xPos = plotRect.x;
        let isXValid = false;
        let normalizedXKey: number | string = dIdx;

        if (bandScale) {
            const catKey = xVal !== undefined && xVal !== null ? String(xVal) : String(dIdx);
            normalizedXKey = catKey;
            const bPos = bandScale.map(catKey);
            if (bPos !== undefined) {
                xPos = bPos + bandScale.bandwidth() / 2;
                isXValid = true;
            }
        } else if (linearXScale) {
            if (isFiniteNumber(xVal)) {
                normalizedXKey = Number(xVal);
                xPos = linearXScale.map(xVal);
                isXValid = true;
            }
        } else if (timeScale) {
            let dateVal: Date | undefined;
            if (xVal instanceof Date && !Number.isNaN(xVal.getTime())) {
                dateVal = xVal;
            } else if (typeof xVal === "number" && Number.isFinite(xVal)) {
                dateVal = new Date(xVal);
            } else if (typeof xVal === "string") {
                const parsed = Date.parse(xVal);
                if (!Number.isNaN(parsed)) {
                    dateVal = new Date(parsed);
                }
            }
            if (dateVal !== undefined && Number.isFinite(dateVal.getTime())) {
                normalizedXKey = dateVal.getTime();
                xPos = timeScale.map(dateVal);
                isXValid = true;
            }
        }

        const range = resolveFiniteRangeValues(datum, sFromField, sToField, dIdx);
        const defined = isXValid && range !== null;
        const animationKey = keyResolver.resolveKey(datum, normalizedXKey, dIdx);

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
            continue;
        }

        const fromY = yScale.map(range.fromValue);
        const toY = yScale.map(range.toValue);
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
        const formattedCategory = formatXValue(
            normalizedXKey,
            dIdx,
            xAxis?.formatter?.(),
            xAxisType,
            timeSpanMs
        );

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
            radius: Math.max(16, pointRadius + 4),
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
            valueKind: "range",
            visualRadius: pointRadius,
            xKey: normalizedXKey,
            xValue: xVal
        };
        recordHitTarget(rangeTarget, false, true);
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
        type: "rangeArea"
    };
}
