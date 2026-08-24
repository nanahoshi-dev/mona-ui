import type { ChartInteractionState } from "../interaction/chart-interaction-state";
import type { CartesianWaterfallChartScene } from "../scene/waterfall-scene";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { crispPixel, drawCellRectOutline } from "../utils/canvas-utils";
import { WaterfallSeriesRenderer } from "./series/waterfall-series-renderer";

export class WaterfallChartRenderer {
    public static render(
        context: CanvasRenderingContext2D,
        scene: CartesianWaterfallChartScene,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver
    ): void {
        const { axes, plotRect, series } = scene;

        if (plotRect.width <= 0 || plotRect.height <= 0) {
            return;
        }

        context.save();

        // 1. Draw Grid Lines
        const gridColor = styleResolver.resolveCssVariable("--mona-chart-grid-color") || "rgba(148, 163, 184, 0.2)";

        context.strokeStyle = gridColor;
        context.lineWidth = 1;

        for (const axisScene of axes) {
            if (!axisScene.visible || !axisScene.gridLines) {
                continue;
            }
            if (axisScene.axis === "y") {
                for (const tick of axisScene.ticks) {
                    const y = crispPixel(tick.coordinate, 1);
                    context.beginPath();
                    context.moveTo(plotRect.x, y);
                    context.lineTo(plotRect.x + plotRect.width, y);
                    context.stroke();
                }
            } else if (axisScene.axis === "x") {
                for (const tick of axisScene.ticks) {
                    const x = crispPixel(tick.coordinate, 1);
                    context.beginPath();
                    context.moveTo(x, plotRect.y);
                    context.lineTo(x, plotRect.y + plotRect.height);
                    context.stroke();
                }
            }
        }

        // 2. Draw Series in plot area
        context.save();
        context.beginPath();
        context.rect(plotRect.x, plotRect.y, plotRect.width, plotRect.height);
        context.clip();

        for (const s of series) {
            WaterfallSeriesRenderer.render(context, s);
        }

        // 3. Draw Interaction Overlays
        if (interactionState) {
            const isKeyboard = interactionState.source === "keyboard";
            const hit = interactionState.activeHitTarget ?? interactionState.activeHits[0];
            if (hit && hit.seriesType === "waterfall" && hit.bounds) {
                const b = hit.visualBounds ?? hit.bounds;
                const radius = hit.borderRadius ?? 4;

                const focusColor =
                    styleResolver.resolveCssVariable("--color-ring") ||
                    styleResolver.resolveCssVariable("--color-focus-indicator") ||
                    styleResolver.resolveCssVariable("--color-primary") ||
                    "#3b82f6";

                const hoverColor =
                    styleResolver.resolveCssVariable("--mona-chart-waterfall-hover-outline-color") ||
                    styleResolver.resolveCssVariable("--color-border-control") ||
                    "rgba(255, 255, 255, 0.85)";

                context.strokeStyle = isKeyboard ? focusColor : hoverColor;
                context.lineWidth = isKeyboard ? 2.5 : 1.5;

                drawCellRectOutline(context, b.x, b.y, b.width, b.height, radius);
            }
        }

        context.restore();

        // 4. Draw Axis baseline lines
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

            if (axisScene.axis === "x") {
                const y =
                    axisScene.position === "top"
                        ? crispPixel(plotRect.y, 1)
                        : crispPixel(plotRect.y + plotRect.height, 1);
                context.moveTo(plotRect.x, y);
                context.lineTo(plotRect.x + plotRect.width, y);
            } else if (axisScene.axis === "y") {
                const x =
                    axisScene.position === "right"
                        ? crispPixel(plotRect.x + plotRect.width, 1)
                        : crispPixel(plotRect.x, 1);
                context.moveTo(x, plotRect.y);
                context.lineTo(x, plotRect.y + plotRect.height);
            }
            context.stroke();
        }

        context.restore();
    }
}
