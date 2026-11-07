import type { ChartInteractionState } from "../interaction/chart-interaction-state";
import type { TreemapChartScene } from "../scene/hierarchical-scene";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { drawCellRectOutline } from "../utils/canvas-utils";
import { TreemapSeriesRenderer } from "./series/treemap-series-renderer";

export class TreemapChartRenderer {
    public static render(
        context: CanvasRenderingContext2D,
        scene: TreemapChartScene,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver
    ): void {
        const { plotRect, series } = scene;
        if (plotRect.width <= 0 || plotRect.height <= 0 || series.length === 0) {
            return;
        }

        context.save();

        // 1. Clip series rendering to plot area
        context.beginPath();
        context.rect(plotRect.x, plotRect.y, plotRect.width, plotRect.height);
        context.clip();

        for (const s of series) {
            TreemapSeriesRenderer.render(context, s);
        }

        // 2. Render interaction highlight (hover & keyboard focus)
        if (interactionState) {
            const isKeyboard = interactionState.source === "keyboard";
            const hit = interactionState.activeHitTarget ?? interactionState.activeHits[0];
            if (hit && hit.seriesType === "treemap" && hit.bounds) {
                const b = hit.visualBounds ?? hit.bounds;
                const radius = hit.borderRadius ?? 0;

                if (isKeyboard) {
                    const focusColor =
                        styleResolver.resolveCssVariable("--color-ring") ||
                        styleResolver.resolveCssVariable("--color-focus-indicator") ||
                        styleResolver.resolveCssVariable("--color-primary") ||
                        "#3b82f6";
                    context.strokeStyle = focusColor;
                    context.lineWidth = 2.5;
                    drawCellRectOutline(context, b.x, b.y, b.width, b.height, radius);
                } else {
                    const hoverColor =
                        styleResolver.resolveCssVariable("--mona-chart-treemap-hover-outline-color") ||
                        styleResolver.resolveCssVariable("--color-border-control") ||
                        "rgba(255, 255, 255, 0.85)";
                    context.strokeStyle = hoverColor;
                    context.lineWidth = 1.5;
                    drawCellRectOutline(context, b.x, b.y, b.width, b.height, radius);
                }
            }
        }

        context.restore();
    }
}
