import type { ChartInteractionState } from "../interaction/chart-interaction-state";
import type { PolarAxisChartScene } from "../scene/chart-scene";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { PolarAxisGridRenderer } from "./polar-axis-grid-renderer";
import { RadialInteractionRenderer } from "./radial-interaction-renderer";
import { PolarSeriesRenderer } from "./series/polar-series-renderer";
import { RadarSeriesRenderer } from "./series/radar-series-renderer";

export class PolarAxisChartRenderer {
    public static render(
        context: CanvasRenderingContext2D,
        scene: PolarAxisChartScene,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver
    ): void {
        const { center, outerRadius, plotRect, series } = scene;
        if (plotRect.width <= 0 || plotRect.height <= 0 || outerRadius <= 0) {
            return;
        }

        // 1. Background Grid and Spokes
        PolarAxisGridRenderer.renderBackground(context, scene, styleResolver);

        // 2. Series (Fills, Outlines, Markers) in registration order
        for (const s of series) {
            if (s.type === "radar") {
                RadarSeriesRenderer.render(context, s, center, styleResolver);
            } else if (s.type === "polar") {
                PolarSeriesRenderer.render(context, s, center, styleResolver);
            }
        }

        // 3. Foreground Axes (Outer Boundary, Radial Reference Spoke)
        PolarAxisGridRenderer.renderForeground(context, scene, styleResolver);

        // 4. Interaction Overlay
        RadialInteractionRenderer.render(context, scene, interactionState, styleResolver);
    }
}
