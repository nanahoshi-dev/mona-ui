import type { ChartInteractionState } from "../interaction/chart-interaction-state";
import type { CartesianXYChartScene } from "../scene/chart-scene";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { crispPixel, drawBarRect, drawBarRectOutline, drawPointMarker } from "../utils/canvas-utils";
import { AreaSeriesRenderer } from "./series/area-series-renderer";
import { BarSeriesRenderer } from "./series/bar-series-renderer";
import { CandlestickSeriesRenderer } from "./series/candlestick-series-renderer";
import { LineSeriesRenderer } from "./series/line-series-renderer";
import { MarkerSeriesRenderer } from "./series/marker-series-renderer";
import { OhlcSeriesRenderer } from "./series/ohlc-series-renderer";
import { RangeAreaSeriesRenderer } from "./series/range-area-series-renderer";
import { RangeBarSeriesRenderer } from "./series/range-bar-series-renderer";

export class CartesianChartRenderer {
    public static render(
        context: CanvasRenderingContext2D,
        scene: CartesianXYChartScene,
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
                case "candlestick":
                    CandlestickSeriesRenderer.render(context, s);
                    break;
                case "line":
                    LineSeriesRenderer.render(context, s);
                    break;
                case "ohlc":
                    OhlcSeriesRenderer.render(context, s);
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

        // 3. Draw Axis Baseline Lines & Outward Tick Marks
        const axisLineColor =
            styleResolver.resolveCssVariable("--mona-chart-axis-line-color") ||
            styleResolver.resolveCssVariable("--color-border-control") ||
            "rgba(148, 163, 184, 0.45)";

        for (const axisScene of axes) {
            if (!axisScene.visible) {
                continue;
            }

            context.strokeStyle = axisLineColor;
            context.lineWidth = 1;

            if (axisScene.axisLine) {
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

            if (axisScene.tickMarks && axisScene.ticks.length > 0) {
                const tickSize = axisScene.tickSize ?? 6;
                context.beginPath();
                if (axisScene.axis === "x") {
                    const baselineY = axisScene.position === "top" ? plotRect.y : plotRect.y + plotRect.height;
                    const targetY = axisScene.position === "top" ? baselineY - tickSize : baselineY + tickSize;
                    for (const tick of axisScene.ticks) {
                        const x = crispPixel(tick.coordinate, 1);
                        context.moveTo(x, crispPixel(baselineY, 1));
                        context.lineTo(x, crispPixel(targetY, 1));
                    }
                } else if (axisScene.axis === "y") {
                    const baselineX = axisScene.position === "right" ? plotRect.x + plotRect.width : plotRect.x;
                    const targetX = axisScene.position === "right" ? baselineX + tickSize : baselineX - tickSize;
                    for (const tick of axisScene.ticks) {
                        const y = crispPixel(tick.coordinate, 1);
                        context.moveTo(crispPixel(baselineX, 1), y);
                        context.lineTo(crispPixel(targetX, 1), y);
                    }
                }
                context.stroke();
            }
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
                    h.seriesType === "candlestick" ||
                    h.seriesType === "ohlc" ||
                    h.seriesType === "rangeArea" ||
                    h.seriesType === "rangeBar"
            );

            const isHorizontalChart = scene.interactionAxis === "y";
            const crosshairColor =
                styleResolver.resolveCssVariable("--mona-chart-crosshair-color") ||
                styleResolver.resolveCssVariable("--color-focus-indicator") ||
                styleResolver.resolveCssVariable("--color-muted-foreground") ||
                "rgba(148, 163, 184, 0.4)";

            if (isHorizontalChart && hasConnectedOrBarHit) {
                const crosshairY =
                    primaryHit.point?.y ?? (primaryHit.bounds ? primaryHit.bounds.y + primaryHit.bounds.height / 2 : null);
                if (crosshairY !== null) {
                    context.strokeStyle = crosshairColor;
                    context.lineWidth = 1;
                    context.setLineDash([4, 4]);
                    context.beginPath();
                    const y = crispPixel(crosshairY, 1);
                    context.moveTo(plotRect.x, y);
                    context.lineTo(plotRect.x + plotRect.width, y);
                    context.stroke();
                    context.setLineDash([]);
                }
            } else if (!isHorizontalChart && hasConnectedOrBarHit) {
                const crosshairX =
                    primaryHit.point?.x ?? (primaryHit.bounds ? primaryHit.bounds.x + primaryHit.bounds.width / 2 : null);
                if (crosshairX !== null) {
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

        context.restore();
    }
}
