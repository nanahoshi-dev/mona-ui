import type {
    ChartBubbleSeriesScene,
    ChartScatterSeriesScene
} from "../../scene/cartesian-scene";

export class MarkerSeriesRenderer {
    public static render(
        context: CanvasRenderingContext2D,
        scene: ChartBubbleSeriesScene | ChartScatterSeriesScene
    ): void {
        const { markers, renderOpacity = 1, style } = scene;
        if (markers.length === 0 || renderOpacity <= 0) {
            return;
        }

        const hasPerMarkerOpacity = markers.some(
            m => m.renderOpacity !== undefined && m.renderOpacity < 1
        );

        if (!hasPerMarkerOpacity) {
            // Uniform Alpha Fast Path: Batch all circle arcs into one path for fill and stroke
            context.save();
            const fillAlpha = Math.max(0, Math.min(1, style.fillOpacity * renderOpacity));
            context.fillStyle = style.color;
            context.globalAlpha = fillAlpha;

            context.beginPath();
            for (let i = 0; i < markers.length; i++) {
                const m = markers[i];
                if (m.radius > 0) {
                    context.moveTo(m.x + m.radius, m.y);
                    context.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
                }
            }
            context.fill();

            if (style.strokeWidth > 0 && style.strokeColor) {
                context.strokeStyle = style.strokeColor;
                context.lineWidth = style.strokeWidth;
                context.globalAlpha = Math.max(0, Math.min(1, renderOpacity));
                context.stroke();
            }
            context.restore();
        } else {
            // Animated per-marker alpha path
            context.save();
            for (let i = 0; i < markers.length; i++) {
                const m = markers[i];
                const markerOpacity = (m.renderOpacity ?? 1) * renderOpacity;
                if (markerOpacity <= 0 || m.radius <= 0) {
                    continue;
                }

                context.beginPath();
                context.arc(m.x, m.y, m.radius, 0, Math.PI * 2);

                context.fillStyle = style.color;
                context.globalAlpha = Math.max(0, Math.min(1, style.fillOpacity * markerOpacity));
                context.fill();

                if (style.strokeWidth > 0 && style.strokeColor) {
                    context.strokeStyle = style.strokeColor;
                    context.lineWidth = style.strokeWidth;
                    context.globalAlpha = Math.max(0, Math.min(1, markerOpacity));
                    context.stroke();
                }
            }
            context.restore();
        }
    }
}
