import type { ChartPoint } from "./chart.models";
import type { SceneHitTarget } from "../internal/scene/scene-geometry";

export type ChartHeatmapColorMode = "diverging" | "sequential";
export type HeatmapColorScaleType = "categorical" | "diverging" | "sequential" | "threshold";
export type ChartLegendMode = "auto" | "color" | "series";

export interface ChartColorLegendStop {
    readonly color: string;
    readonly offset: number;
    readonly value: number;
}

export interface ChartColorLegendTick {
    readonly formattedValue: string;
    readonly offset: number;
    readonly value: number;
}

export interface ChartColorLegendScale {
    readonly formattedMax: string;
    readonly formattedMidpoint?: string;
    readonly formattedMin: string;
    readonly kind: "color";
    readonly midpoint?: number;
    readonly mode: ChartHeatmapColorMode;
    readonly stops: readonly ChartColorLegendStop[];
    readonly ticks: readonly ChartColorLegendTick[];
    readonly title: string;
}

export interface ChartHeatmapSeriesStyle {
    readonly baseColor: string;
    readonly borderRadius: number;
    readonly fillOpacity: number;
    readonly highColor?: string;
    readonly lowColor?: string;
    readonly midColor?: string;
    readonly strokeColor: string;
    readonly strokeWidth: number;
}

export interface HeatmapColorStop {
    readonly color: string;
    readonly offset: number;
}

export interface HeatmapThresholdInterval {
    readonly color: string;
    readonly max?: number;
    readonly min?: number;
}

export type HeatmapScale =
    | readonly string[]
    | readonly HeatmapColorStop[]
    | readonly HeatmapThresholdInterval[];

export interface ChartHeatmapCategory {
    readonly formattedValue: string;
    readonly index: number;
    readonly key: string;
    readonly value: unknown;
}

export interface ChartHeatmapCellData<TDatum = unknown> {
    readonly categoryX: string;
    readonly categoryY: string;
    readonly datum: TDatum;
    readonly formattedValue: string;
    readonly formattedX: string;
    readonly formattedY: string;
    readonly numericValue: number | null;
    readonly rawValue: unknown;
    readonly xIndex: number;
    readonly yIndex: number;
}

export interface ChartHeatmapColorScaleScene {
    readonly domain: readonly [number, number];
    readonly emptyCellColor: string;
    readonly formattedMax: string;
    readonly formattedMidpoint?: string;
    readonly formattedMin: string;
    readonly kind: "color";
    readonly midpoint?: number;
    readonly mode: ChartHeatmapColorMode;
    readonly stops: readonly ChartColorLegendStop[];
    readonly ticks: readonly ChartColorLegendTick[];
    readonly title: string;
}

export interface SceneHeatmapCell {
    readonly animationKey: string;
    readonly backgroundColor: string;
    readonly borderColor?: string;
    readonly borderRadius: number;
    readonly borderWidth: number;
    readonly categoryX: string;
    readonly categoryY: string;
    readonly datum: unknown;
    readonly formattedValue: string;
    readonly formattedX: string;
    readonly formattedY: string;
    readonly hasValue: boolean;
    readonly height: number;
    readonly labelColor?: string;
    readonly numericValue: number | null;
    readonly opacity: number;
    readonly rawValue: unknown;
    readonly showLabel: boolean;
    readonly value: number | null;
    readonly width: number;
    readonly x: number;
    readonly xIndex: number;
    readonly y: number;
    readonly yIndex: number;
}

export interface ChartHeatmapSeriesScene {
    readonly cellBorderColor?: string;
    readonly cellBorderRadius: number;
    readonly cellBorderWidth: number;
    readonly cells: readonly SceneHeatmapCell[];
    readonly colorScale: ChartHeatmapColorScaleScene;
    readonly emptyCellColor: string;
    readonly id: string;
    readonly name: string;
    readonly showLabels: boolean;
    readonly type: "heatmap";
    readonly xCategories: readonly ChartHeatmapCategory[];
    readonly yCategories: readonly ChartHeatmapCategory[];
}

export interface HeatmapCellIndex {
    readonly byCoordinate: ReadonlyMap<string, SceneHeatmapCell>;
    readonly byIndex: ReadonlyMap<string, SceneHeatmapCell>;
    readonly cellCount: number;
    get(columnIndex: number, rowIndex: number): SceneHitTarget | undefined;
    getCell(columnIndex: number, rowIndex: number): SceneHeatmapCell | undefined;
    hitTest(pointer: ChartPoint): SceneHitTarget | null;
    readonly xCount: number;
    readonly yCount: number;
}

export interface HeatmapCellClickEvent<T = unknown> {
    readonly categoryX: string;
    readonly categoryY: string;
    readonly datum: T;
    readonly formattedValue: string;
    readonly rawValue: unknown;
    readonly seriesId: string;
    readonly seriesName: string;
    readonly seriesType: "heatmap";
    readonly value: number | null;
    readonly xIndex: number;
    readonly yIndex: number;
}

export type ChartHeatmapLabelFormatter<T = unknown> = (cell: ChartHeatmapCellData<T>) => string;

export type ChartHeatmapCellColorResolver<T = unknown> = (cell: ChartHeatmapCellData<T>) => string;
