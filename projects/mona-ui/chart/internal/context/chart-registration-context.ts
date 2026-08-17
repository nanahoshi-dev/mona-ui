import type { ElementRef, Signal } from "@angular/core";
import type { ChartAxisLabelTemplateDirective } from "../../directives/chart-axis-label-template.directive";
import type { ChartCenterTemplateDirective } from "../../directives/chart-center-template.directive";
import type { ChartLegendItemTemplateDirective } from "../../directives/chart-legend-item-template.directive";
import type { ChartSliceLabelTemplateDirective } from "../../directives/chart-slice-label-template.directive";
import type { ChartTooltipTemplateDirective } from "../../directives/chart-tooltip-template.directive";
import type { ChartAxisFormatter, ChartAxisPosition, ChartXAxisType } from "../../models/chart-axis.models";
import type {
    ChartPolarFillMode,
    ChartPolarLabelContent,
    ChartPolarLabelPosition,
    ChartRadialCurve,
    ChartRadialFillMode,
    ChartRadialGridShape,
    ChartValueFormatter
} from "../../models/chart-polar.models";
import type { ChartField, ChartPoint } from "../../models/chart.models";
import type {
    ChartAreaFillMode,
    ChartCurve,
    ChartLegendItem,
    ChartSeriesType
} from "../../models/chart-series.models";
import type { ChartTooltipTemplateContext } from "../../models/chart-tooltip.models";
import type { ChartScene } from "../scene/chart-scene";

export const enum ChartInvalidationReason {
    Data = 1 << 0,
    Layout = 1 << 1,
    Style = 1 << 2,
    Interaction = 1 << 3,
    Size = 1 << 4,
    Visibility = 1 << 5
}

export function hasInvalidationReason(
    accumulatedReason: ChartInvalidationReason,
    flag: ChartInvalidationReason
): boolean {
    return (accumulatedReason & flag) !== 0;
}

export interface ChartAxisRegistration {
    axisLine: Signal<boolean>;
    formatter: Signal<ChartAxisFormatter | undefined>;
    gridLines: Signal<boolean>;
    labelTemplate: Signal<ChartAxisLabelTemplateDirective | undefined>;
    max: Signal<Date | number | undefined>;
    min: Signal<Date | number | undefined>;
    nice: Signal<boolean>;
    position: Signal<ChartAxisPosition>;
    tickCount: Signal<number | undefined>;
    title: Signal<string>;
    type: Signal<ChartXAxisType>;
    userClass?: Signal<string>;
    visible: Signal<boolean>;
}
export type ChartCartesianAxisRegistration = ChartAxisRegistration;

export interface ChartAngularAxisRegistration {
    axisLine: Signal<boolean>;
    formatter: Signal<ChartAxisFormatter | undefined>;
    gridLines: Signal<boolean>;
    labelOffset: Signal<number>;
    labels: Signal<boolean>;
    labelTemplate: Signal<ChartAxisLabelTemplateDirective | undefined>;
    rotation: Signal<number>;
    tickCount: Signal<number | undefined>;
    userClass?: Signal<string>;
    visible: Signal<boolean>;
}

export interface ChartRadialAxisRegistration {
    axisLine: Signal<boolean>;
    formatter: Signal<ChartAxisFormatter | undefined>;
    gridLines: Signal<boolean>;
    gridShape: Signal<ChartRadialGridShape>;
    labelAngle: Signal<number>;
    labelOffset: Signal<number>;
    labels: Signal<boolean>;
    labelTemplate: Signal<ChartAxisLabelTemplateDirective | undefined>;
    max: Signal<number | undefined>;
    min: Signal<number | undefined>;
    nice: Signal<boolean>;
    tickCount: Signal<number | undefined>;
    userClass?: Signal<string>;
    visible: Signal<boolean>;
}

export interface ChartLegendRegistration {
    interactive: Signal<boolean>;
    itemTemplate: Signal<ChartLegendItemTemplateDirective | undefined>;
    position: Signal<"bottom" | "left" | "right" | "top">;
}

export interface ChartTooltipRegistration {
    enabled: Signal<boolean>;
    shared: Signal<boolean>;
    template: Signal<ChartTooltipTemplateDirective | undefined>;
}

export interface ChartSeriesRegistrationBase {
    data: Signal<readonly unknown[] | undefined>;
    element: ElementRef<HTMLElement>;
    field: Signal<ChartField>;
    id: string;
    keyField?: Signal<ChartField | undefined>;
    name: Signal<string>;
    type: ChartSeriesType;
    userClass?: Signal<string>;
    visible: Signal<boolean>;
}

export interface ChartCartesianSeriesRegistrationBase extends ChartSeriesRegistrationBase {
    color: Signal<string>;
    toggleVisibility?: () => boolean;
    xField: Signal<ChartField | undefined>;
}

export interface ChartLineSeriesRegistration extends ChartCartesianSeriesRegistrationBase {
    connectNulls?: Signal<boolean>;
    curve?: Signal<ChartCurve>;
    pointRadius?: Signal<number | undefined>;
    showPoints?: Signal<boolean>;
    strokeWidth?: Signal<number | undefined>;
    type: "line";
}

export interface ChartAreaSeriesRegistration extends ChartCartesianSeriesRegistrationBase {
    connectNulls?: Signal<boolean>;
    curve?: Signal<ChartCurve>;
    fillMode?: Signal<ChartAreaFillMode>;
    fillOpacity?: Signal<number | undefined>;
    pointRadius?: Signal<number | undefined>;
    showPoints?: Signal<boolean>;
    strokeWidth?: Signal<number | undefined>;
    type: "area";
}

export interface ChartBarSeriesRegistration extends ChartCartesianSeriesRegistrationBase {
    borderRadius?: Signal<number | undefined>;
    fillOpacity?: Signal<number | undefined>;
    maxBarWidth?: Signal<number | undefined>;
    type: "bar";
}

export interface ChartSectorSeriesRegistrationBase extends ChartSeriesRegistrationBase {
    categoryField: Signal<ChartField>;
    categoryFormatter: Signal<ChartValueFormatter | undefined>;
    colorField: Signal<ChartField | undefined>;
    colors: Signal<readonly string[] | undefined>;
    cornerRadius: Signal<number | undefined>;
    endAngle: Signal<number>;
    fillMode?: Signal<ChartPolarFillMode>;
    fillOpacity: Signal<number | undefined>;
    isSliceVisible: (dataIndex: number) => boolean;
    labelContent: Signal<ChartPolarLabelContent>;
    labelPosition: Signal<ChartPolarLabelPosition>;
    minLabelAngle: Signal<number>;
    outerRadiusRatio: Signal<number>;
    padAngle: Signal<number>;
    showLabels: Signal<boolean>;
    sliceLabelTemplate: Signal<ChartSliceLabelTemplateDirective | undefined>;
    startAngle: Signal<number>;
    strokeColor: Signal<string>;
    strokeWidth: Signal<number | undefined>;
    toggleSliceVisibility: (dataIndex: number) => boolean;
    valueFormatter: Signal<ChartValueFormatter | undefined>;
    visibilityRevision: Signal<number>;
}
export type ChartPolarSeriesRegistrationBase = ChartSectorSeriesRegistrationBase;

export interface ChartPieSeriesRegistration extends ChartSectorSeriesRegistrationBase {
    type: "pie";
}

export interface ChartDonutSeriesRegistration extends ChartSectorSeriesRegistrationBase {
    centerTemplate: Signal<ChartCenterTemplateDirective | undefined>;
    innerRadiusRatio: Signal<number>;
    type: "donut";
}

export interface ChartRadialSeriesRegistrationBase extends ChartSeriesRegistrationBase {
    color: Signal<string>;
    connectNulls: Signal<boolean>;
    curve: Signal<ChartRadialCurve>;
    fillMode: Signal<ChartRadialFillMode>;
    fillOpacity: Signal<number | undefined>;
    pointRadius: Signal<number | undefined>;
    showPoints: Signal<boolean>;
    strokeWidth: Signal<number | undefined>;
    toggleVisibility?: () => boolean;
    valueFormatter: Signal<ChartValueFormatter | undefined>;
}

export interface ChartRadarSeriesRegistration extends ChartRadialSeriesRegistrationBase {
    categoryField: Signal<ChartField>;
    type: "radar";
}

export interface ChartContinuousPolarSeriesRegistration extends ChartRadialSeriesRegistrationBase {
    angleField: Signal<ChartField>;
    type: "polar";
}

export type ChartCartesianSeriesRegistration =
    | ChartAreaSeriesRegistration
    | ChartBarSeriesRegistration
    | ChartLineSeriesRegistration;

export type ChartSectorSeriesRegistration = ChartDonutSeriesRegistration | ChartPieSeriesRegistration;
export type ChartPolarSeriesRegistration = ChartSectorSeriesRegistration;

export type ChartRadialSeriesRegistration = ChartContinuousPolarSeriesRegistration | ChartRadarSeriesRegistration;

export type ChartSeriesRegistration =
    | ChartCartesianSeriesRegistration
    | ChartRadialSeriesRegistration
    | ChartSectorSeriesRegistration;

export interface ChartRegistrationContext {
    invalidate(reason?: ChartInvalidationReason): void;
    legendItems: Signal<readonly ChartLegendItem[]>;
    observeLabelElement?(element: HTMLElement, labelId: string): void;
    registerAngularAxis(registration: ChartAngularAxisRegistration): () => void;
    registerLegend(registration: ChartLegendRegistration): () => void;
    registerRadialAxis(registration: ChartRadialAxisRegistration): () => void;
    registerSeries(registration: ChartSeriesRegistration): () => void;
    registerTooltip(registration: ChartTooltipRegistration): () => void;
    registerXAxis(registration: ChartAxisRegistration): () => void;
    registerYAxis(registration: ChartAxisRegistration): () => void;
    readonly rootData: Signal<readonly unknown[]>;
    scene: Signal<ChartScene | null>;
    toggleLegendItem(item: ChartLegendItem): void;
    toggleSeriesVisibility(seriesId: string): void;
    tooltipContext: Signal<ChartTooltipTemplateContext | null>;
    tooltipPosition: Signal<ChartPoint | null>;
    unobserveLabelElement?(element: HTMLElement, labelId: string): void;
}
