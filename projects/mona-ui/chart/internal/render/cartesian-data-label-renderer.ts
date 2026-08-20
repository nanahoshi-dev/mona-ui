import type { ChartRect } from "../../models/chart.models";
import type { SceneCanvasDataLabel } from "../scene/cartesian-data-label-scene";

export class CartesianDataLabelRenderer {
    public static render(
        ctx: CanvasRenderingContext2D,
        labels: readonly SceneCanvasDataLabel[],
        plotRect: ChartRect
    ): void {
        if (labels.length === 0) {
            return;
        }

        ctx.save();
        ctx.beginPath();
        ctx.rect(plotRect.x, plotRect.y, plotRect.width, plotRect.height);
        ctx.clip();

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        for (const label of labels) {
            const cx = label.bounds.x + label.bounds.width / 2;
            const cy = label.bounds.y + label.bounds.height / 2;

            if (label.font) {
                ctx.font = label.font;
            }

            if (label.haloWidth && label.haloWidth > 0 && label.haloColor) {
                ctx.strokeStyle = label.haloColor;
                ctx.lineWidth = label.haloWidth * 2;
                ctx.lineJoin = "round";
                ctx.strokeText(label.text, cx, cy);
            }

            ctx.fillStyle = label.color;
            ctx.fillText(label.text, cx, cy);
        }

        ctx.restore();
    }
}
