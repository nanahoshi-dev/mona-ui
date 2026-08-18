import { arc } from "d3-shape";
import type { ChartPoint } from "../../../models/chart.models";
import type { ChartInteractionState } from "../../interaction/chart-interaction-state";
import type { ChartRoseSeriesScene, SceneRadialArcMark } from "../../scene/polar-arc-scene";
import type { ChartStyleResolver } from "../../style/chart-style-resolver";
import { createPolarGradientSpec } from "./polar-gradient";

export class RoseSeriesRenderer {
    public static render(
        context: CanvasRenderingContext2D,
        series: ChartRoseSeriesScene,
        center: ChartPoint,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver
    ): void {
        const { fillMode, marks, style } = series;

        const markArcGenerator = arc<SceneRadialArcMark>()
            .innerRadius(d => d.innerRadius)
            .outerRadius(d => d.outerRadius)
            .startAngle(d => d.startAngle)
            .endAngle(d => d.endAngle)
            .padAngle(d => d.padAngle)
            .cornerRadius(d => d.cornerRadius)
            .context(context);

        context.save();
        context.translate(center.x, center.y);

        const seriesOpacity = series.renderOpacity ?? 1;

        // 1. Draw petal marks
        for (const mark of marks) {
            if (!mark.visible) {
                continue;
            }

            const opacity = seriesOpacity * (mark.renderOpacity ?? 1);
            if (opacity <= 0) {
                continue;
            }

            context.save();
            context.beginPath();
            markArcGenerator(mark);

            if (fillMode === "gradient") {
                const spec = createPolarGradientSpec(
                    mark.innerRadius,
                    mark.outerRadius,
                    mark.color,
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
                context.fillStyle = mark.color;
                context.globalAlpha = style.fillOpacity * opacity;
                context.fill();
            }

            const strokeColor = style.strokeSource === "explicit" ? style.strokeColor : mark.color;
            if (style.strokeWidth > 0 && strokeColor) {
                context.globalAlpha = opacity;
                context.strokeStyle = strokeColor;
                context.lineWidth = style.strokeWidth;
                context.stroke();
            }

            context.restore();
        }

        // 2. Draw active interaction highlight
        const activeHit = interactionState?.activeHitTarget;
        if (activeHit && activeHit.seriesId === series.id) {
            const activeMark = marks.find(m => m.itemId === activeHit.itemId || m.dataIndex === activeHit.dataIndex);
            if (activeMark && activeMark.visible) {
                context.save();
                context.beginPath();
                markArcGenerator(activeMark);

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
