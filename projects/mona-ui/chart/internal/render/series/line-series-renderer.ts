import { line } from "d3-shape";
import type { ChartLineSeriesScene } from "../../scene/cartesian-scene";
import type { ScenePoint } from "../../scene/scene-geometry";
import { drawPointMarker } from "../../utils/canvas-utils";
import { resolveCurveFactory } from "../geometry/chart-curve-factory";

export class LineSeriesRenderer {
    public static render(context: CanvasRenderingContext2D, scene: ChartLineSeriesScene): void {
        const { connectNulls, curve, points, showPoints, style } = scene;
        const validPoints = connectNulls ? points.filter(p => p.defined) : points;

        if (validPoints.length === 0) {
            return;
        }

        context.save();
        context.globalAlpha *= scene.renderOpacity ?? 1;
        context.beginPath();

        const lineGenerator = line<ScenePoint>()
            .x(p => p.x)
            .y(p => p.y)
            .curve(resolveCurveFactory(curve))
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
                    const pointAlpha = (scene.renderOpacity ?? 1) * (p.renderOpacity ?? 1);
                    if (pointAlpha <= 0) {
                        continue;
                    }
                    context.save();
                    context.globalAlpha = pointAlpha;
                    drawPointMarker(context, p.x, p.y, style.pointRadius, style.color, "#ffffff", 1.5);
                    context.restore();
                }
            }
        }

        context.restore();
    }
}
