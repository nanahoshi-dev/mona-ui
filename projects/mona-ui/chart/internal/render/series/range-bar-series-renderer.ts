import type { ChartRangeBarSeriesScene } from "../../scene/cartesian-scene";
import { crispPixel, drawBarRect } from "../../utils/canvas-utils";

export class RangeBarSeriesRenderer {
    public static render(context: CanvasRenderingContext2D, scene: ChartRangeBarSeriesScene): void {
        const { bars, borderRadius, fillOpacity, style } = scene;

        if (bars.length === 0) {
            return;
        }

        context.save();
        const baseAlpha = fillOpacity * (scene.renderOpacity ?? 1);
        context.fillStyle = style.color;

        for (const bar of bars) {
            const barAlpha = baseAlpha * (bar.renderOpacity ?? 1);
            if (barAlpha <= 0) {
                continue;
            }

            if (bar.height <= 0.001) {
                // Render zero-length interval as horizontal hairline
                context.save();
                context.beginPath();
                const y = crispPixel(bar.y, 1);
                context.moveTo(bar.x, y);
                context.lineTo(bar.x + bar.width, y);
                context.lineWidth = 1.5;
                context.strokeStyle = style.color;
                context.globalAlpha = barAlpha;
                context.stroke();
                context.restore();
                continue;
            }

            const radius = bar.radius ?? borderRadius;
            const cornerRadii = bar.cornerRadii ?? (radius > 0 ? {
                bottomLeft: radius,
                bottomRight: radius,
                topLeft: radius,
                topRight: radius
            } : undefined);

            context.globalAlpha = barAlpha;
            drawBarRect(
                context,
                bar.x,
                bar.y,
                bar.width,
                bar.height,
                radius,
                true,
                cornerRadii
            );
        }

        context.restore();
    }
}
