import { arc } from "d3-shape";
import type { ChartInteractionState } from "../../interaction/chart-interaction-state";
import type { ChartPolarSeriesScene, ScenePolarSlice } from "../../scene/polar-scene";
import type { ChartStyleResolver } from "../../style/chart-style-resolver";

export class PolarSeriesRenderer {
    public static render(
        context: CanvasRenderingContext2D,
        series: ChartPolarSeriesScene,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver
    ): void {
        const { center, slices, style } = series;
        if (!slices || slices.length === 0) {
            return;
        }

        const arcGenerator = arc<ScenePolarSlice>()
            .innerRadius(d => d.innerRadius)
            .outerRadius(d => d.outerRadius)
            .startAngle(d => d.startAngle)
            .endAngle(d => d.endAngle)
            .padAngle(d => d.padAngle)
            .cornerRadius(d => d.cornerRadius)
            .context(context);

        context.save();
        context.translate(center.x, center.y);

        // 1. Draw slice fills and separator strokes
        for (const slice of slices) {
            if (!slice.visible) {
                continue;
            }

            context.save();
            context.beginPath();
            arcGenerator(slice);
            context.fillStyle = slice.color;
            context.globalAlpha = style.fillOpacity;
            context.fill();

            if (style.strokeWidth > 0 && style.strokeColor) {
                context.strokeStyle = style.strokeColor;
                context.lineWidth = style.strokeWidth;
                context.stroke();
            }
            context.restore();
        }

        // 2. Draw Interaction Overlay for active slice
        const activeHit = interactionState?.activeHitTarget;
        if (activeHit && activeHit.seriesId === series.id) {
            const activeSlice = slices.find(s => s.sliceId === activeHit.sliceId || s.dataIndex === activeHit.index);
            if (activeSlice && activeSlice.visible) {
                context.save();
                context.beginPath();
                arcGenerator(activeSlice);

                // Hover overlay (translucent fill only, no border)
                const hoverOverlayColor =
                    styleResolver.resolveCssVariable("--mona-chart-slice-hover-overlay") ||
                    "rgba(255, 255, 255, 0.22)";
                context.fillStyle = hoverOverlayColor;
                context.fill();

                context.restore();
            }
        }

        context.restore();
    }
}
