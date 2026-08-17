import {
    area,
    curveLinear,
    curveMonotoneX,
    curveNatural,
    curveStep,
    curveStepAfter,
    line,
    type CurveFactory
} from "d3-shape";
import type { ChartCurve } from "../../../models/chart-series.models";
import type { ChartRangeAreaSeriesScene } from "../../scene/cartesian-scene";
import type { SceneRangeAreaPoint } from "../../scene/scene-geometry";
import { drawPointMarker } from "../../utils/canvas-utils";
import { withAlpha } from "./area-gradient";

function getCurveFactory(curve: ChartCurve): CurveFactory {
    switch (curve) {
        case "monotone-x":
            return curveMonotoneX;
        case "natural":
            return curveNatural;
        case "step":
            return curveStep;
        case "step-after":
            return curveStepAfter;
        case "linear":
        default:
            return curveLinear;
    }
}

export class RangeAreaSeriesRenderer {
    public static render(context: CanvasRenderingContext2D, scene: ChartRangeAreaSeriesScene): void {
        const { connectNulls, curve, fillOpacity, pointRadius, points, showPoints, strokeWidth, style } = scene;
        const validPoints = connectNulls ? points.filter(p => p.defined) : points;

        if (validPoints.length === 0) {
            return;
        }

        const definedPoints = validPoints.filter(
            p => p.defined && p.lowPoint !== undefined && p.highPoint !== undefined
        );
        if (definedPoints.length === 0) {
            return;
        }

        context.save();
        const opacity = scene.renderOpacity ?? 1;

        // 1. Draw Range Area Fill Band
        context.beginPath();
        const areaGenerator = area<SceneRangeAreaPoint>()
            .x(p => p.x)
            .y0(p => p.lowPoint?.y ?? p.highPoint?.y ?? 0)
            .y1(p => p.highPoint?.y ?? p.lowPoint?.y ?? 0)
            .curve(getCurveFactory(curve))
            .context(context);

        if (!connectNulls) {
            areaGenerator.defined(p => p.defined && p.lowPoint !== undefined && p.highPoint !== undefined);
        }

        areaGenerator(validPoints);

        context.globalAlpha = opacity;
        context.fillStyle = withAlpha(style.areaFillColor, fillOpacity);
        context.fill();

        // 2. Draw Top and Bottom Boundary Lines
        if (strokeWidth > 0) {
            context.lineWidth = strokeWidth;
            context.strokeStyle = style.color;

            // Top boundary line
            context.beginPath();
            const topLineGenerator = line<SceneRangeAreaPoint>()
                .x(p => p.x)
                .y(p => p.highPoint?.y ?? 0)
                .curve(getCurveFactory(curve))
                .context(context);

            if (!connectNulls) {
                topLineGenerator.defined(p => p.defined && p.highPoint !== undefined);
            }

            topLineGenerator(validPoints);
            context.stroke();

            // Bottom boundary line
            context.beginPath();
            const bottomLineGenerator = line<SceneRangeAreaPoint>()
                .x(p => p.x)
                .y(p => p.lowPoint?.y ?? 0)
                .curve(getCurveFactory(curve))
                .context(context);

            if (!connectNulls) {
                bottomLineGenerator.defined(p => p.defined && p.lowPoint !== undefined);
            }

            bottomLineGenerator(validPoints);
            context.stroke();
        }

        // 3. Draw Point Markers
        if (showPoints) {
            const markerRadius = pointRadius > 0 ? pointRadius : style.pointRadius;
            for (const p of validPoints) {
                if (p.defined && p.highPoint && p.lowPoint) {
                    const pointAlpha = opacity * (p.renderOpacity ?? 1);
                    if (pointAlpha <= 0) {
                        continue;
                    }
                    context.save();
                    context.globalAlpha = pointAlpha;
                    // Draw high marker
                    drawPointMarker(context, p.highPoint.x, p.highPoint.y, markerRadius, style.color, "#ffffff", 1.5);
                    // Draw low marker (if different from high marker)
                    if (p.lowPoint.y !== p.highPoint.y) {
                        drawPointMarker(context, p.lowPoint.x, p.lowPoint.y, markerRadius, style.color, "#ffffff", 1.5);
                    }
                    context.restore();
                }
            }
        }

        context.restore();
    }
}
