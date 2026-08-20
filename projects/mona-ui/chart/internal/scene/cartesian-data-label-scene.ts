import type { ChartDataLabelTemplateDirective } from "../../directives/chart-data-label-template.directive";
import type { ChartDataLabelContext, ChartDataLabelPosition } from "../../models/chart-data-label.models";
import type { ChartPoint, ChartRect } from "../../models/chart.models";

export interface SceneCanvasDataLabel {
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
    readonly canvasLabels: readonly SceneCanvasDataLabel[];
    readonly templateLabels: readonly SceneTemplateDataLabel[];
}
