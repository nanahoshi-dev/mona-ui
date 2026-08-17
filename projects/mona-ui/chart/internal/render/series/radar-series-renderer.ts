import { curveCatmullRom, curveCatmullRomClosed, curveLinear, curveLinearClosed, lineRadial } from "d3-shape";
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
        if (definedPoints.length === 0) {
            return;
        }

        const allDefined = points.length > 0 && points.every(p => p.defined);
        const hasGaps = !allDefined;
        const isClosed = connectNulls || !hasGaps;

        // Radar fill requires at least 3 usable vertices and closed polygon
        const canFill = isClosed && (connectNulls ? definedPoints.length >= 3 : allDefined && points.length >= 3);
        const renderPoints = connectNulls ? definedPoints : points;

        context.save();
        context.translate(center.x, center.y);

        // 1. Draw Interior Fill (Solid or Gradient)
        if (fillMode !== "none" && canFill) {
            const isSmooth = curve === "smooth" && (connectNulls ? definedPoints.length >= 3 : points.length >= 3);
            const fillCurve = isSmooth ? curveCatmullRomClosed : curveLinearClosed;
            const fillGenerator = lineRadial<SceneRadialPoint>()
                .angle(d => d.angle)
                .radius(d => d.radius)
                .curve(fillCurve)
                .defined(d => d.defined)
                .context(context);

            context.save();
            context.beginPath();
            fillGenerator(renderPoints as SceneRadialPoint[]);
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

        // 2. Draw Boundary Outline
        if (strokeWidth > 0 && definedPoints.length >= 2) {
            const isSmooth = curve === "smooth" && (connectNulls ? definedPoints.length >= 3 : points.length >= 3);
            const lineCurve = isClosed
                ? (isSmooth ? curveCatmullRomClosed : curveLinearClosed)
                : (isSmooth ? curveCatmullRom : curveLinear);

            const lineGenerator = lineRadial<SceneRadialPoint>()
                .angle(d => d.angle)
                .radius(d => d.radius)
                .curve(lineCurve)
                .defined(d => d.defined)
                .context(context);

            context.save();
            context.beginPath();
            lineGenerator(renderPoints as SceneRadialPoint[]);
            if (isClosed) {
                context.closePath();
            }
            context.strokeStyle = color;
            context.lineWidth = strokeWidth;
            context.stroke();
            context.restore();
        }

        // 3. Draw Vertex Point Markers (at least 1 defined point)
        if (showPoints && pointRadius > 0 && definedPoints.length >= 1) {
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
