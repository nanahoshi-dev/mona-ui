import type { ChartCandlestickSeriesScene } from "../../scene/cartesian-scene";
import type { SceneCandlestickMark } from "../../scene/scene-geometry";
import { crispPixel } from "../../utils/canvas-utils";

export class CandlestickSeriesRenderer {
    public static render(context: CanvasRenderingContext2D, scene: ChartCandlestickSeriesScene): void {
        const { marks, style } = scene;

        if (marks.length === 0) {
            return;
        }

        context.save();
        const baseAlpha = (style.opacity ?? 1) * (scene.renderOpacity ?? 1);

        for (const mark of marks) {
            const markAlpha = baseAlpha * (mark.renderOpacity ?? 1);
            if (markAlpha <= 0) {
                continue;
            }

            const markColor = style.color || (
                mark.direction === "rising"
                    ? style.risingColor
                    : mark.direction === "falling"
                        ? style.fallingColor
                        : style.neutralColor
            );

            const wickColor = style.wickColor || markColor;
            const wickWidth = mark.wickWidth;
            const crispCenterX = crispPixel(mark.centerX, wickWidth);

            context.globalAlpha = markAlpha;

            // 1. Draw central vertical wick (high to low)
            context.beginPath();
            context.moveTo(crispCenterX, crispPixel(mark.highY, 1));
            context.lineTo(crispCenterX, crispPixel(mark.lowY, 1));
            context.lineWidth = wickWidth;
            context.strokeStyle = wickColor;
            context.stroke();

            // 2. Draw body box
            const bounds = mark.bodyBounds;
            if (mark.fillMode === "hollow" && mark.direction === "rising") {
                if (typeof context.clearRect === "function") {
                    context.clearRect(bounds.x, bounds.y, bounds.width, bounds.height);
                }
                context.beginPath();
                context.rect(bounds.x, bounds.y, bounds.width, bounds.height);
                context.lineWidth = Math.max(1, wickWidth);
                context.strokeStyle = markColor;
                context.stroke();
            } else {
                context.fillStyle = markColor;
                context.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
            }
        }

        context.restore();
    }
}
