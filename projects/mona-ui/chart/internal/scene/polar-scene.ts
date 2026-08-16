import type { ChartPoint } from "../../models/chart.models";
import type { ChartPolarFillMode, ChartPolarLabelPosition, ChartPolarLabelSide } from "../../models/chart-polar.models";

export interface ChartPolarSeriesStyle {
    fillOpacity: number;
    strokeColor: string;
    strokeWidth: number;
}

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

export interface ScenePolarSlice {
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
    insideLabelPoint: ChartPoint;
    label?: ScenePolarLabel;
    labelPoint: ChartPoint;
    outerRadius: number;
    padAngle: number;
    percentage: number;
    sliceId: string;
    startAngle: number;
    value: number;
    visible: boolean;
}

export interface ChartPolarSeriesScene {
    center: ChartPoint;
    cornerRadius: number;
    fillMode?: ChartPolarFillMode;
    formattedTotal: string;
    id: string;
    innerRadius: number;
    labelPosition?: ChartPolarLabelPosition;
    name: string;
    outerRadius: number;
    padAngle: number;
    showLabels?: boolean;
    slices: readonly ScenePolarSlice[];
    style: ChartPolarSeriesStyle;
    total: number;
    type: "donut" | "pie";
}
