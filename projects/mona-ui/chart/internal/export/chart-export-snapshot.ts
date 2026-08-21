import type { ChartScene } from "../scene/chart-scene";
import type { ChartPoint, ChartRect } from "../../models/chart.models";
import type { ChartBrushLineStyle } from "../../models/chart-brush.models";
import type { ChartCrosshairLineStyle } from "../../models/chart-crosshair.models";
import type { ChartCrosshairState } from "../interaction/chart-crosshair-state";
import type { CartesianDataLabelScene } from "../scene/cartesian-data-label-scene";
import type { CartesianOverlayScene } from "../scene/cartesian-overlay-scene";
import type { CartesianSelectionScene } from "../scene/cartesian-selection-scene";

export interface ChartExportVectorTextSnapshot {
    readonly bounds: ChartRect;
    readonly color: string;
    readonly fontFamily: string;
    readonly fontSize: number;
    readonly fontStyle: string;
    readonly fontWeight: string;
    readonly letterSpacing: number;
    readonly opacity: number;
    readonly role: string;
    readonly rotation?: {
        readonly angle: number;
        readonly cx: number;
        readonly cy: number;
    };
    readonly text: string;
    readonly textAlign: "left" | "center" | "right";
    readonly transformMatrix?: readonly [number, number, number, number, number, number];
    readonly zOrder: number;
}

export interface ChartExportBadgeSnapshot {
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
    readonly role: string;
    readonly text: string;
    readonly textColor: string;
    readonly zOrder: number;
}

export interface ChartExportRasterIslandSnapshot {
    readonly bounds: ChartRect;
    readonly clipRect?: ChartRect;
    readonly frozenRoot: HTMLElement;
    readonly role: string;
    readonly zOrder: number;
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
