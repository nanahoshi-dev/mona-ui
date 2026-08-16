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
import type { ChartAreaSeriesScene } from "../../scene/cartesian-scene";
import type { ScenePoint } from "../../scene/scene-geometry";
import { drawPointMarker } from "../../utils/canvas-utils";

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

export class AreaSeriesRenderer {
    public static render(context: CanvasRenderingContext2D, scene: ChartAreaSeriesScene): void {
        const { baselineY, connectNulls, curve, fillMode, fillOpacity, points, showPoints, style } = scene;
        const validPoints = connectNulls ? points.filter(p => p.defined) : points;

        if (validPoints.length === 0) {
            return;
        }

        context.save();

        // 1. Draw Area Fill
        context.beginPath();
        const areaGenerator = area<ScenePoint>()
            .x(p => p.x)
            .y0(baselineY)
            .y1(p => p.y)
            .curve(getCurveFactory(curve))
            .context(context);

        if (!connectNulls) {
            areaGenerator.defined(p => p.defined);
        }

        areaGenerator(validPoints);

        const definedPoints = validPoints.filter(p => p.defined);
        let minY = baselineY;
        let maxY = baselineY;
        for (const p of definedPoints) {
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
        }

        if (fillMode === "gradient" && Math.abs(maxY - minY) > 1) {
            const gradient = context.createLinearGradient(0, minY, 0, Math.max(maxY, baselineY));
            context.globalAlpha = fillOpacity;
            gradient.addColorStop(0, style.areaFillColor);
            gradient.addColorStop(1, "transparent");
            context.fillStyle = gradient;
        } else {
            context.globalAlpha = fillOpacity;
            context.fillStyle = style.areaFillColor;
        }

        context.fill();

        // 2. Draw Stroke Line
        context.globalAlpha = 1;
        context.beginPath();
        const lineGenerator = line<ScenePoint>()
            .x(p => p.x)
            .y(p => p.y)
            .curve(getCurveFactory(curve))
            .context(context);

        if (!connectNulls) {
            lineGenerator.defined(p => p.defined);
        }

        lineGenerator(validPoints);

        context.lineWidth = style.lineWidth;
        context.strokeStyle = style.color;
        context.stroke();

        // 3. Draw Point Markers
        if (showPoints) {
            for (const p of validPoints) {
                if (p.defined) {
                    drawPointMarker(context, p.x, p.y, style.pointRadius, style.color, "#ffffff", 1.5);
                }
            }
        }

        context.restore();
    }
}
