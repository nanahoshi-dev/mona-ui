import type { ChartPoint } from "../../models/chart.models";
import type { ChartRadialCurve, ChartRadialFillMode, ChartRadialGridShape } from "../../models/chart-polar.models";

export interface SceneRadialPoint {
    angle: number;
    animationKey?: string;
    category?: unknown;
    categoryKey?: string;
    dataIndex: number;
    datum: unknown;
    defined: boolean;
    formattedAngle?: string;
    formattedCategory?: string;
    formattedValue: string;
    normalizedAngle?: number;
    point: ChartPoint;
    radius: number;
    rawAngle?: number;
    value: number;
}

export interface ChartRadarSeriesScene {
    color: string;
    connectNulls: boolean;
    curve: ChartRadialCurve;
    fillMode: ChartRadialFillMode;
    fillOpacity: number;
    id: string;
    maxRenderedRadius: number;
    name: string;
    pointRadius: number;
    points: readonly SceneRadialPoint[];
    renderOpacity?: number;
    showPoints: boolean;
    strokeWidth: number;
    type: "radar";
}

export interface ChartContinuousPolarSeriesScene {
    color: string;
    connectNulls: boolean;
    curve: ChartRadialCurve;
    fillMode: ChartRadialFillMode;
    fillOpacity: number;
    id: string;
    maxRenderedRadius: number;
    name: string;
    pointRadius: number;
    points: readonly SceneRadialPoint[];
    renderOpacity?: number;
    showPoints: boolean;
    strokeWidth: number;
    type: "polar";
}

export type ChartRadialSeriesScene = ChartContinuousPolarSeriesScene | ChartRadarSeriesScene;

export interface ChartAngularAxisTick {
    angle: number;
    formattedValue: string;
    index: number;
    labelPoint: ChartPoint;
    tickKey: string;
    value: unknown;
    visible: boolean;
}

export interface ChartAngularAxisScene {
    axisLine: boolean;
    gridLines: boolean;
    labelOffset: number;
    labels: boolean;
    mode: "category" | "degrees";
    rotation: number;
    ticks: readonly ChartAngularAxisTick[];
    visible: boolean;
}

export interface ChartRadialAxisTick {
    formattedValue: string;
    index: number;
    isZero: boolean;
    labelPoint: ChartPoint;
    radius: number;
    tickKey: string;
    value: number;
    visible: boolean;
}

export interface ChartRadialAxisScene {
    axisLine: boolean;
    domain: readonly [number, number];
    gridLines: boolean;
    gridShape: "circle" | "polygon";
    labelAngle: number;
    labelOffset: number;
    labels: boolean;
    ticks: readonly ChartRadialAxisTick[];
    visible: boolean;
}
