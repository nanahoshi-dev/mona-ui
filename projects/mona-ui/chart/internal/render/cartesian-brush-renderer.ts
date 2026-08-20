import type { ChartBrushLineStyle } from "../../models/chart-brush.models";
import type { ChartRect } from "../../models/chart.models";
import type { ChartBrushRegistration } from "../context/chart-registration-context";

export class CartesianBrushRenderer {
    public static render(
        ctx: CanvasRenderingContext2D,
        brushRect: ChartRect,
        plotRect: ChartRect,
        registration: ChartBrushRegistration,
        resolvedStyle?: {
            readonly borderColor: string;
            readonly borderWidth: number;
            readonly fillColor: string;
            readonly fillOpacity: number;
            readonly lineStyle: ChartBrushLineStyle;
        }
    ): void {
        const fillColor = registration.fillColor?.() ?? resolvedStyle?.fillColor ?? "#3b82f6";
        const fillOpacity = registration.fillOpacity?.() ?? resolvedStyle?.fillOpacity ?? 0.15;
        const borderColor = registration.borderColor?.() ?? resolvedStyle?.borderColor ?? "#3b82f6";
        const borderWidth = registration.borderWidth?.() ?? resolvedStyle?.borderWidth ?? 1;
        const lineStyle = registration.lineStyle?.() ?? resolvedStyle?.lineStyle ?? "solid";

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
