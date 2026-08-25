import { area, line } from "d3-shape";
import type { ChartAreaSeriesScene } from "../../scene/cartesian-scene";
import type { SceneAreaPoint } from "../../scene/scene-geometry";
import { drawPointMarker } from "../../utils/canvas-utils";
import { createAreaGradientSpec, withAlpha } from "./area-gradient";
import { resolveCurveFactory } from "../geometry/chart-curve-factory";

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
        const areaGenerator = area<SceneAreaPoint>()
            .x(p => p.x)
            .y0(p => p.baseY ?? baselineY)
            .y1(p => p.y)
            .curve(resolveCurveFactory(curve))
            .context(context);

        if (!connectNulls) {
            areaGenerator.defined(p => p.defined);
        }

        areaGenerator(validPoints);

        const definedPoints = validPoints.filter(p => p.defined);
        if (definedPoints.length === 0) {
            context.restore();
            return;
        }

        const opacity = scene.renderOpacity ?? 1;
        if (fillMode === "solid") {
            context.globalAlpha = opacity;
            context.fillStyle = withAlpha(style.areaFillColor, fillOpacity);
            context.fill();
        } else {
            const spec = createAreaGradientSpec(baselineY, definedPoints, style.areaFillColor, fillOpacity);
            if (spec) {
                const gradient = context.createLinearGradient(
                    0,
                    spec.startY ?? spec.startPos,
                    0,
                    spec.endY ?? spec.endPos
                );
                for (const stop of spec.stops) {
                    gradient.addColorStop(stop.offset, stop.color);
                }
                context.globalAlpha = opacity;
                context.fillStyle = gradient;
                context.fill();
            } else {
                context.globalAlpha = opacity;
                context.fillStyle = withAlpha(style.areaFillColor, fillOpacity);
                context.fill();
            }
        }

        // 2. Draw Stroke Line
        context.globalAlpha = opacity;
        context.beginPath();
        const lineGenerator = line<SceneAreaPoint>()
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

        // 3. Draw Point Markers
        if (showPoints) {
            for (const p of validPoints) {
                if (p.defined) {
                    const pointAlpha = opacity * (p.renderOpacity ?? 1);
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
