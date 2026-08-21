import type { ChartScene } from "../scene/chart-scene";
import type { ChartPoint, ChartRect } from "../../models/chart.models";
import type { ChartBrushLineStyle } from "../../models/chart-brush.models";
import type { ChartCrosshairLineStyle } from "../../models/chart-crosshair.models";
import type { ChartCrosshairState } from "../interaction/chart-crosshair-state";
import type { CartesianDataLabelScene } from "../scene/cartesian-data-label-scene";
import type { CartesianOverlayScene } from "../scene/cartesian-overlay-scene";
import type { CartesianSelectionScene } from "../scene/cartesian-selection-scene";

export type ChartExportDomPlane =
    | "plot-labels"
    | "plot-overlays"
    | "host-chrome";

export interface ChartExportPrimitiveBase {
    readonly documentOrder: number;
    readonly id: string;
    readonly plane: ChartExportDomPlane;
    readonly role: string;
    readonly zOrder: number;
}

export interface ChartExportVectorTextSnapshot extends ChartExportPrimitiveBase {
    readonly bounds: ChartRect;
    readonly color: string;
    readonly fontFamily: string;
    readonly fontSize: number;
    readonly fontStyle: string;
    readonly fontWeight: string;
    readonly letterSpacing: number;
    readonly opacity: number;
    readonly text: string;
    readonly textAlign: "left" | "center" | "right";
}

export interface ChartExportBadgeSnapshot extends ChartExportPrimitiveBase {
    readonly backgroundColor: string;
    readonly borderColor?: string;
    readonly borderRadius?: number;
    readonly borderWidth?: number;
    readonly bounds: ChartRect;
    readonly fontFamily: string;
    readonly fontSize: number;
    readonly fontStyle: string;
    readonly fontWeight: string;
    readonly opacity: number;
    readonly text: string;
    readonly textColor: string;
}

export interface ChartExportRasterIslandSnapshot extends ChartExportPrimitiveBase {
    readonly bounds: ChartRect;
    readonly clipRect?: ChartRect;
    readonly frozenRoot: HTMLElement;
}

export type ChartExportDomPrimitive =
    | ({ readonly kind: "badge" } & ChartExportBadgeSnapshot)
    | ({ readonly kind: "text" } & ChartExportVectorTextSnapshot)
    | ({ readonly kind: "raster" } & ChartExportRasterIslandSnapshot);

export interface ChartExportDomLayerSnapshot {
    readonly badges: readonly ChartExportBadgeSnapshot[];
    readonly primitives: readonly ChartExportDomPrimitive[];
    readonly rasterIslands: readonly ChartExportRasterIslandSnapshot[];
    readonly vectorTexts: readonly ChartExportVectorTextSnapshot[];
}

export interface ChartCrosshairRenderSnapshot {
    readonly color: string;
    readonly dashArray?: string;
    readonly enabled: boolean;
    readonly lineStyle: ChartCrosshairLineStyle;
    readonly opacity: number;
    readonly width: number;
}

export interface ChartBrushRenderSnapshot {
    readonly borderColor: string;
    readonly borderWidth: number;
    readonly fillColor: string;
    readonly fillOpacity: number;
    readonly lineStyle: ChartBrushLineStyle;
}

export interface ChartExportPresentationSnapshot {
    readonly activeBrushBounds: ChartRect | null;
    readonly annotationBadgeAnchors: ReadonlyMap<string, ChartPoint> | null;
    readonly brush: ChartBrushRenderSnapshot | null;
    readonly cartesianDataLabels: CartesianDataLabelScene | null;
    readonly cartesianOverlay: CartesianOverlayScene | null;
    readonly crosshair: ChartCrosshairState | null;
    readonly crosshairStyle: ChartCrosshairRenderSnapshot | null;
    readonly selectionOptions: {
        readonly color?: string;
        readonly fillOpacity?: number;
        readonly strokeWidth?: number;
    } | null;
    readonly selectionScene: CartesianSelectionScene | null;
}

export interface ChartExportSnapshot {
    readonly ariaDescription: string | null;
    readonly ariaLabel: string | null;
    readonly background: string | null;
    readonly domLayers: ChartExportDomLayerSnapshot;
    readonly hasNoData: boolean;
    readonly plotSurfaceRect: ChartRect;
    readonly presentation: ChartExportPresentationSnapshot;
    readonly scene: ChartScene | null;
    readonly sourceHeight: number;
    readonly sourceWidth: number;
    readonly styleSnapshot: ReadonlyMap<string, string>;
}
