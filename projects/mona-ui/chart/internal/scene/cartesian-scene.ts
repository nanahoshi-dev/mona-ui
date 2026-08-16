import type { ChartAxisPosition, ChartAxisTick } from "../../models/chart-axis.models";
import type { ChartAreaFillMode, ChartCurve } from "../../models/chart-series.models";
import type { ChartSeriesStyle } from "../../models/chart-style.models";
import type { SceneBar, ScenePoint } from "./scene-geometry";

export interface ChartAxisScene {
    axis: "x" | "y";
    axisLine: boolean;
    gridLines: boolean;
    position: ChartAxisPosition;
    ticks: readonly ChartAxisTick[];
    title: string;
    visible: boolean;
}

export interface ChartLineSeriesScene {
    connectNulls: boolean;
    curve: ChartCurve;
    id: string;
    name: string;
    points: readonly ScenePoint[];
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
    style: ChartSeriesStyle;
    type: "bar";
}

export type ChartSeriesScene = ChartAreaSeriesScene | ChartBarSeriesScene | ChartLineSeriesScene;
