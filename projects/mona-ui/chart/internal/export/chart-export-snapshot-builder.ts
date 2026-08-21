import type { ChartExportSnapshot } from "./chart-export-snapshot";
import type { NormalizedChartExportRequest } from "./chart-export-options";
import type { ChartScene } from "../scene/chart-scene";
import type { ChartRenderPresentationState } from "../render/chart-render-presentation-state";
import { ChartExportDomCollector } from "./chart-export-dom-collector";
import { ChartStyleResolver } from "../style/chart-style-resolver";
import type { ChartRect } from "../../models/chart.models";
import { ChartExportError } from "../../models/chart-export.models";

export interface ChartSnapshotSourceContext {
    readonly activeBrushBounds: ChartRect | null;
    readonly annotationBadgeAnchors: ReadonlyMap<string, { x: number; y: number }> | null;
    readonly ariaDescription: string | null;
    readonly ariaLabel: string | null;
    readonly brushRegistration: any;
    readonly cartesianDataLabels: any;
    readonly cartesianOverlay: any;
    readonly cartesianSelectionScene: any;
    readonly crosshairRegistration: any;
    readonly crosshairState: any;
    readonly elementRef: HTMLElement;
    readonly hasNoData: boolean;
    readonly plotSurfaceElement: HTMLElement | null;
    readonly scene: ChartScene | null;
    readonly selectionOptions: { color?: string; fillOpacity?: number; strokeWidth?: number } | null;
}

export class ChartExportSnapshotBuilder {
    public static build(
        context: ChartSnapshotSourceContext,
        request: NormalizedChartExportRequest
    ): ChartExportSnapshot {
        const hostEl = context.elementRef;
        if (!hostEl) {
            throw new ChartExportError("not-ready", "Chart host element is not available.");
        }

        const hostRect = hostEl.getBoundingClientRect();
        if (hostRect.width <= 0 || hostRect.height <= 0) {
            throw new ChartExportError("not-ready", "Chart is not ready or has invalid dimensions.");
        }

        const plotEl = context.plotSurfaceElement ?? hostEl;
        const plotRect = plotEl.getBoundingClientRect();

        const plotSurfaceRect: ChartRect = {
            height: plotRect.height > 0 ? plotRect.height : hostRect.height,
            width: plotRect.width > 0 ? plotRect.width : hostRect.width,
            x: plotRect.left - hostRect.left,
            y: plotRect.top - hostRect.top
        };

        const styleSnapshot = ChartStyleResolver.captureStyleSnapshot(hostEl);

        const presentation: ChartRenderPresentationState = {
            activeBrushBounds: request.presentation.brush ? context.activeBrushBounds : null,
            annotationBadgeAnchors: context.annotationBadgeAnchors,
            brushRegistration: context.brushRegistration,
            cartesianDataLabels: context.cartesianDataLabels,
            cartesianOverlay: context.cartesianOverlay,
            crosshair: request.presentation.crosshair ? context.crosshairState : null,
            crosshairRegistration: context.crosshairRegistration,
            interaction: null, // Always omit pointer/hover interaction from exports
            selectionOptions: request.presentation.selection ? context.selectionOptions : null,
            selectionScene: request.presentation.selection ? context.cartesianSelectionScene : null
        };

        const domLayers = ChartExportDomCollector.collect(hostEl, plotEl, styleSnapshot);

        let resolvedBackground: string | null = null;
        if (request.background === "auto") {
            resolvedBackground =
                styleSnapshot.get("--mona-chart-surface") ||
                styleSnapshot.get("--color-surface") ||
                styleSnapshot.get("--color-card") ||
                styleSnapshot.get("--color-background") ||
                styleSnapshot.get("background-color") ||
                "#ffffff";
        } else if (request.background === "transparent") {
            resolvedBackground = null;
        } else {
            resolvedBackground = request.background;
        }

        return {
            ariaDescription: context.ariaDescription,
            ariaLabel: context.ariaLabel,
            background: resolvedBackground,
            domLayers,
            hasNoData: context.hasNoData,
            plotSurfaceRect,
            presentation,
            scene: context.scene,
            sourceHeight: hostRect.height,
            sourceWidth: hostRect.width,
            styleSnapshot
        };
    }
}
