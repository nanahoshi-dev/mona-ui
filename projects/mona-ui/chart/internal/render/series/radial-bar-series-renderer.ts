import { arc } from "d3-shape";
import type { ChartPoint } from "../../../models/chart.models";
import type { ChartInteractionState } from "../../interaction/chart-interaction-state";
import type { ChartRadialBarSeriesScene, SceneRadialArcMark, SceneRadialTrack } from "../../scene/polar-arc-scene";
import type { SceneHitTarget } from "../../scene/scene-geometry";
import type { ChartStyleResolver } from "../../style/chart-style-resolver";
import { createPolarGradientSpec } from "./polar-gradient";

export class RadialBarSeriesRenderer {
    public static render(
        context: CanvasRenderingContext2D,
        series: ChartRadialBarSeriesScene,
        center: ChartPoint,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver
    ): void {
        const { fillMode, marks, style, tracks } = series;

        const trackArcGenerator = arc<SceneRadialTrack>()
            .innerRadius(d => d.innerRadius)
            .outerRadius(d => d.outerRadius)
            .startAngle(d => d.startAngle)
            .endAngle(d => d.endAngle)
            .padAngle(0)
            .context(context);

        const markArcGenerator = arc<SceneRadialArcMark>()
            .innerRadius(d => d.innerRadius)
            .outerRadius(d => d.outerRadius)
            .startAngle(d => d.startAngle)
            .endAngle(d => d.endAngle)
            .padAngle(d => d.padAngle)
            .cornerRadius(d => d.cornerRadius)
            .context(context);

        const highlightArcGenerator = arc<SceneHitTarget>()
            .innerRadius(d => d.arc!.innerRadius)
            .outerRadius(d => d.arc!.outerRadius)
            .startAngle(d => d.arc!.startAngle)
            .endAngle(d => d.arc!.endAngle)
            .cornerRadius(d => d.arc!.cornerRadius ?? 0)
            .padAngle(d => d.arc!.padAngle ?? 0)
            .context(context);

        context.save();
        context.translate(center.x, center.y);

        const seriesOpacity = series.renderOpacity ?? 1;

        // 1. Draw track rings
        if (tracks && tracks.length > 0) {
            for (const track of tracks) {
                context.save();
                context.beginPath();
                trackArcGenerator(track);
                context.fillStyle = track.color;
                context.globalAlpha = track.opacity * seriesOpacity;
                context.fill();
                context.restore();
            }
        }

        // 2. Draw active marks
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

        // 3. Draw active interaction highlight directly from activeHit.arc
        const activeHit = interactionState?.activeHitTarget;
        if (activeHit && activeHit.seriesId === series.id && activeHit.arc) {
            context.save();
            context.beginPath();
            highlightArcGenerator(activeHit);

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

        context.restore();
    }
}
