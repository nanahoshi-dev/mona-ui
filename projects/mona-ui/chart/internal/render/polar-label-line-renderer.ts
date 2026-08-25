import type { ChartPolarSeriesScene } from "../scene/polar-scene";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { crispPixel } from "../utils/canvas-utils";

export class PolarLabelLineRenderer {
    public static render(
        context: CanvasRenderingContext2D,
        series: ChartPolarSeriesScene,
        styleResolver: ChartStyleResolver
    ): void {
        if (!series.showLabels || series.labelPosition !== "outside" || !series.slices || series.slices.length === 0) {
            return;
        }

        const lineColor =
            styleResolver.resolveCssVariable("--mona-chart-label-line-color") ||
            styleResolver.resolveCssVariable("--color-muted-foreground") ||
            "rgba(148, 163, 184, 0.6)";

        const lineWidth = 1;

        context.save();
        context.strokeStyle = lineColor;
        context.lineWidth = lineWidth;
        context.beginPath();

        let lineCount = 0;

        for (const slice of series.slices) {
            if (!slice.visible || !slice.label || !slice.label.visible) {
                continue;
            }

            const { arcAnchor, elbow, lineEnd } = slice.label;

            context.moveTo(arcAnchor.x, arcAnchor.y);
            context.lineTo(elbow.x, elbow.y);
            context.lineTo(lineEnd.x, crispPixel(lineEnd.y, lineWidth));
            lineCount++;
        }

        if (lineCount > 0) {
            context.stroke();
        }

        context.restore();
    }
}
