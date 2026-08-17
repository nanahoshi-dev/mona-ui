import { arc } from "d3-shape";
import type { ChartInteractionState } from "../../interaction/chart-interaction-state";
import type { ChartSectorSeriesScene, SceneSectorSlice } from "../../scene/polar-scene";
import type { ChartStyleResolver } from "../../style/chart-style-resolver";
import { createPolarGradientSpec } from "./polar-gradient";

export class PolarSectorSeriesRenderer {
    public static render(
        context: CanvasRenderingContext2D,
        series: ChartSectorSeriesScene,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver
    ): void {
        const { center, fillMode, slices, style } = series;
        if (!slices || slices.length === 0) {
            return;
        }

        const arcGenerator = arc<SceneSectorSlice>()
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

            const opacity = series.renderOpacity ?? 1;
            if (fillMode === "gradient") {
                const spec = createPolarGradientSpec(
                    slice.innerRadius,
                    slice.outerRadius,
                    slice.color,
                    style.fillOpacity
                );
                const gradient = context.createRadialGradient(0, 0, spec.innerRadius, 0, 0, spec.outerRadius);
                for (const stop of spec.stops) {
                    gradient.addColorStop(stop.offset, stop.color);
                }

                context.globalAlpha = opacity;
                context.fillStyle = gradient;
                context.fill();
            } else {
                context.fillStyle = slice.color;
                context.globalAlpha = style.fillOpacity * opacity;
                context.fill();
            }

            // Stroke solid slice border independently from fill
            const strokeColor = style.strokeSource === "explicit" ? style.strokeColor : slice.color;
            if (style.strokeWidth > 0 && strokeColor) {
                context.globalAlpha = opacity;
                context.strokeStyle = strokeColor;
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

                if (interactionState.source === "keyboard") {
                    const focusIndicatorColor =
                        styleResolver.resolveCssVariable("--color-focus-indicator") ||
                        styleResolver.resolveCssVariable("--color-primary") ||
                        "#3b82f6";
                    context.strokeStyle = focusIndicatorColor;
                    context.lineWidth = 3;
                    context.globalAlpha = 1;
                    context.stroke();

                    context.fillStyle = "rgba(255, 255, 255, 0.15)";
                    context.fill();
                } else {
                    const hoverOverlayColor =
                        styleResolver.resolveCssVariable("--mona-chart-slice-hover-overlay") || "rgba(255, 255, 255, 0.22)";
                    context.fillStyle = hoverOverlayColor;
                    context.fill();
                }

                context.restore();
            }
        }

        context.restore();
    }
}
