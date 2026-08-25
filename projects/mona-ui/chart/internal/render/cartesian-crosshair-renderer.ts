import type { ChartRect } from "../../models/chart.models";
import type { ChartCrosshairRegistration } from "../context/chart-registration-context";
import type { ChartCrosshairState } from "../interaction/chart-crosshair-state";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { crispPixel } from "../utils/canvas-utils";

function getCrosshairDash(style: string): readonly number[] {
    switch (style) {
        case "dotted":
            return [2, 3];
        case "solid":
            return [];
        case "dashed":
        default:
            return [4, 4];
    }
}

export class CartesianCrosshairRenderer {
    public static render(
        context: CanvasRenderingContext2D,
        crosshairState: ChartCrosshairState | null,
        registration: ChartCrosshairRegistration | null,
        plotRect: ChartRect,
        styleResolver: ChartStyleResolver
    ): void {
        if (!crosshairState || !registration || registration.enabled() === false) {
            return;
        }

        if (!crosshairState.x && !crosshairState.y) {
            return;
        }

        if (plotRect.width <= 0 || plotRect.height <= 0) {
            return;
        }

        const style = styleResolver.resolveCrosshairStyle(registration);
        if (style.width <= 0 || style.opacity <= 0) {
            return;
        }
        const dash = getCrosshairDash(registration.lineStyle());

        context.save();
        context.beginPath();
        context.rect(plotRect.x, plotRect.y, plotRect.width, plotRect.height);
        context.clip();

        context.strokeStyle = style.color;
        context.lineWidth = style.width;
        context.globalAlpha = style.opacity;
        context.setLineDash(dash as number[]);

        // Render Vertical X Crosshair line
        if (crosshairState.x) {
            const x = crispPixel(crosshairState.x.coordinate, style.width);
            if (x >= plotRect.x && x <= plotRect.x + plotRect.width) {
                context.beginPath();
                context.moveTo(x, plotRect.y);
                context.lineTo(x, plotRect.y + plotRect.height);
                context.stroke();
            }
        }

        // Render Horizontal Y Crosshair line
        if (crosshairState.y) {
            const y = crispPixel(crosshairState.y.coordinate, style.width);
            if (y >= plotRect.y && y <= plotRect.y + plotRect.height) {
                context.beginPath();
                context.moveTo(plotRect.x, y);
                context.lineTo(plotRect.x + plotRect.width, y);
                context.stroke();
            }
        }

        context.setLineDash([]);
        context.restore();
    }
}
