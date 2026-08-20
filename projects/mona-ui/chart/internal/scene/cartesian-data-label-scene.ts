import type { ChartDataLabelTemplateDirective } from "../../directives/chart-data-label-template.directive";
import type { ChartDataLabelContext, ChartDataLabelPosition } from "../../models/chart-data-label.models";
import type { ChartPoint, ChartRect } from "../../models/chart.models";

export interface SceneDefaultDataLabel {
    readonly anchor: ChartPoint;
    readonly bounds: ChartRect;
    readonly color: string;
    readonly font?: string;
    readonly haloColor?: string;
    readonly haloWidth?: number;
    readonly markId: string;
    readonly placement: ChartDataLabelPosition;
    readonly seriesId: string;
    readonly text: string;
}

export type SceneCanvasDataLabel = SceneDefaultDataLabel;

export interface SceneTemplateDataLabel {
    readonly anchor: ChartPoint;
    readonly bounds: ChartRect;
    readonly context: ChartDataLabelContext;
    readonly markId: string;
    readonly placement: ChartDataLabelPosition;
    readonly seriesId: string;
    readonly template: ChartDataLabelTemplateDirective;
}

export interface CartesianDataLabelScene {
    readonly defaultLabels: readonly SceneDefaultDataLabel[];
    readonly templateLabels: readonly SceneTemplateDataLabel[];
}
