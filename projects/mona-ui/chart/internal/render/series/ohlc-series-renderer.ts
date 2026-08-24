import type { ChartOhlcSeriesScene } from "../../scene/cartesian-scene";
import type {} from "../../scene/scene-geometry";
import { crispPixel } from "../../utils/canvas-utils";

export class OhlcSeriesRenderer {
    public static render(context: CanvasRenderingContext2D, scene: ChartOhlcSeriesScene): void {
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

            const markColor =
                style.color ||
                (mark.direction === "rising"
                    ? style.risingColor
                    : mark.direction === "falling"
                      ? style.fallingColor
                      : style.neutralColor);

            const wickColor = style.wickColor || markColor;
            const wickWidth = mark.wickWidth;
            const crispCenterX = crispPixel(mark.centerX, wickWidth);

            context.globalAlpha = markAlpha;

            // 1. Draw central vertical spine (high to low)
            context.beginPath();
            context.moveTo(crispCenterX, crispPixel(mark.highY, 1));
            context.lineTo(crispCenterX, crispPixel(mark.lowY, 1));
            context.lineWidth = wickWidth;
            context.strokeStyle = wickColor;
            context.stroke();

            // 2. Draw left open tick: (centerX - tickWidth) to centerX at openY
            context.beginPath();
            const crispOpenY = crispPixel(mark.openY, wickWidth);
            context.moveTo(crispCenterX - mark.tickWidth, crispOpenY);
            context.lineTo(crispCenterX, crispOpenY);
            context.lineWidth = wickWidth;
            context.strokeStyle = markColor;
            context.stroke();

            // 3. Draw right close tick: centerX to (centerX + tickWidth) at closeY
            context.beginPath();
            const crispCloseY = crispPixel(mark.closeY, wickWidth);
            context.moveTo(crispCenterX, crispCloseY);
            context.lineTo(crispCenterX + mark.tickWidth, crispCloseY);
            context.lineWidth = wickWidth;
            context.strokeStyle = markColor;
            context.stroke();
        }

        context.restore();
    }
}
