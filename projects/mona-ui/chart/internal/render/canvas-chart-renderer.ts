import type { ChartInteractionState } from "../interaction/chart-interaction-state";
import type { ChartScene } from "../scene/chart-scene";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { crispPixel, drawBarRect, drawPointMarker } from "../utils/canvas-utils";
import { AreaSeriesRenderer } from "./series/area-series-renderer";
import { BarSeriesRenderer } from "./series/bar-series-renderer";
import { LineSeriesRenderer } from "./series/line-series-renderer";

export class CanvasChartRenderer {
    public static render(
        context: CanvasRenderingContext2D,
        scene: ChartScene,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver
    ): void {
        const { axes, height, plotRect, series, width } = scene;

        context.clearRect(0, 0, width, height);

        if (plotRect.width <= 0 || plotRect.height <= 0) {
            return;
        }

        context.save();

        // 1. Draw Grid Lines (Muted, subtle lines behind series)
        const gridColor =
            styleResolver.resolveCssVariable("--mona-chart-grid-color") ||
            "rgba(148, 163, 184, 0.2)";

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

        // 2. Draw Series in order (Areas -> Bars -> Lines) clipped to plot area
        context.save();
        context.beginPath();
        context.rect(plotRect.x, plotRect.y, plotRect.width, plotRect.height);
        context.clip();

        for (const s of series) {
            if (s.type === "area") {
                AreaSeriesRenderer.render(context, s);
            }
        }
        for (const s of series) {
            if (s.type === "bar") {
                BarSeriesRenderer.render(context, s);
            }
        }
        for (const s of series) {
            if (s.type === "line") {
                LineSeriesRenderer.render(context, s);
            }
        }
        context.restore();

        // 3. Draw Axis Baseline Lines (crisp lines at edges of plotRect on top of series)
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

        // 4. Draw Interaction Overlays clipped to plotRect
        if (interactionState && (interactionState.activeHitTarget || interactionState.activeHits.length > 0)) {
            context.save();
            context.beginPath();
            context.rect(plotRect.x, plotRect.y, plotRect.width, plotRect.height);
            context.clip();

            const hits =
                interactionState.activeHits.length > 0
                    ? interactionState.activeHits
                    : interactionState.activeHitTarget
                      ? [interactionState.activeHitTarget]
                      : [];

            const primaryHit = hits[0];
            const crosshairX = primaryHit.point?.x ?? (primaryHit.bounds ? primaryHit.bounds.x + primaryHit.bounds.width / 2 : null);

            // Vertical crosshair
            if (crosshairX !== null) {
                const crosshairColor =
                    styleResolver.resolveCssVariable("--mona-chart-crosshair-color") ||
                    styleResolver.resolveCssVariable("--color-focus-indicator") ||
                    styleResolver.resolveCssVariable("--color-muted-foreground") ||
                    "rgba(148, 163, 184, 0.4)";
                context.strokeStyle = crosshairColor;
                context.lineWidth = 1;
                context.setLineDash([4, 4]);
                context.beginPath();
                const x = crispPixel(crosshairX, 1);
                context.moveTo(x, plotRect.y);
                context.lineTo(x, plotRect.y + plotRect.height);
                context.stroke();
                context.setLineDash([]);
            }

            // Active point markers & bar highlights
            const markerStrokeColor =
                styleResolver.resolveCssVariable("--mona-chart-marker-stroke-color") ||
                styleResolver.resolveCssVariable("--color-surface") ||
                "#ffffff";
            const barHighlightColor =
                styleResolver.resolveCssVariable("--mona-chart-bar-highlight-color") ||
                "rgba(255, 255, 255, 0.25)";

            for (const hit of hits) {
                if (hit.point) {
                    const matchingSeries = series.find(s => s.id === hit.seriesId);
                    const color = matchingSeries?.style.color ?? "#3b82f6";
                    drawPointMarker(context, hit.point.x, hit.point.y, 5, color, markerStrokeColor, 2);
                } else if (hit.bounds || hit.visualBounds) {
                    const barRect = hit.visualBounds ?? hit.bounds;
                    if (barRect && barRect.height > 0) {
                        const radius = hit.borderRadius ?? 4;
                        const isPos = hit.isPositive ?? true;
                        context.save();
                        context.fillStyle = barHighlightColor;
                        drawBarRect(context, barRect.x, barRect.y, barRect.width, barRect.height, radius, isPos);
                        context.restore();
                    }
                }
            }

            context.restore();
        }

        context.restore();
    }
}
