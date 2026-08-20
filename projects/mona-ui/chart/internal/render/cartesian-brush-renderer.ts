import type { ChartRect } from "../../models/chart.models";
import type { ChartBrushRegistration } from "../context/chart-registration-context";

export class CartesianBrushRenderer {
    public static render(
        ctx: CanvasRenderingContext2D,
        brushRect: ChartRect,
        plotRect: ChartRect,
        registration: ChartBrushRegistration
    ): void {
        const fillColor = registration.fillColor?.() ?? "#3b82f6";
        const fillOpacity = registration.fillOpacity?.() ?? 0.15;
        const borderColor = registration.borderColor?.() ?? "#3b82f6";
        const borderWidth = registration.borderWidth?.() ?? 1;
        const lineStyle = registration.lineStyle?.() ?? "solid";

        ctx.save();
        ctx.beginPath();
        ctx.rect(plotRect.x, plotRect.y, plotRect.width, plotRect.height);
        ctx.clip();

        // Fill
        if (fillOpacity > 0) {
            ctx.fillStyle = fillColor;
            ctx.globalAlpha = fillOpacity;
            ctx.fillRect(brushRect.x, brushRect.y, brushRect.width, brushRect.height);
            ctx.globalAlpha = 1.0;
        }

        // Stroke
        if (borderWidth > 0) {
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = borderWidth;

            if (lineStyle === "dashed") {
                ctx.setLineDash([4, 4]);
            } else if (lineStyle === "dotted") {
                ctx.setLineDash([2, 2]);
            } else {
                ctx.setLineDash([]);
            }

            ctx.strokeRect(brushRect.x, brushRect.y, brushRect.width, brushRect.height);
        }

        ctx.restore();
    }
}
