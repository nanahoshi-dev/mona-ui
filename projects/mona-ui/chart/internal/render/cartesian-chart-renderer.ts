import type { ChartInteractionState } from "../interaction/chart-interaction-state";
import type { CartesianChartScene } from "../scene/chart-scene";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { crispPixel, drawBarRect, drawPointMarker } from "../utils/canvas-utils";
import { AreaSeriesRenderer } from "./series/area-series-renderer";
import { BarSeriesRenderer } from "./series/bar-series-renderer";
import { LineSeriesRenderer } from "./series/line-series-renderer";
import { MarkerSeriesRenderer } from "./series/marker-series-renderer";
import { RangeAreaSeriesRenderer } from "./series/range-area-series-renderer";
import { RangeBarSeriesRenderer } from "./series/range-bar-series-renderer";

export class CartesianChartRenderer {
    public static render(
        context: CanvasRenderingContext2D,
        scene: CartesianChartScene,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver
    ): void {
        const { axes, plotRect, series } = scene;

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

        // 2. Draw Series in declaration order clipped to plot area
        context.save();
        context.beginPath();
        context.rect(plotRect.x, plotRect.y, plotRect.width, plotRect.height);
        context.clip();

        for (const s of series) {
            switch (s.type) {
                case "area":
                    AreaSeriesRenderer.render(context, s);
                    break;
                case "bar":
                    BarSeriesRenderer.render(context, s);
                    break;
                case "bubble":
                case "scatter":
                    MarkerSeriesRenderer.render(context, s);
                    break;
                case "line":
                    LineSeriesRenderer.render(context, s);
                    break;
                case "rangeArea":
                    RangeAreaSeriesRenderer.render(context, s);
                    break;
                case "rangeBar":
                    RangeBarSeriesRenderer.render(context, s);
                    break;
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
            const hasConnectedOrBarHit = hits.some(
                h =>
                    h.seriesType === "line" ||
                    h.seriesType === "area" ||
                    h.seriesType === "bar" ||
                    h.seriesType === "rangeArea" ||
                    h.seriesType === "rangeBar"
            );
            const crosshairX =
                primaryHit.point?.x ?? (primaryHit.bounds ? primaryHit.bounds.x + primaryHit.bounds.width / 2 : null);

            // Vertical crosshair (suppressed when active hits are only scatter / bubble)
            if (crosshairX !== null && hasConnectedOrBarHit) {
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
            const focusIndicatorColor =
                styleResolver.resolveCssVariable("--color-focus-indicator") ||
                styleResolver.resolveCssVariable("--color-ring") ||
                "#3b82f6";
            const isKeyboardSource = interactionState.source === "keyboard";

            for (const hit of hits) {
                if (hit.seriesType === "rangeArea" && hit.highPoint && hit.lowPoint) {
                    const matchingSeries = series.find(s => s.id === hit.seriesId);
                    const color = isKeyboardSource
                        ? focusIndicatorColor
                        : (matchingSeries?.style.color ?? "#3b82f6");
                    drawPointMarker(context, hit.highPoint.x, hit.highPoint.y, 5, color, markerStrokeColor, 2);
                    if (hit.lowPoint.y !== hit.highPoint.y) {
                        drawPointMarker(context, hit.lowPoint.x, hit.lowPoint.y, 5, color, markerStrokeColor, 2);
                    }
                } else if (hit.point) {
                    const isMarkerSeries = hit.seriesType === "scatter" || hit.seriesType === "bubble";
                    if (isMarkerSeries) {
                        const matchingSeries = series.find(s => s.id === hit.seriesId);
                        const seriesColor = matchingSeries?.style.color ?? hit.color ?? "#3b82f6";
                        const activeRadius = (hit.visualRadius ?? hit.radius ?? 5) + 3;
                        context.beginPath();
                        context.arc(hit.point.x, hit.point.y, activeRadius, 0, Math.PI * 2);
                        context.strokeStyle = isKeyboardSource ? focusIndicatorColor : seriesColor;
                        context.lineWidth = isKeyboardSource ? 2.5 : 2;
                        context.stroke();
                    } else {
                        const matchingSeries = series.find(s => s.id === hit.seriesId);
                        const color = isKeyboardSource
                            ? focusIndicatorColor
                            : (matchingSeries?.style.color ?? "#3b82f6");
                        drawPointMarker(context, hit.point.x, hit.point.y, 5, color, markerStrokeColor, 2);
                    }
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
