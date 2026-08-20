import type { ChartInteractionState } from "../interaction/chart-interaction-state";
import type { CartesianXYChartScene } from "../scene/chart-scene";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { crispPixel, drawBarRect, drawBarRectOutline, drawPointMarker } from "../utils/canvas-utils";

export class CartesianInteractionOverlayRenderer {
    public static render(
        context: CanvasRenderingContext2D,
        scene: CartesianXYChartScene,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver
    ): void {
        if (!interactionState || (!interactionState.activeHitTarget && interactionState.activeHits.length === 0)) {
            return;
        }

        const { plotRect, series } = scene;
        if (plotRect.width <= 0 || plotRect.height <= 0) {
            return;
        }

        const hits =
            interactionState.activeHits.length > 0
                ? interactionState.activeHits
                : interactionState.activeHitTarget
                  ? [interactionState.activeHitTarget]
                  : [];

        if (hits.length === 0) {
            return;
        }

        context.save();
        context.beginPath();
        context.rect(plotRect.x, plotRect.y, plotRect.width, plotRect.height);
        context.clip();

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
            if (hit.seriesType === "rangeArea" && (hit.rangeBand || (hit.highPoint && hit.lowPoint))) {
                const matchingSeries = series.find(s => s.id === hit.seriesId);
                const color = isKeyboardSource
                    ? focusIndicatorColor
                    : (matchingSeries?.style.color ?? "#3b82f6");
                const fromP = hit.rangeBand?.fromPoint ?? hit.highPoint!;
                const toP = hit.rangeBand?.toPoint ?? hit.lowPoint!;

                // Interval connector line
                context.save();
                context.beginPath();
                context.moveTo(fromP.x, fromP.y);
                context.lineTo(toP.x, toP.y);
                context.strokeStyle = color;
                context.lineWidth = isKeyboardSource ? 2 : 1.5;
                context.stroke();
                context.restore();

                // From marker
                drawPointMarker(context, fromP.x, fromP.y, 5, color, markerStrokeColor, 2);
                // To marker (if distinct)
                if (fromP.y !== toP.y || fromP.x !== toP.x) {
                    drawPointMarker(context, toP.x, toP.y, 5, color, markerStrokeColor, 2);
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
                if (barRect) {
                    const isHorizontalBar = hit.barOrientation === "horizontal" || scene.orientation === "horizontal";
                    const isZeroExtent = isHorizontalBar ? barRect.width <= 0.001 : barRect.height <= 0.001;
                    if (isZeroExtent) {
                        context.save();
                        context.beginPath();
                        if (isHorizontalBar) {
                            const x = crispPixel(barRect.x, 1);
                            context.moveTo(x, barRect.y);
                            context.lineTo(x, barRect.y + barRect.height);
                        } else {
                            const y = crispPixel(barRect.y, 1);
                            context.moveTo(barRect.x, y);
                            context.lineTo(barRect.x + barRect.width, y);
                        }
                        context.lineWidth = isKeyboardSource ? 2.5 : 2;
                        context.strokeStyle = isKeyboardSource ? focusIndicatorColor : barHighlightColor;
                        context.stroke();
                        context.restore();
                    } else {
                        const radius = hit.borderRadius ?? 4;
                        const cornerRadii = hit.cornerRadii ?? (hit.seriesType === "rangeBar" && radius > 0 ? {
                            bottomLeft: radius,
                            bottomRight: radius,
                            topLeft: radius,
                            topRight: radius
                        } : undefined);
                        const isPos = hit.isPositive ?? true;

                        context.save();
                        if (isKeyboardSource) {
                            context.strokeStyle = focusIndicatorColor;
                            context.lineWidth = 2;
                            drawBarRectOutline(context, barRect.x, barRect.y, barRect.width, barRect.height, radius, isPos, cornerRadii);
                        } else {
                            context.fillStyle = barHighlightColor;
                            drawBarRect(context, barRect.x, barRect.y, barRect.width, barRect.height, radius, isPos, cornerRadii);
                        }
                        context.restore();
                    }
                }
            }
        }

        context.restore();
    }
}
