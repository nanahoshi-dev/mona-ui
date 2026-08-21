import type { ChartPoint, ChartRect } from "../../models/chart.models";
import type { ChartBrushRegistration, ChartCrosshairRegistration } from "../context/chart-registration-context";
import type {
    ChartBrushRenderSnapshot,
    ChartCrosshairRenderSnapshot
} from "../export/chart-export-snapshot";
import type { ChartCrosshairState } from "../interaction/chart-crosshair-state";
import type { ChartInteractionState } from "../interaction/chart-interaction-state";
import type { CartesianDataLabelScene } from "../scene/cartesian-data-label-scene";
import type { CartesianOverlayScene } from "../scene/cartesian-overlay-scene";
import type { CartesianSelectionScene } from "../scene/cartesian-selection-scene";

export interface ChartRenderPresentationState {
    readonly activeBrushBounds?: ChartRect | null;
    readonly annotationBadgeAnchors?: ReadonlyMap<string, ChartPoint> | null;
    readonly brushRegistration?: ChartBrushRegistration | null;
    readonly brushSnapshot?: ChartBrushRenderSnapshot | null;
    readonly cartesianDataLabels?: CartesianDataLabelScene | null;
    readonly cartesianOverlay?: CartesianOverlayScene | null;
    readonly crosshair?: ChartCrosshairState | null;
    readonly crosshairRegistration?: ChartCrosshairRegistration | null;
    readonly crosshairSnapshot?: ChartCrosshairRenderSnapshot | null;
    readonly interaction?: ChartInteractionState | null;
    readonly selectionOptions?: {
        readonly color?: string;
        readonly fillOpacity?: number;
        readonly strokeWidth?: number;
    } | null;
    readonly selectionScene?: CartesianSelectionScene | null;
}
