import type { ChartFunnelSeriesScene } from "../../scene/funnel-scene";

export class FunnelSeriesRenderer {
    public static render(context: CanvasRenderingContext2D, series: ChartFunnelSeriesScene): void {
        const { renderOpacity = 1, stages, style } = series;
        if (stages.length === 0 || renderOpacity <= 0) {
            return;
        }

        const strokeWidth = style.strokeWidth ?? 1;
        const strokeColor = style.strokeColor;
        const fillOpacity = style.fillOpacity ?? 1;

        for (const stage of stages) {
            const stageOpacity = stage.renderOpacity ?? 1;
            if (stageOpacity <= 0 || stage.bounds.width <= 0 || stage.bounds.height <= 0) {
                continue;
            }

            const [p0, p1, p2, p3] = stage.polygon;

            context.save();

            context.globalAlpha = renderOpacity * stageOpacity * fillOpacity;
            context.fillStyle = stage.fillColor;

            context.beginPath();
            context.moveTo(p0.x, p0.y);
            context.lineTo(p1.x, p1.y);
            context.lineTo(p2.x, p2.y);
            context.lineTo(p3.x, p3.y);
            context.closePath();
            context.fill();

            if (strokeWidth > 0 && strokeColor) {
                context.globalAlpha = renderOpacity * stageOpacity;
                context.strokeStyle = strokeColor;
                context.lineWidth = strokeWidth;
                context.stroke();
            }

            context.restore();
        }
    }
}
