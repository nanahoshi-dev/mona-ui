import type { ChartBarOrientation } from "../../models/chart-bar.models";
import type { ChartFinancialDirection, ChartFinancialFillMode } from "../../models/chart-financial.models";
import type { ChartPoint, ChartRect } from "../../models/chart.models";
import type { ChartSeriesType } from "../../models/chart-series.models";
import type { ChartStackMode } from "../../models/chart-stack.models";
import type { ChartPointValueKind } from "../../models/chart-tooltip.models";

export type ChartInteractionXKey = number | string;

export interface ChartCornerRadii {
    readonly bottomLeft: number;
    readonly bottomRight: number;
    readonly topLeft: number;
    readonly topRight: number;
}

export interface SceneArcHitGeometry {
    center: ChartPoint;
    cornerRadius?: number;
    endAngle: number;
    innerRadius: number;
    outerRadius: number;
    padAngle: number;
    startAngle: number;
}

export interface SceneBar {
    animationKey?: string;
    categorySize?: number;
    categoryStartPixel?: number;
    cornerRadii?: ChartCornerRadii;
    datum: unknown;
    height: number;
    index: number;
    isPositive: boolean;
    orientation?: ChartBarOrientation;
    radius: number;
    renderOpacity?: number;
    stackEndValue?: number;
    stackGroup?: string;
    stackMode?: ChartStackMode;
    stackPercentage?: number;
    stackPosition?: "inner" | "outer" | "single";
    stackStartValue?: number;
    stackTotal?: number;
    synthetic?: boolean;
    valueEndPixel?: number;
    valueStartPixel?: number;
    width: number;
    x: number;
    xValue: unknown;
    y: number;
    yValue: number;
}

export interface SceneRangeBandGeometry {
    readonly fromPoint: ChartPoint;
    readonly toPoint: ChartPoint;
}

export interface SceneRangeBar {
    readonly animationKey?: string;
    readonly categorySize?: number;
    readonly categoryStartPixel?: number;
    readonly cornerRadii?: ChartCornerRadii;
    readonly datum: unknown;
    readonly formattedFrom?: string;
    readonly formattedTo?: string;
    readonly fromValue: number;
    readonly fromValuePixel?: number;
    readonly fromY: number;
    readonly height: number;
    readonly highValue: number;
    readonly index: number;
    readonly lowValue: number;
    readonly orientation?: ChartBarOrientation;
    readonly radius: number;
    readonly renderOpacity?: number;
    readonly toValue: number;
    readonly toValuePixel?: number;
    readonly toY: number;
    readonly width: number;
    readonly x: number;
    readonly xValue: unknown;
    readonly y: number;
}

export interface SceneRangeHitValue {
    readonly formattedFrom: string;
    readonly formattedTo: string;
    readonly fromValue: number;
    readonly highValue: number;
    readonly lowValue: number;
    readonly toValue: number;
}

export interface SceneFinancialHitValue {
    readonly change?: number;
    readonly changePercentage?: number;
    readonly close: number;
    readonly direction: ChartFinancialDirection;
    readonly formattedChange?: string;
    readonly formattedChangePercentage?: string;
    readonly formattedClose?: string;
    readonly formattedHigh?: string;
    readonly formattedLow?: string;
    readonly formattedOpen?: string;
    readonly high: number;
    readonly low: number;
    readonly open: number;
    readonly valueKind: "ohlc";
}

export interface SceneCandlestickMark {
    readonly animationKey?: string;
    readonly bodyBounds: ChartRect;
    readonly bodyWidth: number;
    readonly centerX: number;
    readonly change?: number;
    readonly changePercentage?: number;
    readonly close: number;
    readonly closeY: number;
    readonly datum: unknown;
    readonly direction: ChartFinancialDirection;
    readonly fillMode: ChartFinancialFillMode;
    readonly formattedClose?: string;
    readonly formattedHigh?: string;
    readonly formattedLow?: string;
    readonly formattedOpen?: string;
    readonly high: number;
    readonly highY: number;
    readonly index: number;
    readonly low: number;
    readonly lowY: number;
    readonly open: number;
    readonly openY: number;
    readonly renderOpacity?: number;
    readonly wickWidth: number;
    readonly xKey?: ChartInteractionXKey;
    readonly xValue: unknown;
}

export interface SceneOhlcMark {
    readonly animationKey?: string;
    readonly centerX: number;
    readonly change?: number;
    readonly changePercentage?: number;
    readonly close: number;
    readonly closeY: number;
    readonly datum: unknown;
    readonly direction: ChartFinancialDirection;
    readonly formattedClose?: string;
    readonly formattedHigh?: string;
    readonly formattedLow?: string;
    readonly formattedOpen?: string;
    readonly high: number;
    readonly highY: number;
    readonly index: number;
    readonly low: number;
    readonly lowY: number;
    readonly open: number;
    readonly openY: number;
    readonly renderOpacity?: number;
    readonly tickWidth: number;
    readonly totalWidth: number;
    readonly wickWidth: number;
    readonly xKey?: ChartInteractionXKey;
    readonly xValue: unknown;
}

export interface SceneHitTarget {
    angle?: number;
    animationKey?: string;
    arc?: SceneArcHitGeometry;
    barOrientation?: ChartBarOrientation;
    borderRadius?: number;
    bounds?: ChartRect;
    category?: unknown;
    categoryIndex?: number;
    categoryX?: string;
    categoryY?: string;
    close?: number;
    color?: string;
    cornerRadii?: ChartCornerRadii;
    dataIndex?: number;
    datum: unknown;
    financial?: SceneFinancialHitValue;
    financialDirection?: ChartFinancialDirection;
    formattedCategory?: string;
    formattedClose?: string;
    formattedFrom?: string;
    formattedHigh?: string;
    formattedLow?: string;
    formattedOpen?: string;
    formattedPercentage?: string;
    formattedRadialMax?: string;
    formattedRadialMin?: string;
    formattedSize?: string;
    formattedStackPercentage?: string;
    formattedStackTotal?: string;
    formattedTo?: string;
    formattedValue?: string;
    formattedXValue?: string;
    formattedYCategory?: string;
    fromValue?: number;
    funnel?: import("../../models/chart-funnel.models").ChartFunnelPointMetadata;
    hierarchy?: import("../../models/chart-hierarchy.models").ChartHierarchyPointMetadata;
    high?: number;
    highPoint?: ChartPoint;
    highValue?: number;
    index: number;
    isClamped?: boolean;
    isPositive?: boolean;
    itemId?: string;
    low?: number;
    lowPoint?: ChartPoint;
    lowValue?: number;
    /** Internal logical painter order for raw and sampled marker parity. */
    markerInteractionOrder?: {
        readonly seriesOrdinal: number;
        readonly sourceOrdinal: number;
    };
    open?: number;
    percentage?: number;
    point?: ChartPoint;
    radialMax?: number;
    radialMin?: number;
    radialRatio?: number;
    radius?: number;
    range?: SceneRangeHitValue;
    rangeBand?: SceneRangeBandGeometry;
    rawValue?: unknown;
    renderOrder?: number;
    seriesId: string;
    seriesName: string;
    seriesType: ChartSeriesType;
    sizeValue?: number;
    sliceId?: string;
    stackEnd?: number;
    stackGroup?: string;
    stackMode?: ChartStackMode;
    stackPercentage?: number;
    stackPosition?: "inner" | "outer" | "single";
    stackStart?: number;
    stackTotal?: number;
    toValue?: number;
    value?: unknown;
    valueKind?: ChartPointValueKind;
    visualBounds?: ChartRect;
    visualRadius?: number;
    waterfall?: import("../../models/chart-point-value.models").ChartWaterfallPointValue;
    xAxisId?: string;
    xAxisTitle?: string;
    xIndex?: number;
    xKey: ChartInteractionXKey;
    xValue: unknown;
    yAxisId?: string;
    yAxisTitle?: string;
    yCategory?: unknown;
    yIndex?: number;
    yValue?: number;
}

export interface ChartInteractionBucket {
    readonly anchor: ChartPoint;
    readonly axisDimension?: "x" | "y";
    readonly axisId?: string;
    readonly hits: readonly SceneHitTarget[];
    readonly order: number;
    readonly xAxisId?: string;
    readonly xAxisTitle?: string;
    readonly xKey: ChartInteractionXKey;
    readonly xValue: unknown;
    readonly yAxisId?: string;
    readonly yAxisTitle?: string;
}

export interface ScenePoint {
    animationKey?: string;
    datum: unknown;
    defined: boolean;
    index: number;
    renderOpacity?: number;
    x: number;
    xValue: unknown;
    y: number;
    yValue: number;
}

export interface SceneAreaPoint extends ScenePoint {
    readonly baseX?: number;
    readonly baseY: number;
    readonly stackEndValue?: number;
    readonly stackPercentage?: number;
    readonly stackStartValue?: number;
    readonly stackTotal?: number;
    readonly synthetic?: boolean;
}

export interface SceneRangeAreaPoint {
    readonly animationKey?: string;
    readonly datum: unknown;
    readonly defined: boolean;
    readonly formattedFrom?: string;
    readonly formattedTo?: string;
    readonly fromPoint?: ChartPoint;
    readonly fromValue?: number;
    readonly highPoint?: ChartPoint;
    readonly highValue?: number;
    readonly index: number;
    readonly lowPoint?: ChartPoint;
    readonly lowValue?: number;
    readonly renderOpacity?: number;
    readonly toPoint?: ChartPoint;
    readonly toValue?: number;
    readonly x: number;
    readonly xValue: unknown;
}

export interface SceneMarker {
    readonly animationKey: string;
    readonly datum: unknown;
    readonly formattedSize?: string;
    readonly index: number;
    readonly radius: number;
    readonly renderOpacity?: number;
    readonly sizeValue?: number;
    readonly x: number;
    readonly xValue: unknown;
    readonly y: number;
    readonly yValue: number;
}
