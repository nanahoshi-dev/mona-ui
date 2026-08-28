import type { ChartRect } from "../../models/chart.models";
import { CartesianMarkVisualGeometry } from "../interaction/cartesian-mark-visual-geometry";
import type { ChartAxisScene } from "../scene/cartesian-scene";
import type { CartesianSelectionScene } from "../scene/cartesian-selection-scene";
import { clipToPlotRect } from "../utils/canvas-utils";

export interface CartesianSelectionRenderOptions {
    readonly axes?: readonly ChartAxisScene[];
    readonly color?: string;
    readonly fillOpacity?: number;
    readonly plotRect: ChartRect;
    readonly strokeWidth?: number;
}

export class CartesianSelectionOverlayRenderer {
    public static render(
        ctx: CanvasRenderingContext2D,
        scene: CartesianSelectionScene,
        options: CartesianSelectionRenderOptions
    ): void {
        if (scene.hits.length === 0) {
            return;
        }

        const { axes = [], color = "#3b82f6", fillOpacity = 0.12, plotRect, strokeWidth = 2 } = options;

        ctx.save();
        clipToPlotRect(ctx, plotRect, axes);

        ctx.strokeStyle = color;
        ctx.lineWidth = strokeWidth;

        for (const hit of scene.hits) {
            const type = hit.seriesType;

            if (type === "bar" || type === "rangeBar") {
                const b = CartesianMarkVisualGeometry.getVisualBounds(hit);
                if (b) {
                    if (fillOpacity > 0) {
                        ctx.fillStyle = color;
                        ctx.globalAlpha = fillOpacity;
                        ctx.fillRect(b.x, b.y, b.width, b.height);
                        ctx.globalAlpha = 1.0;
                    }
                    ctx.strokeRect(b.x, b.y, b.width, b.height);
                }
            } else if (type === "rangeArea") {
                const highPt = hit.highPoint ?? hit.point;
                const lowPt = hit.lowPoint ?? hit.point;
                if (highPt && lowPt) {
                    ctx.beginPath();
                    ctx.moveTo(highPt.x, highPt.y);
                    ctx.lineTo(lowPt.x, lowPt.y);
                    ctx.stroke();

                    // High endpoint ring
                    ctx.beginPath();
                    ctx.arc(highPt.x, highPt.y, 5, 0, Math.PI * 2);
                    ctx.stroke();

                    // Low endpoint ring
                    ctx.beginPath();
                    ctx.arc(lowPt.x, lowPt.y, 5, 0, Math.PI * 2);
                    ctx.stroke();
                }
            } else if (type === "candlestick" || type === "ohlc") {
                const b = CartesianMarkVisualGeometry.getVisualBounds(hit);
                if (b) {
                    if (fillOpacity > 0) {
                        ctx.fillStyle = color;
                        ctx.globalAlpha = fillOpacity;
                        ctx.fillRect(b.x, b.y, b.width, b.height);
                        ctx.globalAlpha = 1.0;
                    }
                    ctx.strokeRect(b.x, b.y, b.width, b.height);
                } else if (hit.point) {
                    ctx.beginPath();
                    ctx.arc(hit.point.x, hit.point.y, 6, 0, Math.PI * 2);
                    ctx.stroke();
                }
            } else {
                // Point-like (line, area, scatter, bubble)
                const pt = CartesianMarkVisualGeometry.getVisualCenter(hit);
                const baseRadius = CartesianMarkVisualGeometry.getVisualRadius(hit, 4);
                const ringRadius = baseRadius + 3;

                if (fillOpacity > 0) {
                    ctx.fillStyle = color;
                    ctx.globalAlpha = fillOpacity;
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, ringRadius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1.0;
                }

                ctx.beginPath();
                ctx.arc(pt.x, pt.y, ringRadius, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        ctx.restore();
    }
}
