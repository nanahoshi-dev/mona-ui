import type { ChartRect } from "../../models/chart.models";
import type { ChartWaterfallDatumKind, ChartWaterfallVisualKind } from "../../models/chart-waterfall.models";
import type { WaterfallHitIndex } from "../interaction/waterfall-hit-index";
import type { CartesianSceneBase } from "./chart-scene";

export interface ChartWaterfallSeriesStyle {
    readonly borderRadius: number;
    readonly connectorColor: string;
    readonly connectorWidth: number;
    readonly decreaseColor: string;
    readonly fillOpacity: number;
    readonly increaseColor: string;
    readonly labelColor?: string;
    readonly neutralColor: string;
    readonly strokeColor: string;
    readonly strokeWidth: number;
    readonly subtotalColor: string;
    readonly totalColor: string;
}

export interface SceneWaterfallBar {
    readonly animationKey: string;
    readonly barEnd: number;
    readonly barStart: number;
    readonly borderRadius: number;
    readonly bounds: ChartRect;
    readonly category: unknown;
    readonly color: string;
    readonly cumulativeAfter: number;
    readonly cumulativeBefore: number;
    readonly dataIndex: number;
    readonly datum: unknown;
    readonly deltaValue?: number;
    readonly formattedCategory: string;
    readonly formattedCumulativeAfter: string;
    readonly formattedCumulativeBefore: string;
    readonly formattedDelta?: string;
    readonly formattedValue: string;
    readonly fromY: number;
    readonly isZeroChange?: boolean;
    readonly itemId: string;
    readonly kind: ChartWaterfallDatumKind;
    readonly renderOpacity?: number;
    readonly renderOrder: number;
    readonly toY: number;
    readonly visualKind: ChartWaterfallVisualKind;
}

export interface SceneWaterfallConnector {
    readonly animationKey: string;
    readonly color: string;
    readonly cumulativeValue: number;
    readonly fromAnimationKey: string;
    readonly fromX: number;
    readonly renderOpacity?: number;
    readonly toAnimationKey: string;
    readonly toX: number;
    readonly width: number;
    readonly y: number;
}

export interface SceneWaterfallLabel {
    readonly barBounds: ChartRect;
    readonly barEnd: number;
    readonly barStart: number;
    readonly bounds: ChartRect;
    readonly category: unknown;
    readonly color: string;
    readonly cumulativeAfter: number;
    readonly cumulativeBefore: number;
    readonly dataIndex: number;
    readonly datum: unknown;
    readonly deltaValue?: number;
    readonly formattedCategory: string;
    readonly formattedCumulativeAfter: string;
    readonly formattedCumulativeBefore: string;
    readonly formattedDelta?: string;
    readonly formattedValue: string;
    readonly isInside?: boolean;
    readonly itemId: string;
    readonly kind: ChartWaterfallDatumKind;
    readonly text: string;
    readonly value: number;
    readonly visualKind: ChartWaterfallVisualKind;
}

export interface ChartWaterfallSeriesScene {
    readonly bars: readonly SceneWaterfallBar[];
    readonly connectors: readonly SceneWaterfallConnector[];
    readonly id: string;
    readonly kindSignature: string;
    readonly labels: readonly SceneWaterfallLabel[];
    readonly name: string;
    readonly renderOpacity?: number;
    readonly sequenceSignature: string;
    readonly style: ChartWaterfallSeriesStyle;
    readonly type: "waterfall";
}

export interface CartesianWaterfallChartScene extends CartesianSceneBase {
    readonly cartesianKind: "waterfall";
    readonly hitIndex: WaterfallHitIndex;
    readonly kindSignature: string;
    readonly sequenceSignature: string;
    readonly series: readonly ChartWaterfallSeriesScene[];
    readonly xAxisType: "category";
}
