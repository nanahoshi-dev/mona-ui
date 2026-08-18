import type { ChartWaterfallSeriesScene } from "../../scene/waterfall-scene";
import { drawCellRect, drawCellRectOutline } from "../../utils/canvas-utils";

export class WaterfallSeriesRenderer {
    public static render(context: CanvasRenderingContext2D, series: ChartWaterfallSeriesScene): void {
        const { bars, connectors, renderOpacity = 1, style } = series;
        if (bars.length === 0 || renderOpacity <= 0) {
            return;
        }

        const strokeWidth = style.strokeWidth ?? 0;
        const strokeColor = style.strokeColor;
        const fillOpacity = style.fillOpacity ?? 1;

        // 1. Render connectors behind bars
        for (const conn of connectors) {
            const connOpacity = conn.renderOpacity ?? 1;
            if (connOpacity <= 0 || conn.width <= 0 || conn.fromX >= conn.toX) {
                continue;
            }

            context.save();
            context.globalAlpha = renderOpacity * connOpacity;
            context.strokeStyle = conn.color;
            context.lineWidth = conn.width;
            context.setLineDash([4, 4]);

            context.beginPath();
            context.moveTo(conn.fromX, conn.y);
            context.lineTo(conn.toX, conn.y);
            context.stroke();

            context.restore();
        }

        // 2. Render bars
        for (const bar of bars) {
            const barOpacity = bar.renderOpacity ?? 1;
            if (barOpacity <= 0 || bar.bounds.width <= 0 || bar.bounds.height <= 0) {
                continue;
            }

            context.save();

            context.globalAlpha = renderOpacity * barOpacity * fillOpacity;
            context.fillStyle = bar.color;

            if (bar.borderRadius > 0 && !bar.isZeroChange) {
                drawCellRect(
                    context,
                    bar.bounds.x,
                    bar.bounds.y,
                    bar.bounds.width,
                    bar.bounds.height,
                    bar.borderRadius
                );
            } else {
                context.fillRect(bar.bounds.x, bar.bounds.y, bar.bounds.width, bar.bounds.height);
            }

            if (strokeWidth > 0 && strokeColor) {
                context.globalAlpha = renderOpacity * barOpacity;
                context.strokeStyle = strokeColor;
                context.lineWidth = strokeWidth;
                if (bar.borderRadius > 0 && !bar.isZeroChange) {
                    drawCellRectOutline(
                        context,
                        bar.bounds.x,
                        bar.bounds.y,
                        bar.bounds.width,
                        bar.bounds.height,
                        bar.borderRadius
                    );
                } else {
                    context.strokeRect(bar.bounds.x, bar.bounds.y, bar.bounds.width, bar.bounds.height);
                }
            }

            context.restore();
        }
    }
}
