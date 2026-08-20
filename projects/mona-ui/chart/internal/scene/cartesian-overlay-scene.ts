import type { ChartPoint, ChartRect } from "../../models/chart.models";
import type {
    ChartAnnotationLabelPlacement,
    ChartAnnotationMarker,
    ChartOverlayLayer,
    ChartReferenceLabelPosition
} from "../../models/chart-annotation.models";

export interface SceneReferenceLabel {
    readonly anchor: ChartPoint;
    readonly formattedText: string;
    readonly labelClass?: string;
    readonly offset: number;
    readonly position: ChartReferenceLabelPosition;
    readonly userClass?: string;
}

export interface SceneAnnotationLabel {
    readonly anchor: ChartPoint;
    readonly formattedText: string;
    readonly labelClass?: string;
    readonly offsetX: number;
    readonly offsetY: number;
    readonly placement: ChartAnnotationLabelPlacement;
    readonly userClass?: string;
}

export interface SceneReferenceLine {
    readonly axis: "x" | "y";
    readonly axisId: string;
    readonly color: string;
    readonly coordinate: number;
    readonly dash: readonly number[];
    readonly id: string;
    readonly label?: SceneReferenceLabel;
    readonly layer: ChartOverlayLayer;
    readonly opacity: number;
    readonly width: number;
}

export interface SceneReferenceBand {
    readonly axis: "x" | "y";
    readonly axisId: string;
    readonly borderColor?: string;
    readonly borderWidth: number;
    readonly bounds: ChartRect;
    readonly fillColor: string;
    readonly fillOpacity: number;
    readonly id: string;
    readonly label?: SceneReferenceLabel;
    readonly layer: ChartOverlayLayer;
}

export interface ScenePointAnnotation {
    readonly color: string;
    readonly connector: boolean;
    readonly connectorWidth: number;
    readonly data?: unknown;
    readonly id: string;
    readonly label?: SceneAnnotationLabel;
    readonly marker: ChartAnnotationMarker;
    readonly markerRadius: number;
    readonly markerStrokeWidth: number;
    readonly point: ChartPoint;
}

export interface CartesianOverlayScene {
    readonly annotations: readonly ScenePointAnnotation[];
    readonly referenceBands: readonly SceneReferenceBand[];
    readonly referenceLines: readonly SceneReferenceLine[];
}
