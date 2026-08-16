import {
    curveLinear,
    curveMonotoneX,
    curveNatural,
    curveStep,
    curveStepAfter,
    line,
    type CurveFactory
} from "d3-shape";
import type { ChartCurve } from "../../../models/chart-series.models";
import type { ChartLineSeriesScene } from "../../scene/cartesian-scene";
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

export class LineSeriesRenderer {
    public static render(context: CanvasRenderingContext2D, scene: ChartLineSeriesScene): void {
        const { connectNulls, curve, points, showPoints, style } = scene;
        const validPoints = connectNulls ? points.filter(p => p.defined) : points;

        if (validPoints.length === 0) {
            return;
        }

        context.save();
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
