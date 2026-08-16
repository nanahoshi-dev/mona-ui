import type { ElementRef, Signal } from "@angular/core";
import type { ChartAxisLabelTemplateDirective } from "../../directives/chart-axis-label-template.directive";
import type { ChartLegendItemTemplateDirective } from "../../directives/chart-legend-item-template.directive";
import type { ChartTooltipTemplateDirective } from "../../directives/chart-tooltip-template.directive";
import type { ChartAxisFormatter, ChartAxisPosition, ChartXAxisType } from "../../models/chart-axis.models";
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
    Size = 1 << 4
}

export interface ChartAxisRegistration {
    axisLine: Signal<boolean>;
    formatter: Signal<ChartAxisFormatter | undefined>;
    gridLines: Signal<boolean>;
    labelTemplate: Signal<ChartAxisLabelTemplateDirective | undefined>;
    max: Signal<number | Date | undefined>;
    min: Signal<number | Date | undefined>;
    nice: Signal<boolean>;
    position: Signal<ChartAxisPosition>;
    tickCount: Signal<number | undefined>;
    title: Signal<string>;
    type: Signal<ChartXAxisType>;
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

export interface ChartSeriesRegistration {
    borderRadius?: Signal<number | undefined>;
    color: Signal<string>;
    connectNulls?: Signal<boolean>;
    curve?: Signal<ChartCurve>;
    data: Signal<readonly unknown[] | undefined>;
    element: ElementRef<HTMLElement>;
    field: Signal<ChartField>;
    fillMode?: Signal<ChartAreaFillMode>;
    fillOpacity?: Signal<number | undefined>;
    id: string;
    maxBarWidth?: Signal<number | undefined>;
    name: Signal<string>;
    pointRadius?: Signal<number | undefined>;
    showPoints?: Signal<boolean>;
    strokeWidth?: Signal<number | undefined>;
    toggleVisibility?: () => boolean;
    type: ChartSeriesType;
    userClass?: Signal<string>;
    visible: Signal<boolean>;
    xField: Signal<ChartField | undefined>;
}

export interface ChartRegistrationContext {
    invalidate(reason: ChartInvalidationReason): void;
    legendItems: Signal<readonly ChartLegendItem[]>;
    registerLegend(registration: ChartLegendRegistration): () => void;
    registerSeries(registration: ChartSeriesRegistration): () => void;
    registerTooltip(registration: ChartTooltipRegistration): () => void;
    registerXAxis(registration: ChartAxisRegistration): () => void;
    registerYAxis(registration: ChartAxisRegistration): () => void;
    scene: Signal<ChartScene | null>;
    toggleSeriesVisibility(seriesId: string): void;
    tooltipContext: Signal<ChartTooltipTemplateContext | null>;
    tooltipPosition: Signal<ChartPoint | null>;
}
