import type { ChartInteractionState } from "../interaction/chart-interaction-state";
import type { PolarSectorChartScene } from "../scene/chart-scene";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { PolarLabelLineRenderer } from "./polar-label-line-renderer";
import { PolarSectorSeriesRenderer } from "./series/polar-sector-series-renderer";

export class PolarSectorChartRenderer {
    public static render(
        context: CanvasRenderingContext2D,
        scene: PolarSectorChartScene,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver
    ): void {
        const { plotRect, series } = scene;
        if (plotRect.width <= 0 || plotRect.height <= 0) {
            return;
        }

        for (const s of series) {
            PolarSectorSeriesRenderer.render(context, s, interactionState, styleResolver);
            PolarLabelLineRenderer.render(context, s, styleResolver);
        }
    }
}
