import type { ElementRef, Signal } from "@angular/core";
import type { ChartAnnotationLabelTemplateDirective } from "../../directives/chart-annotation-label-template.directive";
import type { ChartAxisLabelTemplateDirective } from "../../directives/chart-axis-label-template.directive";
import type { ChartCenterTemplateDirective } from "../../directives/chart-center-template.directive";
import type { ChartCrosshairLabelTemplateDirective } from "../../directives/chart-crosshair-label-template.directive";
import type { ChartDataLabelTemplateDirective } from "../../directives/chart-data-label-template.directive";
import type { ChartGaugeCenterTemplateDirective } from "../../directives/chart-gauge-center-template.directive";
import type { ChartLegendItemTemplateDirective } from "../../directives/chart-legend-item-template.directive";
import type { ChartReferenceLabelTemplateDirective } from "../../directives/chart-reference-label-template.directive";
import type { ChartSliceLabelTemplateDirective } from "../../directives/chart-slice-label-template.directive";
import type { ChartTreemapLabelTemplateDirective } from "../../directives/chart-treemap-label-template.directive";
import type { ChartTooltipTemplateDirective } from "../../directives/chart-tooltip-template.directive";
import type { ChartTreemapSort, ChartTreemapTile } from "../../models/chart-treemap.models";
import type {
    ChartAnnotationAxisValue,
    ChartAnnotationLabelPlacement,
    ChartAnnotationMarker,
    ChartOverlayLayer,
    ChartReferenceLabelPosition,
    ChartReferenceLineStyle
} from "../../models/chart-annotation.models";
import type {
    ChartAxisFormatter,
    ChartAxisLabelRotation,
    ChartAxisPosition,
    ChartXAxisPosition,
    ChartXAxisType,
    ChartYAxisPosition,
    ChartYAxisType
} from "../../models/chart-axis.models";
import type { ChartBarOrientation } from "../../models/chart-bar.models";
import type {
    ChartBrushActivation,
    ChartBrushChangeEvent,
    ChartBrushHitPolicy,
    ChartBrushMode,
    ChartBrushSelectionBehavior
} from "../../models/chart-brush.models";
import type {
    ChartCrosshairLineStyle,
    ChartCrosshairMode,
    ChartCrosshairSnapMode
} from "../../models/chart-crosshair.models";
import type { ChartDataLabelsInput } from "../../models/chart-data-label.models";
import type {
    ChartSelectionChangeEvent,
    ChartSelectionMode
} from "../../models/chart-selection.models";
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
import type { ChartFinancialFillMode } from "../../models/chart-financial.models";
import type { ChartColorLegendScale, ChartHeatmapColorMode } from "../../models/chart-heatmap.models";
import type {
    ChartGaugeIndicator,
    ChartRadialArcFillMode,
    ChartRoseScaleMode
} from "../../models/chart-radial-arc.models";
import type {
    ChartAreaFillMode,
    ChartCurve,
    ChartLegendItem,
    ChartSeriesType
} from "../../models/chart-series.models";
import type { ChartTooltipTemplateContext } from "../../models/chart-tooltip.models";
import type { ChartStackMode } from "../../models/chart-stack.models";
import type { ChartScene } from "../scene/chart-scene";

export const enum ChartInvalidationReason {
    Data = 1 << 0,
    Layout = 1 << 1,
    Style = 1 << 2,
    Interaction = 1 << 3,
    Size = 1 << 4,
    Visibility = 1 << 5,
    Viewport = 1 << 6,
    Chrome = 1 << 7
}

export function hasInvalidationReason(
    accumulatedReason: ChartInvalidationReason,
    flag: ChartInvalidationReason
): boolean {
    return (accumulatedReason & flag) !== 0;
}

export interface ChartAxisRegistrationBase {
    axisId: Signal<string | undefined>;
    axisLine: Signal<boolean>;
    exponent?: Signal<number | undefined>;
    formatter: Signal<ChartAxisFormatter | undefined>;
    gridLines: Signal<boolean | undefined>;
    labelMaxWidth?: Signal<number | undefined>;
    labelPadding?: Signal<number | undefined>;
    labelRotation?: Signal<ChartAxisLabelRotation | undefined>;
    labels?: Signal<boolean | undefined>;
    labelTemplate: Signal<ChartAxisLabelTemplateDirective | undefined>;
    logBase?: Signal<number | undefined>;
    nice: Signal<boolean>;
    registrationId: string;
    symlogConstant?: Signal<number | undefined>;
    tickCount: Signal<number | undefined>;
    tickMarks?: Signal<boolean | undefined>;
    tickSize?: Signal<number | undefined>;
    title: Signal<string>;
    titlePadding?: Signal<number | undefined>;
    userClass?: Signal<string>;
    visible: Signal<boolean>;
}

export interface ChartXAxisRegistration extends ChartAxisRegistrationBase {
    field?: Signal<ChartField | undefined>;
    max: Signal<Date | number | undefined>;
    min: Signal<Date | number | undefined>;
    position: Signal<ChartXAxisPosition>;
    type: Signal<ChartXAxisType>;
}

export interface ChartYAxisRegistration extends ChartAxisRegistrationBase {
    max: Signal<number | undefined>;
    min: Signal<number | undefined>;
    position: Signal<ChartYAxisPosition>;
    type: Signal<ChartYAxisType>;
}

export type ChartAxisRegistration = ChartXAxisRegistration | ChartYAxisRegistration;
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
    id: string;
    keyField?: Signal<ChartField | undefined>;
    name: Signal<string>;
    type: ChartSeriesType;
    userClass?: Signal<string>;
    visible: Signal<boolean>;
}

export interface ChartScalarSeriesRegistrationBase extends ChartSeriesRegistrationBase {
    field: Signal<ChartField>;
}

export interface ChartCartesianSeriesRegistrationBase extends ChartSeriesRegistrationBase {
    color: Signal<string>;
    dataLabels?: Signal<ChartDataLabelsInput>;
    dataLabelTemplate?: Signal<ChartDataLabelTemplateDirective | undefined>;
    toggleVisibility?: () => boolean;
    xAxisId: Signal<string | undefined>;
    xField: Signal<ChartField | undefined>;
    yAxisId: Signal<string | undefined>;
}

export interface ChartCartesianScalarSeriesRegistrationBase
    extends ChartCartesianSeriesRegistrationBase,
        ChartScalarSeriesRegistrationBase {}

export interface ChartCartesianRangeSeriesRegistrationBase extends ChartCartesianSeriesRegistrationBase {
    fromField: Signal<ChartField>;
    toField: Signal<ChartField>;
    valueFormatter: Signal<ChartValueFormatter | undefined>;
}

export interface ChartLineSeriesRegistration extends ChartCartesianScalarSeriesRegistrationBase {
    connectNulls?: Signal<boolean>;
    curve?: Signal<ChartCurve>;
    pointRadius?: Signal<number | undefined>;
    showPoints?: Signal<boolean>;
    strokeWidth?: Signal<number | undefined>;
    type: "line";
}

export interface ChartAreaSeriesRegistration extends ChartCartesianScalarSeriesRegistrationBase {
    connectNulls?: Signal<boolean>;
    curve?: Signal<ChartCurve>;
    fillMode?: Signal<ChartAreaFillMode>;
    fillOpacity?: Signal<number | undefined>;
    pointRadius?: Signal<number | undefined>;
    showPoints?: Signal<boolean>;
    stack: Signal<string | undefined>;
    stackMode: Signal<ChartStackMode>;
    strokeWidth?: Signal<number | undefined>;
    type: "area";
    valueFormatter?: Signal<ChartValueFormatter | undefined>;
}

export interface ChartBarSeriesRegistration extends ChartCartesianScalarSeriesRegistrationBase {
    borderRadius?: Signal<number | undefined>;
    fillOpacity?: Signal<number | undefined>;
    maxBarWidth?: Signal<number | undefined>;
    orientation?: Signal<ChartBarOrientation | undefined>;
    stack: Signal<string | undefined>;
    stackMode: Signal<ChartStackMode>;
    type: "bar";
    valueFormatter?: Signal<ChartValueFormatter | undefined>;
}

export interface ChartRangeBarSeriesRegistration extends ChartCartesianRangeSeriesRegistrationBase {
    borderRadius?: Signal<number | undefined>;
    fillOpacity?: Signal<number | undefined>;
    maxBarWidth?: Signal<number | undefined>;
    orientation?: Signal<ChartBarOrientation | undefined>;
    type: "rangeBar";
}

export interface ChartRangeAreaSeriesRegistration extends ChartCartesianRangeSeriesRegistrationBase {
    connectNulls?: Signal<boolean>;
    curve?: Signal<ChartCurve>;
    fillOpacity?: Signal<number | undefined>;
    pointRadius?: Signal<number | undefined>;
    showPoints?: Signal<boolean>;
    strokeWidth?: Signal<number | undefined>;
    type: "rangeArea";
}

export interface ChartCartesianMarkerSeriesRegistrationBase extends ChartCartesianScalarSeriesRegistrationBase {
    fillOpacity?: Signal<number | undefined>;
    strokeColor?: Signal<string>;
    strokeWidth?: Signal<number | undefined>;
}

export interface ChartScatterSeriesRegistration extends ChartCartesianMarkerSeriesRegistrationBase {
    pointRadius?: Signal<number | undefined>;
    type: "scatter";
}

export interface ChartBubbleSeriesRegistration extends ChartCartesianMarkerSeriesRegistrationBase {
    maxRadius: Signal<number>;
    minRadius: Signal<number>;
    sizeField: Signal<ChartField>;
    sizeFormatter?: Signal<ChartValueFormatter | undefined>;
    type: "bubble";
}

export interface ChartSectorSeriesRegistrationBase extends ChartScalarSeriesRegistrationBase {
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

export interface ChartRadialSeriesRegistrationBase extends ChartScalarSeriesRegistrationBase {
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

export interface ChartHeatmapSeriesRegistration {
    readonly borderRadius: Signal<number | undefined>;
    readonly cellGap: Signal<number>;
    readonly color: Signal<string>;
    readonly colorMode: Signal<ChartHeatmapColorMode>;
    readonly colors: Signal<readonly string[] | undefined>;
    readonly data: Signal<readonly unknown[] | undefined>;
    readonly element?: ElementRef<HTMLElement>;
    readonly field: Signal<ChartField>;
    readonly fillOpacity: Signal<number | undefined>;
    readonly id: string;
    readonly keyField: Signal<ChartField | undefined>;
    readonly max: Signal<number | undefined>;
    readonly midpoint: Signal<number | undefined>;
    readonly min: Signal<number | undefined>;
    readonly name: Signal<string>;
    readonly showValues: Signal<boolean>;
    readonly strokeColor: Signal<string>;
    readonly strokeWidth: Signal<number | undefined>;
    readonly type: "heatmap";
    readonly userClass?: Signal<string>;
    readonly valueFormatter: Signal<ChartValueFormatter | undefined>;
    readonly visible: Signal<boolean>;
    readonly xCategories: Signal<readonly unknown[] | undefined>;
    readonly xField: Signal<ChartField | undefined>;
    readonly yCategories: Signal<readonly unknown[] | undefined>;
    readonly yField: Signal<ChartField>;
}

export interface ChartFinancialSeriesRegistrationBase {
    readonly bodyWidth: Signal<number | undefined>;
    readonly bodyWidthRatio: Signal<number>;
    readonly closeField: Signal<ChartField>;
    readonly color?: Signal<string | undefined>;
    readonly data: Signal<readonly unknown[] | undefined>;
    readonly dataLabels?: Signal<ChartDataLabelsInput>;
    readonly dataLabelTemplate?: Signal<ChartDataLabelTemplateDirective | undefined>;
    readonly element?: ElementRef<HTMLElement>;
    readonly fallingColor: Signal<string>;
    readonly highField: Signal<ChartField>;
    readonly id: string;
    readonly keyField: Signal<ChartField | undefined>;
    readonly lowField: Signal<ChartField>;
    readonly maxBodyWidth: Signal<number>;
    readonly name: Signal<string>;
    readonly neutralColor: Signal<string>;
    readonly opacity: Signal<number | undefined>;
    readonly openField: Signal<ChartField>;
    readonly risingColor: Signal<string>;
    readonly userClass?: Signal<string>;
    readonly valueFormatter: Signal<ChartAxisFormatter | undefined>;
    readonly visible: Signal<boolean>;
    readonly wickColor: Signal<string | undefined>;
    readonly wickWidth: Signal<number>;
    readonly xAxisId: Signal<string | undefined>;
    readonly xField: Signal<ChartField | undefined>;
    readonly yAxisId: Signal<string | undefined>;
}

export interface ChartCandlestickSeriesRegistration extends ChartFinancialSeriesRegistrationBase {
    readonly fillMode: Signal<ChartFinancialFillMode>;
    readonly type: "candlestick";
}

export interface ChartOhlcSeriesRegistration extends ChartFinancialSeriesRegistrationBase {
    readonly tickLength?: Signal<number | undefined>;
    readonly tickWidth?: Signal<number | undefined>;
    readonly type: "ohlc";
}

export interface ChartDatumVisibilityRegistration {
    readonly datumVisibilityRevision: Signal<number>;
    isDatumVisible(itemId: string): boolean;
    toggleDatumVisibility(itemId: string): boolean;
}

export interface ChartRadialArcSeriesRegistrationBase extends ChartSeriesRegistrationBase {
    readonly fillMode?: Signal<ChartRadialArcFillMode>;
    readonly fillOpacity?: Signal<number | undefined>;
}

export interface ChartRadialBarSeriesRegistration
    extends ChartRadialArcSeriesRegistrationBase,
        ChartDatumVisibilityRegistration {
    readonly barGap: Signal<number>;
    readonly barThickness?: Signal<number | undefined>;
    readonly categoryField: Signal<ChartField>;
    readonly categoryFormatter?: Signal<ChartValueFormatter | undefined>;
    readonly colorField?: Signal<ChartField | undefined>;
    readonly colors?: Signal<readonly string[] | undefined>;
    readonly cornerRadius?: Signal<number | undefined>;
    readonly endAngle: Signal<number>;
    readonly field: Signal<ChartField>;
    readonly innerRadiusRatio: Signal<number>;
    readonly max?: Signal<number | undefined>;
    readonly min?: Signal<number | undefined>;
    readonly outerRadiusRatio: Signal<number>;
    readonly showTrack: Signal<boolean>;
    readonly startAngle: Signal<number>;
    readonly strokeColor: Signal<string>;
    readonly strokeWidth?: Signal<number | undefined>;
    readonly trackColor: Signal<string>;
    readonly trackOpacity?: Signal<number | undefined>;
    readonly type: "radialBar";
    readonly valueFormatter?: Signal<ChartValueFormatter | undefined>;
}

export interface ChartRoseSeriesRegistration
    extends ChartRadialArcSeriesRegistrationBase,
        ChartDatumVisibilityRegistration {
    readonly categoryField: Signal<ChartField>;
    readonly categoryFormatter?: Signal<ChartValueFormatter | undefined>;
    readonly colorField?: Signal<ChartField | undefined>;
    readonly colors?: Signal<readonly string[] | undefined>;
    readonly cornerRadius?: Signal<number | undefined>;
    readonly endAngle: Signal<number>;
    readonly field: Signal<ChartField>;
    readonly innerRadiusRatio: Signal<number>;
    readonly outerRadiusRatio: Signal<number>;
    readonly padAngle: Signal<number>;
    readonly scaleMode: Signal<ChartRoseScaleMode>;
    readonly startAngle: Signal<number>;
    readonly strokeColor: Signal<string>;
    readonly strokeWidth?: Signal<number | undefined>;
    readonly type: "rose";
    readonly valueFormatter?: Signal<ChartValueFormatter | undefined>;
}

export interface ChartGaugeSeriesRegistration extends ChartRadialArcSeriesRegistrationBase {
    readonly centerTemplate?: Signal<ChartGaugeCenterTemplateDirective | undefined>;
    readonly color: Signal<string>;
    readonly cornerRadius?: Signal<number | undefined>;
    readonly endAngle: Signal<number>;
    readonly field: Signal<ChartField>;
    readonly hubRadius: Signal<number>;
    readonly indicator: Signal<ChartGaugeIndicator>;
    readonly innerRadiusRatio: Signal<number>;
    readonly max: Signal<number>;
    readonly min: Signal<number>;
    readonly needleColor: Signal<string>;
    readonly needleLengthRatio: Signal<number>;
    readonly needleWidth: Signal<number>;
    readonly outerRadiusRatio: Signal<number>;
    readonly showValue: Signal<boolean>;
    readonly startAngle: Signal<number>;
    readonly trackColor: Signal<string>;
    readonly trackOpacity?: Signal<number | undefined>;
    readonly type: "gauge";
    readonly value?: Signal<number | undefined>;
    readonly valueFormatter?: Signal<ChartValueFormatter | undefined>;
}

export interface ChartTreemapSeriesRegistration
    extends Omit<ChartSeriesRegistrationBase, "data">,
        ChartDatumVisibilityRegistration {
    readonly borderRadius?: Signal<number | undefined>;
    readonly childrenField: Signal<ChartField>;
    readonly color?: Signal<string | undefined>;
    readonly colorField?: Signal<ChartField | undefined>;
    readonly colors?: Signal<readonly string[] | undefined>;
    readonly data: Signal<readonly unknown[] | unknown | undefined>;
    readonly field: Signal<ChartField>;
    readonly fillOpacity?: Signal<number | undefined>;
    readonly labelField: Signal<ChartField>;
    readonly labelFormatter?: Signal<ChartValueFormatter | undefined>;
    readonly labelTemplate?: Signal<ChartTreemapLabelTemplateDirective | undefined>;
    readonly maxDepth?: Signal<number | undefined>;
    readonly maxLabels?: Signal<number>;
    readonly minLabelHeight?: Signal<number | undefined>;
    readonly minLabelWidth?: Signal<number | undefined>;
    readonly paddingInner?: Signal<number | undefined>;
    readonly paddingOuter?: Signal<number | undefined>;
    readonly parentFillOpacity?: Signal<number | undefined>;
    readonly parentHeaderHeight?: Signal<number | undefined>;
    readonly showLabels?: Signal<boolean>;
    readonly showParentLabels?: Signal<boolean>;
    readonly showValues?: Signal<boolean>;
    readonly sort?: Signal<ChartTreemapSort>;
    readonly strokeColor?: Signal<string>;
    readonly strokeWidth?: Signal<number | undefined>;
    readonly tile?: Signal<ChartTreemapTile>;
    readonly type: "treemap";
    readonly valueField?: Signal<ChartField>;
    readonly valueFormatter?: Signal<ChartValueFormatter | undefined>;
}

export interface ChartFunnelSeriesRegistration
    extends ChartSeriesRegistrationBase,
        ChartDatumVisibilityRegistration {
    readonly categoryField: Signal<ChartField>;
    readonly categoryFormatter?: Signal<ChartValueFormatter | undefined>;
    readonly color?: Signal<string>;
    readonly colorField?: Signal<ChartField | undefined>;
    readonly colors?: Signal<readonly string[] | undefined>;
    readonly field: Signal<ChartField>;
    readonly fillOpacity?: Signal<number | undefined>;
    readonly gap: Signal<number>;
    readonly labelContent: Signal<import("../../models/chart-funnel.models").ChartFunnelLabelContent>;
    readonly labelTemplate?: Signal<import("../../directives/chart-funnel-label-template.directive").ChartFunnelLabelTemplateDirective | undefined>;
    readonly maxLabels?: Signal<number>;
    readonly minLabelHeight?: Signal<number | undefined>;
    readonly minLabelWidth?: Signal<number | undefined>;
    readonly orientation: Signal<import("../../models/chart-funnel.models").ChartFunnelOrientation>;
    readonly showLabels?: Signal<boolean>;
    readonly strokeColor?: Signal<string>;
    readonly strokeWidth?: Signal<number | undefined>;
    readonly type: "funnel";
    readonly valueFormatter?: Signal<ChartValueFormatter | undefined>;
    readonly widthRatio: Signal<number>;
}

export interface ChartWaterfallSeriesRegistration
    extends ChartSeriesRegistrationBase {
    readonly borderRadius?: Signal<number | undefined>;
    readonly connectorColor?: Signal<string>;
    readonly connectorWidth?: Signal<number | undefined>;
    readonly decreaseColor?: Signal<string>;
    readonly field: Signal<ChartField>;
    readonly fillOpacity?: Signal<number | undefined>;
    readonly increaseColor?: Signal<string>;
    readonly keyField?: Signal<ChartField | undefined>;
    readonly kindField?: Signal<ChartField | undefined>;
    readonly labelTemplate?: Signal<import("../../directives/chart-waterfall-label-template.directive").ChartWaterfallLabelTemplateDirective | undefined>;
    readonly maxBarWidth?: Signal<number | undefined>;
    readonly maxLabels?: Signal<number>;
    readonly minLabelWidth?: Signal<number | undefined>;
    readonly neutralColor?: Signal<string>;
    readonly showConnectors?: Signal<boolean>;
    readonly showLabels?: Signal<boolean>;
    readonly startValue?: Signal<number>;
    readonly strokeColor?: Signal<string>;
    readonly strokeWidth?: Signal<number | undefined>;
    readonly subtotalColor?: Signal<string>;
    readonly totalColor?: Signal<string>;
    readonly type: "waterfall";
    readonly valueFormatter?: Signal<ChartValueFormatter | undefined>;
    readonly xField?: Signal<ChartField | undefined>;
}

export type ChartHierarchicalSeriesRegistration = ChartTreemapSeriesRegistration;

export type ChartRadialArcSeriesRegistration =
    | ChartGaugeSeriesRegistration
    | ChartRadialBarSeriesRegistration
    | ChartRoseSeriesRegistration;

export type ChartFinancialSeriesRegistration = ChartCandlestickSeriesRegistration | ChartOhlcSeriesRegistration;

export type ChartCartesianSeriesRegistration =
    | ChartAreaSeriesRegistration
    | ChartBarSeriesRegistration
    | ChartBubbleSeriesRegistration
    | ChartCandlestickSeriesRegistration
    | ChartLineSeriesRegistration
    | ChartOhlcSeriesRegistration
    | ChartRangeAreaSeriesRegistration
    | ChartRangeBarSeriesRegistration
    | ChartScatterSeriesRegistration;

export type ChartSectorSeriesRegistration = ChartDonutSeriesRegistration | ChartPieSeriesRegistration;
export type ChartPolarSeriesRegistration = ChartSectorSeriesRegistration;

export type ChartRadialSeriesRegistration = ChartContinuousPolarSeriesRegistration | ChartRadarSeriesRegistration;

export type ChartSeriesRegistration =
    | ChartCartesianSeriesRegistration
    | ChartFunnelSeriesRegistration
    | ChartHeatmapSeriesRegistration
    | ChartHierarchicalSeriesRegistration
    | ChartRadialArcSeriesRegistration
    | ChartRadialSeriesRegistration
    | ChartSectorSeriesRegistration
    | ChartWaterfallSeriesRegistration;

export interface ChartCartesianOverlayRegistrationBase {
    readonly element: ElementRef<HTMLElement>;
    readonly id: string;
    readonly userClass: Signal<string>;
    readonly visible: Signal<boolean>;
}

export interface ChartCrosshairRegistration {
    readonly color: Signal<string | undefined>;
    readonly element: ElementRef<HTMLElement>;
    readonly enabled: Signal<boolean>;
    readonly labelOffset: Signal<number>;
    readonly lineStyle: Signal<ChartCrosshairLineStyle>;
    readonly lineWidth: Signal<number | undefined>;
    readonly maxSnapDistance: Signal<number>;
    readonly mode: Signal<ChartCrosshairMode>;
    readonly opacity: Signal<number | undefined>;
    readonly showAxisLabels: Signal<boolean>;
    readonly showXLabel: Signal<boolean | undefined>;
    readonly showYLabel: Signal<boolean | undefined>;
    readonly snap: Signal<ChartCrosshairSnapMode>;
    readonly template: Signal<ChartCrosshairLabelTemplateDirective | undefined>;
    readonly userClass: Signal<string>;
    readonly xAxisId: Signal<string | undefined>;
    readonly yAxisId: Signal<string | undefined>;
}

export interface ChartReferenceLineRegistration extends ChartCartesianOverlayRegistrationBase {
    readonly axis: Signal<"x" | "y">;
    readonly axisId: Signal<string | undefined>;
    readonly color: Signal<string | undefined>;
    readonly label: Signal<string>;
    readonly labelClass: Signal<string>;
    readonly labelOffset: Signal<number>;
    readonly labelPosition: Signal<ChartReferenceLabelPosition>;
    readonly layer: Signal<ChartOverlayLayer>;
    readonly lineStyle: Signal<ChartReferenceLineStyle>;
    readonly opacity: Signal<number | undefined>;
    readonly template: Signal<ChartReferenceLabelTemplateDirective | undefined>;
    readonly value: Signal<ChartAnnotationAxisValue>;
    readonly width: Signal<number | undefined>;
}

export interface ChartReferenceBandRegistration extends ChartCartesianOverlayRegistrationBase {
    readonly axis: Signal<"x" | "y">;
    readonly axisId: Signal<string | undefined>;
    readonly borderColor: Signal<string | undefined>;
    readonly borderWidth: Signal<number | undefined>;
    readonly fillColor: Signal<string | undefined>;
    readonly fillOpacity: Signal<number | undefined>;
    readonly from: Signal<ChartAnnotationAxisValue>;
    readonly label: Signal<string>;
    readonly labelClass: Signal<string>;
    readonly labelOffset: Signal<number>;
    readonly labelPosition: Signal<ChartReferenceLabelPosition>;
    readonly layer: Signal<ChartOverlayLayer>;
    readonly template: Signal<ChartReferenceLabelTemplateDirective | undefined>;
    readonly to: Signal<ChartAnnotationAxisValue>;
}

export interface ChartAnnotationRegistration extends ChartCartesianOverlayRegistrationBase {
    readonly color: Signal<string | undefined>;
    readonly connector: Signal<boolean>;
    readonly connectorWidth: Signal<number>;
    readonly data: Signal<unknown>;
    readonly label: Signal<string>;
    readonly labelClass: Signal<string>;
    readonly labelPlacement: Signal<ChartAnnotationLabelPlacement>;
    readonly marker: Signal<ChartAnnotationMarker>;
    readonly markerRadius: Signal<number>;
    readonly markerStrokeWidth: Signal<number>;
    readonly offsetX: Signal<number>;
    readonly offsetY: Signal<number>;
    readonly template: Signal<ChartAnnotationLabelTemplateDirective | undefined>;
    readonly x: Signal<ChartAnnotationAxisValue>;
    readonly xAxisId: Signal<string | undefined>;
    readonly y: Signal<ChartAnnotationAxisValue>;
    readonly yAxisId: Signal<string | undefined>;
}

export interface ChartSelectionRegistration {
    readonly clearOnBackgroundClick: Signal<boolean>;
    readonly clickSelection: Signal<boolean>;
    readonly color: Signal<string | undefined>;
    readonly defaultSelectedMarkIds: Signal<readonly string[]>;
    readonly enabled: Signal<boolean>;
    readonly fillOpacity: Signal<number | undefined>;
    readonly keyboardSelection: Signal<boolean>;
    readonly mode: Signal<ChartSelectionMode>;
    readonly retainOnDataChange: Signal<boolean>;
    readonly selectedMarkIds: Signal<readonly string[] | undefined>;
    readonly strokeWidth: Signal<number | undefined>;
    emitSelectionChange(event: ChartSelectionChangeEvent): void;
}

export interface ChartBrushRegistration {
    readonly activation: Signal<ChartBrushActivation>;
    readonly borderColor: Signal<string | undefined>;
    readonly borderWidth: Signal<number | undefined>;
    readonly enabled: Signal<boolean>;
    readonly fillColor: Signal<string | undefined>;
    readonly fillOpacity: Signal<number | undefined>;
    readonly hitPolicy: Signal<ChartBrushHitPolicy>;
    readonly lineStyle: Signal<"dashed" | "dotted" | "solid">;
    readonly minDragDistance: Signal<number>;
    readonly mode: Signal<ChartBrushMode>;
    readonly selectionBehavior: Signal<ChartBrushSelectionBehavior>;
    readonly xAxisId: Signal<string | undefined>;
    readonly yAxisId: Signal<string | undefined>;
    emitBrushChange(event: ChartBrushChangeEvent): void;
}

export interface ChartRegistrationContext {
    invalidate(reason?: ChartInvalidationReason): void;
    legendItems: Signal<readonly ChartLegendItem[]>;
    readonly legendScale?: Signal<ChartColorLegendScale | null>;
    observeDataLabelElement?(element: HTMLElement, labelId: string): void;
    observeLabelElement?(element: HTMLElement, labelId: string): void;
    observeOverlayLabelElement?(element: HTMLElement, labelId: string): void;
    registerAngularAxis(registration: ChartAngularAxisRegistration): () => void;
    registerAnnotation(registration: ChartAnnotationRegistration): () => void;
    registerBrush(registration: ChartBrushRegistration): () => void;
    registerCrosshair(registration: ChartCrosshairRegistration): () => void;
    registerLegend(registration: ChartLegendRegistration): () => void;
    registerRadialAxis(registration: ChartRadialAxisRegistration): () => void;
    registerReferenceBand(registration: ChartReferenceBandRegistration): () => void;
    registerReferenceLine(registration: ChartReferenceLineRegistration): () => void;
    registerSelection(registration: ChartSelectionRegistration): () => void;
    registerSeries(registration: ChartSeriesRegistration): () => void;
    registerTooltip(registration: ChartTooltipRegistration): () => void;
    registerXAxis(registration: ChartXAxisRegistration): () => void;
    registerYAxis(registration: ChartYAxisRegistration): () => void;
    readonly rootData: Signal<readonly unknown[]>;
    scene: Signal<ChartScene | null>;
    toggleLegendItem(item: ChartLegendItem): void;
    toggleSeriesVisibility(seriesId: string): void;
    tooltipContext: Signal<ChartTooltipTemplateContext | null>;
    tooltipPosition: Signal<ChartPoint | null>;
    unobserveDataLabelElement?(element: HTMLElement, labelId: string): void;
    unobserveLabelElement?(element: HTMLElement, labelId: string): void;
    unobserveOverlayLabelElement?(element: HTMLElement, labelId: string): void;
}
