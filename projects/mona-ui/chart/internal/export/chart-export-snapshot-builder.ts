import type {
    ChartBrushRenderSnapshot,
    ChartCrosshairRenderSnapshot,
    ChartExportPresentationSnapshot,
    ChartExportSnapshot
} from "./chart-export-snapshot";
import type { NormalizedChartExportRequest } from "./chart-export-options";
import type { ChartScene } from "../scene/chart-scene";
import type { ChartBrushRegistration, ChartCrosshairRegistration } from "../context/chart-registration-context";
import type { ChartCrosshairState } from "../interaction/chart-crosshair-state";
import type { CartesianDataLabelScene } from "../scene/cartesian-data-label-scene";
import type { CartesianOverlayScene } from "../scene/cartesian-overlay-scene";
import type { CartesianSelectionScene } from "../scene/cartesian-selection-scene";
import { ChartExportDomCollector } from "./chart-export-dom-collector";
import { ChartStyleResolver } from "../style/chart-style-resolver";
import { ChartExportColorNormalizer } from "./chart-export-color-normalizer";
import type { ChartPoint, ChartRect } from "../../models/chart.models";
import { ChartExportError } from "../../models/chart-export.models";

export interface ChartSnapshotSourceContext {
    readonly activeBrushBounds: ChartRect | null;
    readonly annotationBadgeAnchors: ReadonlyMap<string, ChartPoint> | null;
    readonly ariaDescription: string | null;
    readonly ariaLabel: string | null;
    readonly brushRegistration: ChartBrushRegistration | null;
    readonly cartesianDataLabels: CartesianDataLabelScene | null;
    readonly cartesianOverlay: CartesianOverlayScene | null;
    readonly cartesianSelectionScene: CartesianSelectionScene | null;
    readonly crosshairRegistration: ChartCrosshairRegistration | null;
    readonly crosshairState: ChartCrosshairState | null;
    readonly elementRef: HTMLElement;
    readonly hasNoData: boolean;
    readonly plotSurfaceElement: HTMLElement | null;
    readonly scene: ChartScene | null;
    readonly selectionOptions: {
        readonly color?: string;
        readonly fillOpacity?: number;
        readonly strokeWidth?: number;
    } | null;
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
        const styleResolver = new ChartStyleResolver(hostEl, styleSnapshot);

        // Freeze crosshair render properties synchronously (EXP-02)
        let crosshairSnapshot: ChartCrosshairRenderSnapshot | null = null;
        if (request.presentation.crosshair && context.crosshairRegistration && context.crosshairState) {
            const resolved = styleResolver.resolveCrosshairStyle(context.crosshairRegistration);
            const lineStyle = context.crosshairRegistration.lineStyle();
            crosshairSnapshot = {
                color: resolved.color,
                dashArray: lineStyle === "dotted" ? "2 3" : lineStyle === "solid" ? undefined : "4 4",
                enabled: context.crosshairRegistration.enabled(),
                lineStyle,
                opacity: resolved.opacity,
                width: resolved.width
            };
        }

        // Freeze brush render properties synchronously (EXP-02)
        let brushSnapshot: ChartBrushRenderSnapshot | null = null;
        if (request.presentation.brush && context.brushRegistration && context.activeBrushBounds) {
            const resolved = styleResolver.resolveBrushStyle(context.brushRegistration);
            brushSnapshot = {
                borderColor: resolved.borderColor,
                borderWidth: resolved.borderWidth,
                fillColor: resolved.fillColor,
                fillOpacity: resolved.fillOpacity,
                lineStyle: resolved.lineStyle
            };
        }

        const presentation: ChartExportPresentationSnapshot = {
            activeBrushBounds: request.presentation.brush ? context.activeBrushBounds : null,
            annotationBadgeAnchors: context.annotationBadgeAnchors,
            brush: brushSnapshot,
            cartesianDataLabels: context.cartesianDataLabels,
            cartesianOverlay: context.cartesianOverlay,
            crosshair: request.presentation.crosshair ? context.crosshairState : null,
            crosshairStyle: crosshairSnapshot,
            selectionOptions: request.presentation.selection ? context.selectionOptions : null,
            selectionScene: request.presentation.selection ? context.cartesianSelectionScene : null
        };

        // Collect and freeze DOM overlays and raster clones synchronously (EXP-01, EXP-03, EXP-05, EXP-06, EXP-14)
        const domLayers = ChartExportDomCollector.collect(hostEl, plotEl, styleSnapshot);

        let resolvedBackground: string | null = null;
        if (request.background === "auto") {
            resolvedBackground = ChartExportColorNormalizer.resolveAutoBackground(hostEl, styleSnapshot);
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
