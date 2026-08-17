import type { ChartInteractionState } from "../interaction/chart-interaction-state";
import type { CartesianHeatmapChartScene } from "../scene/chart-scene";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { crispPixel, drawCellRectOutline } from "../utils/canvas-utils";
import { HeatmapSeriesRenderer } from "./series/heatmap-series-renderer";

export class HeatmapChartRenderer {
    public static render(
        context: CanvasRenderingContext2D,
        scene: CartesianHeatmapChartScene,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver
    ): void {
        const { axes, plotRect, series, xCategories, yCategories } = scene;

        if (plotRect.width <= 0 || plotRect.height <= 0) {
            return;
        }

        context.save();

        // 1. Draw Category Boundary Grid Lines behind cells
        const gridColor =
            styleResolver.resolveCssVariable("--mona-chart-grid-color") ||
            "rgba(148, 163, 184, 0.2)";

        context.strokeStyle = gridColor;
        context.lineWidth = 1;

        const xAxisScene = axes.find(a => a.axis === "x");
        const yAxisScene = axes.find(a => a.axis === "y");

        if (yAxisScene?.visible && yAxisScene.gridLines && yCategories.length > 0) {
            const bandHeight = plotRect.height / yCategories.length;
            for (let i = 0; i <= yCategories.length; i++) {
                const y = crispPixel(plotRect.y + i * bandHeight, 1);
                context.beginPath();
                context.moveTo(plotRect.x, y);
                context.lineTo(plotRect.x + plotRect.width, y);
                context.stroke();
            }
        }

        if (xAxisScene?.visible && xAxisScene.gridLines && xCategories.length > 0) {
            const bandWidth = plotRect.width / xCategories.length;
            for (let i = 0; i <= xCategories.length; i++) {
                const x = crispPixel(plotRect.x + i * bandWidth, 1);
                context.beginPath();
                context.moveTo(x, plotRect.y);
                context.lineTo(x, plotRect.y + plotRect.height);
                context.stroke();
            }
        }

        // 2. Draw Heatmap Series clipped to plot area
        context.save();
        context.beginPath();
        context.rect(plotRect.x, plotRect.y, plotRect.width, plotRect.height);
        context.clip();

        for (const s of series) {
            HeatmapSeriesRenderer.render(context, s);
        }
        context.restore();

        // 3. Draw Axis Baseline Lines
        const axisLineColor =
            styleResolver.resolveCssVariable("--mona-chart-axis-line-color") ||
            styleResolver.resolveCssVariable("--color-border-control") ||
            "rgba(148, 163, 184, 0.45)";

        for (const axisScene of axes) {
            if (!axisScene.visible || !axisScene.axisLine) {
                continue;
            }
            context.strokeStyle = axisLineColor;
            context.lineWidth = 1;
            context.beginPath();

            if (axisScene.axis === "y") {
                const x =
                    axisScene.position === "right"
                        ? crispPixel(plotRect.x + plotRect.width, 1)
                        : crispPixel(plotRect.x, 1);
                context.moveTo(x, plotRect.y);
                context.lineTo(x, plotRect.y + plotRect.height);
            } else if (axisScene.axis === "x") {
                const y =
                    axisScene.position === "top"
                        ? crispPixel(plotRect.y, 1)
                        : crispPixel(plotRect.y + plotRect.height, 1);
                context.moveTo(plotRect.x, y);
                context.lineTo(plotRect.x + plotRect.width, y);
            }
            context.stroke();
        }

        // 4. Draw Interaction Indicators (hover & keyboard focus)
        if (interactionState) {
            const isKeyboard = interactionState.source === "keyboard";
            const hit = interactionState.activeHitTarget ?? interactionState.activeHits[0];
            if (hit && hit.seriesType === "heatmap" && hit.bounds) {
                const b = hit.visualBounds ?? hit.bounds;
                const radius = hit.borderRadius ?? 2;
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
                        styleResolver.resolveCssVariable("--mona-chart-heatmap-hover-outline-color") ||
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

