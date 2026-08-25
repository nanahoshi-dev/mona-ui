import { area, line } from "d3-shape";
import type { ChartRangeAreaSeriesScene } from "../../scene/cartesian-scene";
import type { SceneRangeAreaPoint } from "../../scene/scene-geometry";
import { drawPointMarker } from "../../utils/canvas-utils";
import { withAlpha } from "./area-gradient";
import { resolveCurveFactory } from "../geometry/chart-curve-factory";

export class RangeAreaSeriesRenderer {
    public static render(context: CanvasRenderingContext2D, scene: ChartRangeAreaSeriesScene): void {
        const { connectNulls, curve, fillOpacity, pointRadius, points, showPoints, strokeWidth, style } = scene;
        const validPoints = connectNulls ? points.filter(p => p.defined) : points;

        if (validPoints.length === 0) {
            return;
        }

        const definedPoints = validPoints.filter(
            p => p.defined && p.fromPoint !== undefined && p.toPoint !== undefined
        );
        if (definedPoints.length === 0) {
            return;
        }

        context.save();
        const opacity = scene.renderOpacity ?? 1;

        // 1. Draw Range Area Fill Band using semantic fromPoint/toPoint
        context.beginPath();
        const areaGenerator = area<SceneRangeAreaPoint>()
            .x(p => p.x)
            .y0(p => (p.defined && p.fromPoint ? p.fromPoint.y : 0))
            .y1(p => (p.defined && p.toPoint ? p.toPoint.y : 0))
            .curve(resolveCurveFactory(curve))
            .context(context);

        if (!connectNulls) {
            areaGenerator.defined(p => p.defined && p.fromPoint !== undefined && p.toPoint !== undefined);
        }

        areaGenerator(validPoints);

        context.globalAlpha = opacity;
        context.fillStyle = withAlpha(style.areaFillColor, fillOpacity);
        context.fill();

        // 2. Draw From and To Boundary Lines
        if (strokeWidth > 0) {
            context.lineWidth = strokeWidth;
            context.strokeStyle = style.color;

            // From boundary line
            context.beginPath();
            const fromLineGenerator = line<SceneRangeAreaPoint>()
                .x(p => p.x)
                .y(p => (p.defined && p.fromPoint ? p.fromPoint.y : 0))
                .curve(resolveCurveFactory(curve))
                .context(context);

            if (!connectNulls) {
                fromLineGenerator.defined(p => p.defined && p.fromPoint !== undefined);
            }

            fromLineGenerator(validPoints);
            context.stroke();

            // To boundary line
            context.beginPath();
            const toLineGenerator = line<SceneRangeAreaPoint>()
                .x(p => p.x)
                .y(p => (p.defined && p.toPoint ? p.toPoint.y : 0))
                .curve(resolveCurveFactory(curve))
                .context(context);

            if (!connectNulls) {
                toLineGenerator.defined(p => p.defined && p.toPoint !== undefined);
            }

            toLineGenerator(validPoints);
            context.stroke();
        }

        // 3. Draw Point Markers
        if (showPoints) {
            const markerRadius = pointRadius > 0 ? pointRadius : style.pointRadius;
            for (const p of validPoints) {
                if (p.defined && p.fromPoint && p.toPoint) {
                    const pointAlpha = opacity * (p.renderOpacity ?? 1);
                    if (pointAlpha <= 0) {
                        continue;
                    }
                    context.save();
                    context.globalAlpha = pointAlpha;
                    // Draw from marker
                    drawPointMarker(context, p.fromPoint.x, p.fromPoint.y, markerRadius, style.color, "#ffffff", 1.5);
                    // Draw to marker (if distinct from from marker)
                    if (p.fromPoint.y !== p.toPoint.y || p.fromPoint.x !== p.toPoint.x) {
                        drawPointMarker(context, p.toPoint.x, p.toPoint.y, markerRadius, style.color, "#ffffff", 1.5);
                    }
                    context.restore();
                }
            }
        }

        context.restore();
    }
}
