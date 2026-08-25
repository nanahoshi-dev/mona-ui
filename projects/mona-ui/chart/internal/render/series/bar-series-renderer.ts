import type { ChartBarSeriesScene } from "../../scene/cartesian-scene";
import { drawBarRect } from "../../utils/canvas-utils";

export class BarSeriesRenderer {
    public static render(context: CanvasRenderingContext2D, scene: ChartBarSeriesScene): void {
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
            context.globalAlpha = barAlpha;
            drawBarRect(
                context,
                bar.x,
                bar.y,
                bar.width,
                bar.height,
                bar.radius ?? borderRadius,
                bar.isPositive,
                bar.cornerRadii
            );
        }

        context.restore();
    }
}
