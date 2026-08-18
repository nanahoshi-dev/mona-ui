import { arc } from "d3-shape";
import type { ChartPoint } from "../../../models/chart.models";
import type { ChartInteractionState } from "../../interaction/chart-interaction-state";
import type { ChartGaugeSeriesScene, SceneGaugeValue, SceneRadialTrack } from "../../scene/polar-arc-scene";
import type { SceneHitTarget } from "../../scene/scene-geometry";
import type { ChartStyleResolver } from "../../style/chart-style-resolver";
import { createPolarGradientSpec } from "./polar-gradient";

export class GaugeSeriesRenderer {
    public static render(
        context: CanvasRenderingContext2D,
        series: ChartGaugeSeriesScene,
        center: ChartPoint,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver
    ): void {
        const { fillMode, indicator, needle, style, track, value } = series;

        const trackArcGenerator = arc<SceneRadialTrack>()
            .innerRadius(d => d.innerRadius)
            .outerRadius(d => d.outerRadius)
            .startAngle(d => d.startAngle)
            .endAngle(d => d.endAngle)
            .padAngle(0)
            .context(context);

        const valueArcGenerator = arc<SceneGaugeValue>()
            .innerRadius(d => d.innerRadius)
            .outerRadius(d => d.outerRadius)
            .startAngle(d => d.startAngle)
            .endAngle(d => d.endAngle)
            .cornerRadius(d => d.cornerRadius)
            .padAngle(0)
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

        // 1. Draw track arc
        if (track && seriesOpacity > 0) {
            context.save();
            context.beginPath();
            trackArcGenerator(track);
            context.fillStyle = track.color;
            context.globalAlpha = track.opacity * seriesOpacity;
            context.fill();
            context.restore();
        }

        // 2. Draw value arc (if indicator is "arc" or "both")
        if ((indicator === "arc" || indicator === "both") && value) {
            const valOpacity = seriesOpacity * (value.renderOpacity ?? 1);
            if (valOpacity > 0 && value.endAngle > value.startAngle) {
                context.save();
                context.beginPath();
                valueArcGenerator(value);

                if (fillMode === "gradient") {
                    const spec = createPolarGradientSpec(
                        value.innerRadius,
                        value.outerRadius,
                        style.color,
                        style.fillOpacity
                    );
                    const gradient = context.createRadialGradient(0, 0, spec.innerRadius, 0, 0, spec.outerRadius);
                    for (const stop of spec.stops) {
                        gradient.addColorStop(stop.offset, stop.color);
                    }

                    context.globalAlpha = valOpacity;
                    context.fillStyle = gradient;
                    context.fill();
                } else {
                    context.fillStyle = style.color;
                    context.globalAlpha = style.fillOpacity * valOpacity;
                    context.fill();
                }

                context.restore();
            }
        }

        // 3. Draw needle & hub (if indicator is "needle" or "both")
        if ((indicator === "needle" || indicator === "both") && needle && seriesOpacity > 0) {
            context.save();
            context.globalAlpha = seriesOpacity;

            // Rotate so angle 0 points to 12 o'clock (0, -y)
            context.rotate(needle.angle);

            // Tapered needle pointer
            context.beginPath();
            context.moveTo(-needle.width / 2, 0);
            context.lineTo(0, -needle.length);
            context.lineTo(needle.width / 2, 0);
            context.closePath();
            context.fillStyle = needle.color;
            context.fill();

            // Center hub circle
            context.beginPath();
            context.arc(0, 0, needle.hubRadius, 0, Math.PI * 2);
            context.fillStyle = needle.hubColor;
            context.fill();

            context.restore();
        }

        // 4. Draw active interaction overlay on value arc directly from activeHit.arc
        const activeHit = interactionState?.activeHitTarget;
        if (activeHit && activeHit.seriesId === series.id && activeHit.arc && (indicator === "arc" || indicator === "both")) {
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
