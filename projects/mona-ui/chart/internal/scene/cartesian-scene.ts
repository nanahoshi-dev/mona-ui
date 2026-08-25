import type { ChartAxisPosition, ChartAxisTick } from "../../models/chart-axis.models";
import type { ChartBarOrientation } from "../../models/chart-bar.models";
import type { ChartFinancialFillMode } from "../../models/chart-financial.models";
import type { ChartAreaFillMode, ChartCurve } from "../../models/chart-series.models";
import type { ChartSeriesStyle } from "../../models/chart-style.models";
import type {
    SceneAreaPoint,
    SceneBar,
    SceneCandlestickMark,
    SceneMarker,
    SceneOhlcMark,
    ScenePoint,
    SceneRangeAreaPoint,
    SceneRangeBar
} from "./scene-geometry";

export interface ChartAxisSceneTick<T = unknown> extends ChartAxisTick<T> {
    labelVisible?: boolean;
    tickKey?: string;
    unrotatedHeight?: number;
    unrotatedWidth?: number;
}

export interface ChartAxisScene {
    axis: "x" | "y";
    axisId?: string;
    axisLine: boolean;
    formatter?: import("../../models/chart-axis.models").ChartAxisFormatter<unknown>;
    gridLines: boolean;
    gutter?: number;
    isPrimary?: boolean;
    labelMaxWidth?: number;
    labelPadding?: number;
    labelRotation?: number;
    labels?: boolean;
    position: ChartAxisPosition;
    registrationId?: string;
    scaleType?: string;
    sideOffset?: number;
    stackIndex?: number;
    tickMarks?: boolean;
    tickSize?: number;
    ticks: readonly ChartAxisSceneTick[];
    title: string;
    titlePadding?: number;
    unitMode?: "percent" | "raw";
    visible: boolean;
}

export interface ChartMarkerSeriesStyle {
    readonly color: string;
    readonly fillOpacity: number;
    readonly strokeColor: string;
    readonly strokeWidth: number;
}

export interface ChartScatterSeriesScene {
    readonly id: string;
    readonly markers: readonly SceneMarker[];
    readonly name: string;
    readonly pointRadius: number;
    readonly renderOpacity?: number;
    readonly style: ChartMarkerSeriesStyle;
    readonly type: "scatter";
    readonly xAxisId: string;
    readonly yAxisId: string;
}

export interface ChartBubbleSeriesScene {
    readonly id: string;
    readonly markers: readonly SceneMarker[];
    readonly maxRadius: number;
    readonly minRadius: number;
    readonly name: string;
    readonly renderOpacity?: number;
    readonly style: ChartMarkerSeriesStyle;
    readonly type: "bubble";
    readonly xAxisId: string;
    readonly yAxisId: string;
}

export interface ChartLineSeriesScene {
    connectNulls: boolean;
    curve: ChartCurve;
    id: string;
    name: string;
    orientation?: ChartBarOrientation;
    points: readonly ScenePoint[];
    renderOpacity?: number;
    showPoints: boolean;
    style: ChartSeriesStyle;
    type: "line";
    xAxisId: string;
    yAxisId: string;
}

export interface ChartAreaSeriesScene {
    baselineX?: number;
    baselineY: number;
    connectNulls: boolean;
    curve: ChartCurve;
    fillMode: ChartAreaFillMode;
    fillOpacity: number;
    id: string;
    name: string;
    orientation?: ChartBarOrientation;
    points: readonly SceneAreaPoint[];
    renderOpacity?: number;
    showPoints: boolean;
    style: ChartSeriesStyle;
    type: "area";
    xAxisId: string;
    yAxisId: string;
}

export interface ChartBarSeriesScene {
    bars: readonly SceneBar[];
    borderRadius: number;
    fillOpacity: number;
    id: string;
    name: string;
    orientation?: ChartBarOrientation;
    renderOpacity?: number;
    style: ChartSeriesStyle;
    type: "bar";
    xAxisId: string;
    yAxisId: string;
}

export interface ChartRangeBarSeriesScene {
    readonly bars: readonly SceneRangeBar[];
    readonly borderRadius: number;
    readonly fillOpacity: number;
    readonly id: string;
    readonly name: string;
    readonly orientation?: ChartBarOrientation;
    readonly renderOpacity?: number;
    readonly style: ChartSeriesStyle;
    readonly type: "rangeBar";
    readonly xAxisId: string;
    readonly yAxisId: string;
}

export interface ChartRangeAreaSeriesScene {
    readonly connectNulls: boolean;
    readonly curve: ChartCurve;
    readonly fillOpacity: number;
    readonly id: string;
    readonly name: string;
    readonly pointRadius: number;
    readonly points: readonly SceneRangeAreaPoint[];
    readonly renderOpacity?: number;
    readonly showPoints: boolean;
    readonly strokeWidth: number;
    readonly style: ChartSeriesStyle;
    readonly type: "rangeArea";
    readonly xAxisId: string;
    readonly yAxisId: string;
}

export interface ChartFinancialSeriesStyle {
    readonly color?: string;
    readonly fallingColor: string;
    readonly hollowFillColor?: string;
    readonly neutralColor: string;
    readonly opacity?: number;
    readonly risingColor: string;
    readonly wickColor?: string;
    readonly wickWidth: number;
}

export interface ChartCandlestickSeriesScene {
    readonly bodyWidth: number;
    readonly fillMode: ChartFinancialFillMode;
    readonly id: string;
    readonly marks: readonly SceneCandlestickMark[];
    readonly maxBodyWidth: number;
    readonly name: string;
    readonly renderOpacity?: number;
    readonly style: ChartFinancialSeriesStyle;
    readonly type: "candlestick";
    readonly wickWidth: number;
    readonly xAxisId: string;
    readonly yAxisId: string;
}

export interface ChartOhlcSeriesScene {
    readonly bodyWidth: number;
    readonly id: string;
    readonly marks: readonly SceneOhlcMark[];
    readonly maxBodyWidth: number;
    readonly name: string;
    readonly renderOpacity?: number;
    readonly style: ChartFinancialSeriesStyle;
    readonly tickWidth: number;
    readonly type: "ohlc";
    readonly wickWidth: number;
    readonly xAxisId: string;
    readonly yAxisId: string;
}

export type ChartSeriesScene =
    | ChartAreaSeriesScene
    | ChartBarSeriesScene
    | ChartBubbleSeriesScene
    | ChartCandlestickSeriesScene
    | ChartLineSeriesScene
    | ChartOhlcSeriesScene
    | ChartRangeAreaSeriesScene
    | ChartRangeBarSeriesScene
    | ChartScatterSeriesScene;
