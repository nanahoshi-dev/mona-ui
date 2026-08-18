import type { ChartPoint } from "../../models/chart.models";
import type {
    ChartGaugeIndicator,
    ChartRadialArcFillMode,
    ChartRoseScaleMode
} from "../../models/chart-radial-arc.models";
import type { ChartAngularAxisScene, ChartRadialAxisScene } from "./polar-axis-scene";
import type { PolarSceneBase } from "./chart-scene";
import type { SceneHitTarget } from "./scene-geometry";

export interface SceneRadialArcMark {
    readonly animationKey: string;
    readonly category?: unknown;
    readonly color: string;
    readonly cornerRadius: number;
    readonly dataIndex: number;
    readonly datum: unknown;
    readonly endAngle: number;
    readonly formattedCategory?: string;
    readonly formattedValue: string;
    readonly innerRadius: number;
    readonly itemId: string;
    readonly normalizedValue?: number;
    readonly outerRadius: number;
    readonly padAngle: number;
    readonly rawValue: number;
    readonly renderOpacity?: number;
    readonly startAngle: number;
    readonly visible: boolean;
}

export interface SceneRadialTrack {
    readonly color: string;
    readonly endAngle: number;
    readonly innerRadius: number;
    readonly opacity: number;
    readonly outerRadius: number;
    readonly startAngle: number;
}

export interface SceneGaugeValue {
    readonly animationKey: string;
    readonly dataIndex: number;
    readonly datum: unknown;
    readonly endAngle: number;
    readonly formattedValue: string;
    readonly innerRadius: number;
    readonly isClamped: boolean;
    readonly max: number;
    readonly min: number;
    readonly outerRadius: number;
    readonly ratio: number;
    readonly rawValue: number;
    readonly renderOpacity?: number;
    readonly startAngle: number;
}

export interface SceneGaugeNeedle {
    readonly angle: number;
    readonly color: string;
    readonly hubColor: string;
    readonly hubRadius: number;
    readonly length: number;
    readonly width: number;
}

export interface ChartRadialArcSeriesStyle {
    readonly fillOpacity: number;
    readonly strokeColor: string;
    readonly strokeSource: "default" | "explicit";
    readonly strokeWidth: number;
    readonly trackColor: string;
    readonly trackOpacity: number;
}

export interface ChartGaugeSeriesStyle extends ChartRadialArcSeriesStyle {
    readonly color: string;
    readonly hubColor: string;
    readonly needleColor: string;
}

export interface RoseCategoryScene {
    readonly category: unknown;
    readonly categoryKey: string;
    readonly endAngle: number;
    readonly formattedCategory: string;
    readonly index: number;
    readonly midAngle: number;
    readonly startAngle: number;
}

export interface ChartRadialBarSeriesScene {
    readonly barGap: number;
    readonly fillMode: ChartRadialArcFillMode;
    readonly id: string;
    readonly marks: readonly SceneRadialArcMark[];
    readonly name: string;
    readonly renderOpacity?: number;
    readonly style: ChartRadialArcSeriesStyle;
    readonly tracks: readonly SceneRadialTrack[];
    readonly type: "radialBar";
}

export interface ChartRoseSeriesScene {
    readonly angularCategories: readonly RoseCategoryScene[];
    readonly fillMode: ChartRadialArcFillMode;
    readonly id: string;
    readonly marks: readonly SceneRadialArcMark[];
    readonly name: string;
    readonly renderOpacity?: number;
    readonly scaleMode: ChartRoseScaleMode;
    readonly style: ChartRadialArcSeriesStyle;
    readonly type: "rose";
}

export interface ChartGaugeSeriesScene {
    readonly fillMode: ChartRadialArcFillMode;
    readonly id: string;
    readonly indicator: ChartGaugeIndicator;
    readonly name: string;
    readonly needle?: SceneGaugeNeedle;
    readonly renderOpacity?: number;
    readonly showValue: boolean;
    readonly style: ChartGaugeSeriesStyle;
    readonly track: SceneRadialTrack;
    readonly type: "gauge";
    readonly value: SceneGaugeValue;
}

export type ChartRadialArcSeriesScene =
    | ChartGaugeSeriesScene
    | ChartRadialBarSeriesScene
    | ChartRoseSeriesScene;

export interface PolarArcHitIndex {
    query(pointer: ChartPoint): readonly SceneHitTarget[];
}

export interface PolarArcChartScene extends PolarSceneBase {
    readonly angularAxis?: ChartAngularAxisScene;
    readonly arcMode: "gauge" | "radialBar" | "rose";
    readonly hitIndex?: PolarArcHitIndex;
    readonly innerRadius: number;
    readonly outerRadius: number;
    readonly polarKind: "arc";
    readonly radialAxis?: ChartRadialAxisScene;
    readonly series: readonly ChartRadialArcSeriesScene[];
}
