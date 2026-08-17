import { areaRadial, curveCatmullRom, curveLinear, lineRadial } from "d3-shape";
import type { ChartContinuousPolarSeriesScene, SceneRadialPoint } from "../../scene/polar-axis-scene";
import type { ChartStyleResolver } from "../../style/chart-style-resolver";
import { withAlpha } from "./area-gradient";
import { createRadialSeriesGradientSpec } from "./radial-series-gradient";

export class PolarSeriesRenderer {
    public static render(
        context: CanvasRenderingContext2D,
        series: ChartContinuousPolarSeriesScene,
        center: { x: number; y: number },
        styleResolver: ChartStyleResolver
    ): void {
        const { color, connectNulls, curve, fillMode, fillOpacity, maxRenderedRadius, pointRadius, points, showPoints, strokeWidth } =
            series;

        const definedPoints = points.filter(p => p.defined);
        if (definedPoints.length === 0) {
            return;
        }

        const d3Curve = curve === "smooth" ? curveCatmullRom : curveLinear;
        const renderPoints = connectNulls ? definedPoints : points;

        context.save();
        context.translate(center.x, center.y);

        // 1. Draw Polar Area Fill (Solid or Gradient) from innerRadius 0 to outer data line
        if (fillMode !== "none" && definedPoints.length >= 2) {
            const areaGenerator = areaRadial<SceneRadialPoint>()
                .angle(d => d.angle)
                .innerRadius(0)
                .outerRadius(d => d.radius)
                .curve(d3Curve)
                .defined(d => d.defined)
                .context(context);

            context.save();
            context.beginPath();
            areaGenerator(renderPoints as SceneRadialPoint[]);

            if (fillMode === "gradient") {
                const spec = createRadialSeriesGradientSpec(maxRenderedRadius, color, fillOpacity);
                const gradient = context.createRadialGradient(0, 0, 0, 0, 0, spec.outerRadius);
                for (const stop of spec.stops) {
                    gradient.addColorStop(stop.offset, stop.color);
                }
                context.fillStyle = gradient;
            } else {
                context.fillStyle = withAlpha(color, fillOpacity);
            }

            context.fill();
            context.restore();
        }

        // 2. Draw Solid Data Line Stroke (without stroking pole closure edges)
        if (strokeWidth > 0 && definedPoints.length >= 2) {
            const lineGenerator = lineRadial<SceneRadialPoint>()
                .angle(d => d.angle)
                .radius(d => d.radius)
                .curve(d3Curve)
                .defined(d => d.defined)
                .context(context);

            context.save();
            context.beginPath();
            lineGenerator(renderPoints as SceneRadialPoint[]);
            context.strokeStyle = color;
            context.lineWidth = strokeWidth;
            context.stroke();
            context.restore();
        }

        // 3. Draw Point Markers
        if (showPoints && pointRadius > 0) {
            const surfaceColor =
                styleResolver.resolveCssVariable("--color-surface") ||
                styleResolver.resolveCssVariable("--color-card") ||
                "#ffffff";

            context.save();
            for (const pt of definedPoints) {
                const px = Math.sin(pt.angle) * pt.radius;
                const py = -Math.cos(pt.angle) * pt.radius;

                context.beginPath();
                context.arc(px, py, pointRadius, 0, Math.PI * 2);
                context.fillStyle = color;
                context.fill();
                context.strokeStyle = surfaceColor;
                context.lineWidth = 1.5;
                context.stroke();
            }
            context.restore();
        }

        context.restore();
    }
}
