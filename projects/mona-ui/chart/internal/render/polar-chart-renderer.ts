import type { ChartInteractionState } from "../interaction/chart-interaction-state";
import type { PolarChartScene } from "../scene/chart-scene";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { PolarLabelLineRenderer } from "./polar-label-line-renderer";
import { PolarSeriesRenderer } from "./series/polar-series-renderer";

export class PolarChartRenderer {
    public static render(
        context: CanvasRenderingContext2D,
        scene: PolarChartScene,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver
    ): void {
        const { plotRect, series } = scene;
        if (plotRect.width <= 0 || plotRect.height <= 0) {
            return;
        }

        for (const s of series) {
            PolarSeriesRenderer.render(context, s, interactionState, styleResolver);
            PolarLabelLineRenderer.render(context, s, styleResolver);
        }
    }
}
