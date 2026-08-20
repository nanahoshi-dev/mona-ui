import type { ChartInteractionState } from "../interaction/chart-interaction-state";
import type { CartesianXYChartScene } from "../scene/chart-scene";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import type { ChartRect } from "../../models/chart.models";
import { crispPixel } from "../utils/canvas-utils";
import { AreaSeriesRenderer } from "./series/area-series-renderer";
import { BarSeriesRenderer } from "./series/bar-series-renderer";
import { CandlestickSeriesRenderer } from "./series/candlestick-series-renderer";
import { LineSeriesRenderer } from "./series/line-series-renderer";
import { MarkerSeriesRenderer } from "./series/marker-series-renderer";
import { OhlcSeriesRenderer } from "./series/ohlc-series-renderer";
import { RangeAreaSeriesRenderer } from "./series/range-area-series-renderer";
import { RangeBarSeriesRenderer } from "./series/range-bar-series-renderer";
import { CartesianOverlayRenderer } from "./cartesian-overlay-renderer";
import { CartesianCrosshairRenderer } from "./cartesian-crosshair-renderer";
import { CartesianInteractionOverlayRenderer } from "./cartesian-interaction-overlay-renderer";
import type { CartesianOverlayScene } from "../scene/cartesian-overlay-scene";
import type { ChartCrosshairRegistration } from "../context/chart-registration-context";
import type { ChartCrosshairState } from "../interaction/chart-crosshair-state";

export interface ChartRenderOverlayState {
    readonly cartesianOverlay?: CartesianOverlayScene | null;
    readonly crosshair?: ChartCrosshairState | null;
    readonly crosshairRegistration?: ChartCrosshairRegistration | null;
    readonly interaction?: ChartInteractionState | null;
}

export class CartesianChartRenderer {
    public static renderGridLayer(
        context: CanvasRenderingContext2D,
        scene: CartesianXYChartScene,
        styleResolver: ChartStyleResolver
    ): void {
        const { axes, plotRect } = scene;
        const gridColor =
            styleResolver.resolveCssVariable("--mona-chart-grid-color") ||
            "rgba(148, 163, 184, 0.2)";

        context.save();
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
        context.restore();
    }

    public static renderStaticUnderlayLayer(
        context: CanvasRenderingContext2D,
        cartesianOverlay: CartesianOverlayScene | null,
        plotRect: ChartRect
    ): void {
        CartesianOverlayRenderer.renderUnderlays(context, cartesianOverlay, plotRect);
    }

    public static renderSeriesLayer(
        context: CanvasRenderingContext2D,
        scene: CartesianXYChartScene
    ): void {
        const { plotRect, series } = scene;
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
    }

    public static renderStaticOverlayLayer(
        context: CanvasRenderingContext2D,
        cartesianOverlay: CartesianOverlayScene | null,
        plotRect: ChartRect
    ): void {
        CartesianOverlayRenderer.renderOverlays(context, cartesianOverlay, plotRect);
    }

    public static renderAxisLayer(
        context: CanvasRenderingContext2D,
        scene: CartesianXYChartScene,
        styleResolver: ChartStyleResolver
    ): void {
        const { axes, plotRect } = scene;
        const axisLineColor =
            styleResolver.resolveCssVariable("--mona-chart-axis-line-color") ||
            styleResolver.resolveCssVariable("--color-border-control") ||
            "rgba(148, 163, 184, 0.45)";

        context.save();
        for (const axisScene of axes) {
            if (!axisScene.visible) {
                continue;
            }

            context.strokeStyle = axisLineColor;
            context.lineWidth = 1;

            const sideOffset = axisScene.sideOffset ?? 0;

            if (axisScene.axisLine) {
                context.beginPath();
                if (axisScene.axis === "x") {
                    const y =
                        axisScene.position === "top"
                            ? crispPixel(plotRect.y - sideOffset, 1)
                            : crispPixel(plotRect.y + plotRect.height + sideOffset, 1);
                    context.moveTo(plotRect.x, y);
                    context.lineTo(plotRect.x + plotRect.width, y);
                } else if (axisScene.axis === "y") {
                    const x =
                        axisScene.position === "right"
                            ? crispPixel(plotRect.x + plotRect.width + sideOffset, 1)
                            : crispPixel(plotRect.x - sideOffset, 1);
                    context.moveTo(x, plotRect.y);
                    context.lineTo(x, plotRect.y + plotRect.height);
                }
                context.stroke();
            }

            if (axisScene.tickMarks && axisScene.ticks.length > 0) {
                const tickSize = axisScene.tickSize ?? 6;
                context.beginPath();
                if (axisScene.axis === "x") {
                    const baselineY =
                        axisScene.position === "top"
                            ? plotRect.y - sideOffset
                            : plotRect.y + plotRect.height + sideOffset;
                    const targetY = axisScene.position === "top" ? baselineY - tickSize : baselineY + tickSize;
                    for (const tick of axisScene.ticks) {
                        const x = crispPixel(tick.coordinate, 1);
                        context.moveTo(x, crispPixel(baselineY, 1));
                        context.lineTo(x, crispPixel(targetY, 1));
                    }
                } else if (axisScene.axis === "y") {
                    const baselineX =
                        axisScene.position === "right"
                            ? plotRect.x + plotRect.width + sideOffset
                            : plotRect.x - sideOffset;
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
        context.restore();
    }

    public static renderTransientLayer(
        context: CanvasRenderingContext2D,
        scene: CartesianXYChartScene,
        overlayState: ChartRenderOverlayState | ChartInteractionState | null,
        styleResolver: ChartStyleResolver
    ): void {
        const { plotRect } = scene;
        if (!overlayState) {
            return;
        }

        const interactionState: ChartInteractionState | null =
            "interaction" in overlayState
                ? (overlayState.interaction ?? null)
                : (overlayState as ChartInteractionState | null);
        const crosshairState: ChartCrosshairState | null =
            "crosshair" in overlayState ? (overlayState.crosshair ?? null) : null;
        const crosshairRegistration: ChartCrosshairRegistration | null =
            "crosshairRegistration" in overlayState ? (overlayState.crosshairRegistration ?? null) : null;

        context.save();
        // Crosshair Lines
        if (crosshairState && crosshairRegistration) {
            CartesianCrosshairRenderer.render(
                context,
                crosshairState,
                crosshairRegistration,
                plotRect,
                styleResolver
            );
        }

        // Active Highlights
        if (interactionState) {
            CartesianInteractionOverlayRenderer.render(context, scene, interactionState, styleResolver);
        }
        context.restore();
    }

    public static render(
        context: CanvasRenderingContext2D,
        scene: CartesianXYChartScene,
        overlayState: ChartRenderOverlayState | ChartInteractionState | null,
        styleResolver: ChartStyleResolver
    ): void {
        const { plotRect } = scene;

        if (plotRect.width <= 0 || plotRect.height <= 0) {
            return;
        }

        const cartesianOverlay: CartesianOverlayScene | null =
            overlayState && "cartesianOverlay" in overlayState ? (overlayState.cartesianOverlay ?? null) : null;

        context.save();
        // 1. Grid
        this.renderGridLayer(context, scene, styleResolver);
        // 2. Static Underlays
        this.renderStaticUnderlayLayer(context, cartesianOverlay, plotRect);
        // 3. Series
        this.renderSeriesLayer(context, scene);
        // 4. Static Overlays & Annotations
        this.renderStaticOverlayLayer(context, cartesianOverlay, plotRect);
        // 5. Axes
        this.renderAxisLayer(context, scene, styleResolver);
        // 6. Transient (Crosshair + Highlights)
        this.renderTransientLayer(context, scene, overlayState, styleResolver);
        context.restore();
    }

    public static renderCrossfade(
        context: CanvasRenderingContext2D,
        fromScene: CartesianXYChartScene | null,
        toScene: CartesianXYChartScene,
        progress: number,
        overlayState: ChartRenderOverlayState | ChartInteractionState | null,
        styleResolver: ChartStyleResolver
    ): void {
        const { plotRect } = toScene;
        if (plotRect.width <= 0 || plotRect.height <= 0) {
            return;
        }

        const cartesianOverlay: CartesianOverlayScene | null =
            overlayState && "cartesianOverlay" in overlayState ? (overlayState.cartesianOverlay ?? null) : null;

        context.save();

        // 1. Grid crossfade
        if (fromScene && progress < 1) {
            context.save();
            context.globalAlpha = Math.max(0, Math.min(1, 1 - progress));
            this.renderGridLayer(context, fromScene, styleResolver);
            context.restore();
        }
        if (progress > 0) {
            context.save();
            context.globalAlpha = Math.max(0, Math.min(1, progress));
            this.renderGridLayer(context, toScene, styleResolver);
            context.restore();
        }

        // 2. Target static underlay once (at full own opacity)
        this.renderStaticUnderlayLayer(context, cartesianOverlay, plotRect);

        // 3. Series crossfade
        if (fromScene && progress < 1) {
            context.save();
            context.globalAlpha = Math.max(0, Math.min(1, 1 - progress));
            this.renderSeriesLayer(context, fromScene);
            context.restore();
        }
        if (progress > 0) {
            context.save();
            context.globalAlpha = Math.max(0, Math.min(1, progress));
            this.renderSeriesLayer(context, toScene);
            context.restore();
        }

        // 4. Target static overlay once (at full own opacity)
        this.renderStaticOverlayLayer(context, cartesianOverlay, plotRect);

        // 5. Axes crossfade
        if (fromScene && progress < 1) {
            context.save();
            context.globalAlpha = Math.max(0, Math.min(1, 1 - progress));
            this.renderAxisLayer(context, fromScene, styleResolver);
            context.restore();
        }
        if (progress > 0) {
            context.save();
            context.globalAlpha = Math.max(0, Math.min(1, progress));
            this.renderAxisLayer(context, toScene, styleResolver);
            context.restore();
        }

        // 6. Target transient layer once
        this.renderTransientLayer(context, toScene, overlayState, styleResolver);

        context.restore();
    }
}
