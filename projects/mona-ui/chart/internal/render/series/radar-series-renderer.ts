import { curveCatmullRomClosed, curveLinearClosed, lineRadial } from "d3-shape";
import type { ChartRadarSeriesScene, SceneRadialPoint } from "../../scene/polar-axis-scene";
import type { ChartStyleResolver } from "../../style/chart-style-resolver";
import { withAlpha } from "./area-gradient";
import { createRadialSeriesGradientSpec } from "./radial-series-gradient";

export class RadarSeriesRenderer {
    public static render(
        context: CanvasRenderingContext2D,
        series: ChartRadarSeriesScene,
        center: { x: number; y: number },
        styleResolver: ChartStyleResolver
    ): void {
        const { color, connectNulls, curve, fillMode, fillOpacity, maxRenderedRadius, pointRadius, points, showPoints, strokeWidth } =
            series;

        const definedPoints = points.filter(p => p.defined);
        if (definedPoints.length < 2) {
            return;
        }

        // Radar fill requires at least 3 usable vertices
        const canFill = (connectNulls ? definedPoints.length >= 3 : points.every(p => p.defined) && points.length >= 3);
        const renderPoints = connectNulls ? definedPoints : points;

        const d3Curve = curve === "smooth" ? curveCatmullRomClosed : curveLinearClosed;
        const lineGenerator = lineRadial<SceneRadialPoint>()
            .angle(d => d.angle)
            .radius(d => d.radius)
            .curve(d3Curve)
            .defined(d => d.defined)
            .context(context);

        context.save();
        context.translate(center.x, center.y);

        // 1. Draw Interior Fill (Solid or Gradient)
        if (fillMode !== "none" && canFill) {
            context.save();
            context.beginPath();
            lineGenerator(renderPoints as SceneRadialPoint[]);
            context.closePath();

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

        // 2. Draw Solid Boundary Outline
        if (strokeWidth > 0) {
            context.save();
            context.beginPath();
            lineGenerator(renderPoints as SceneRadialPoint[]);
            context.closePath();
            context.strokeStyle = color;
            context.lineWidth = strokeWidth;
            context.stroke();
            context.restore();
        }

        // 3. Draw Vertex Point Markers
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
