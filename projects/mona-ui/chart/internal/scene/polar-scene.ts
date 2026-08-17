import type { ChartPoint } from "../../models/chart.models";
import type { ChartPolarFillMode, ChartPolarLabelPosition, ChartPolarLabelSide } from "../../models/chart-polar.models";

export interface ChartSectorSeriesStyle {
    fillOpacity: number;
    strokeColor: string;
    strokeSource: "default" | "explicit";
    strokeWidth: number;
}
export type ChartPolarSeriesStyle = ChartSectorSeriesStyle;

export interface ScenePolarLabel {
    readonly arcAnchor: ChartPoint;
    readonly elbow: ChartPoint;
    readonly heightEstimate: number;
    readonly lineEnd: ChartPoint;
    readonly naturalPosition: ChartPoint;
    readonly position: ChartPoint;
    readonly side: ChartPolarLabelSide;
    readonly visible: boolean;
    readonly widthEstimate: number;
}

export interface SceneSectorSlice {
    animationKey?: string;
    category: unknown;
    centroid: ChartPoint;
    color: string;
    cornerRadius: number;
    dataIndex: number;
    datum: unknown;
    endAngle: number;
    formattedCategory: string;
    formattedPercentage: string;
    formattedValue: string;
    innerRadius: number;
    insideLabelBackgroundColor: string;
    insideLabelPoint: ChartPoint;
    label?: ScenePolarLabel;
    outerRadius: number;
    padAngle: number;
    percentage: number;
    sliceId: string;
    startAngle: number;
    value: number;
    visible: boolean;
}
export type ScenePolarSlice = SceneSectorSlice;

export interface ChartSectorSeriesScene {
    center: ChartPoint;
    cornerRadius: number;
    fillMode: ChartPolarFillMode;
    formattedTotal: string;
    id: string;
    innerRadius: number;
    labelPosition: ChartPolarLabelPosition;
    name: string;
    outerRadius: number;
    padAngle: number;
    renderOpacity?: number;
    showLabels: boolean;
    slices: readonly SceneSectorSlice[];
    style: ChartSectorSeriesStyle;
    total: number;
    type: "donut" | "pie";
}
export type ChartPolarSeriesScene = ChartSectorSeriesScene;
