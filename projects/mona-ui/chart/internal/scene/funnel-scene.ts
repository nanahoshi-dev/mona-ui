import type { ChartPoint, ChartRect } from "../../models/chart.models";
import type { ChartFunnelOrientation } from "../../models/chart-funnel.models";
import type { FunnelHitIndex } from "../interaction/funnel-hit-index";
import type { CartesianSceneBase } from "./chart-scene";

export interface ChartFunnelSeriesStyle {
    readonly baseColor: string;
    readonly fillOpacity: number;
    readonly strokeColor: string;
    readonly strokeWidth: number;
}

export interface SceneFunnelStage {
    readonly animationKey: string;
    readonly bounds: ChartRect;
    readonly category: unknown;
    readonly conversionRate?: number;
    readonly dataIndex: number;
    readonly datum: unknown;
    readonly dropOff?: number;
    readonly fillColor: string;
    readonly formattedCategory: string;
    readonly formattedConversionRate?: string;
    readonly formattedOverallConversionRate?: string;
    readonly formattedValue: string;
    readonly overallConversionRate?: number;
    readonly polygon: readonly [ChartPoint, ChartPoint, ChartPoint, ChartPoint];
    readonly previousValue?: number;
    readonly renderOpacity?: number;
    readonly renderOrder: number;
    readonly sourceIndex: number;
    readonly stageId: string;
    readonly stageIndex: number;
    readonly textColor: string;
    readonly value: number;
}

export interface SceneFunnelLabel {
    readonly bounds: ChartRect;
    readonly category: unknown;
    readonly color: string;
    readonly conversionRate?: number;
    readonly dataIndex: number;
    readonly datum: unknown;
    readonly dropOff?: number;
    readonly formattedCategory: string;
    readonly formattedConversionRate?: string;
    readonly formattedOverallConversionRate?: string;
    readonly formattedValue: string;
    readonly overallConversionRate?: number;
    readonly previousValue?: number;
    readonly stageId: string;
    readonly stageIndex: number;
    readonly text: string;
    readonly value: number;
}

export interface ChartFunnelSeriesScene {
    readonly id: string;
    readonly labels: readonly SceneFunnelLabel[];
    readonly name: string;
    readonly orientation: ChartFunnelOrientation;
    readonly renderOpacity?: number;
    readonly sequenceSignature: string;
    readonly stages: readonly SceneFunnelStage[];
    readonly style: ChartFunnelSeriesStyle;
    readonly type: "funnel";
}

export interface CartesianFunnelChartScene extends CartesianSceneBase {
    readonly axes: readonly [];
    readonly cartesianKind: "funnel";
    readonly hitIndex: FunnelHitIndex;
    readonly orientation: ChartFunnelOrientation;
    readonly sequenceSignature: string;
    readonly series: readonly ChartFunnelSeriesScene[];
}
