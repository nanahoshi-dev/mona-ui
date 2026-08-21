import type { ChartScene } from "../scene/chart-scene";
import type { ChartRenderPresentationState } from "../render/chart-render-presentation-state";
import type { ChartRect } from "../../models/chart.models";

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
    readonly element: HTMLElement;
    readonly role: string;
    readonly zOrder: number;
}

export interface ChartExportDomLayerSnapshot {
    readonly badges: readonly ChartExportBadgeSnapshot[];
    readonly rasterIslands: readonly ChartExportRasterIslandSnapshot[];
    readonly vectorTexts: readonly ChartExportVectorTextSnapshot[];
}

export interface ChartExportSnapshot {
    readonly ariaDescription: string | null;
    readonly ariaLabel: string | null;
    readonly background: string | null;
    readonly domLayers: ChartExportDomLayerSnapshot;
    readonly hasNoData: boolean;
    readonly plotSurfaceRect: ChartRect;
    readonly presentation: ChartRenderPresentationState;
    readonly scene: ChartScene | null;
    readonly sourceHeight: number;
    readonly sourceWidth: number;
    readonly styleSnapshot: ReadonlyMap<string, string>;
}
