import type { ChartAxisPosition, ChartAxisTick } from "../../models/chart-axis.models";
import type { ChartAreaFillMode, ChartCurve } from "../../models/chart-series.models";
import type { ChartSeriesStyle } from "../../models/chart-style.models";
import type { SceneBar, SceneMarker, ScenePoint } from "./scene-geometry";

export interface ChartAxisScene {
    axis: "x" | "y";
    axisLine: boolean;
    gridLines: boolean;
    position: ChartAxisPosition;
    ticks: readonly ChartAxisTick[];
    title: string;
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
}

export interface ChartLineSeriesScene {
    connectNulls: boolean;
    curve: ChartCurve;
    id: string;
    name: string;
    points: readonly ScenePoint[];
    renderOpacity?: number;
    showPoints: boolean;
    style: ChartSeriesStyle;
    type: "line";
}

export interface ChartAreaSeriesScene {
    baselineY: number;
    connectNulls: boolean;
    curve: ChartCurve;
    fillMode: ChartAreaFillMode;
    fillOpacity: number;
    id: string;
    name: string;
    points: readonly ScenePoint[];
    renderOpacity?: number;
    showPoints: boolean;
    style: ChartSeriesStyle;
    type: "area";
}

export interface ChartBarSeriesScene {
    bars: readonly SceneBar[];
    borderRadius: number;
    fillOpacity: number;
    id: string;
    name: string;
    renderOpacity?: number;
    style: ChartSeriesStyle;
    type: "bar";
}

export type ChartSeriesScene =
    | ChartAreaSeriesScene
    | ChartBarSeriesScene
    | ChartBubbleSeriesScene
    | ChartLineSeriesScene
    | ChartScatterSeriesScene;

