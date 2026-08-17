import type { PolarAxisChartScene } from "../scene/chart-scene";
import type { ChartStyleResolver } from "../style/chart-style-resolver";

export class PolarAxisGridRenderer {
    public static render(
        context: CanvasRenderingContext2D,
        scene: PolarAxisChartScene,
        styleResolver: ChartStyleResolver
    ): void {
        const { angularAxis, center, outerRadius, radialAxis } = scene;
        if (outerRadius <= 0) {
            return;
        }

        const gridColor =
            styleResolver.resolveCssVariable("--mona-chart-grid-color") ||
            styleResolver.resolveCssVariable("--color-border-control") ||
            "rgba(150, 150, 150, 0.2)";

        const axisLineColor =
            styleResolver.resolveCssVariable("--mona-chart-axis-line-color") ||
            styleResolver.resolveCssVariable("--color-border-control") ||
            "rgba(150, 150, 150, 0.5)";

        const zeroLineColor =
            styleResolver.resolveCssVariable("--mona-chart-zero-line-color") ||
            styleResolver.resolveCssVariable("--color-muted-foreground") ||
            "rgba(100, 100, 100, 0.6)";

        context.save();

        // 1. Radial Grid Rings / Polygons
        if (radialAxis.visible && radialAxis.gridLines) {
            for (const tick of radialAxis.ticks) {
                if (tick.radius <= 0) continue;

                context.save();
                context.beginPath();

                if (radialAxis.gridShape === "polygon" && angularAxis.ticks.length >= 3) {
                    for (let i = 0; i < angularAxis.ticks.length; i++) {
                        const spoke = angularAxis.ticks[i];
                        const x = center.x + Math.sin(spoke.angle) * tick.radius;
                        const y = center.y - Math.cos(spoke.angle) * tick.radius;
                        if (i === 0) {
                            context.moveTo(x, y);
                        } else {
                            context.lineTo(x, y);
                        }
                    }
                    context.closePath();
                } else {
                    context.arc(center.x, center.y, tick.radius, 0, Math.PI * 2);
                }

                if (tick.isZero) {
                    context.strokeStyle = zeroLineColor;
                    context.lineWidth = 1.5;
                } else {
                    context.strokeStyle = gridColor;
                    context.lineWidth = 1;
                }
                context.stroke();
                context.restore();
            }
        }

        // 2. Angular Spokes
        if (angularAxis.visible && angularAxis.gridLines) {
            context.save();
            context.strokeStyle = gridColor;
            context.lineWidth = 1;

            for (const tick of angularAxis.ticks) {
                const endX = center.x + Math.sin(tick.angle) * outerRadius;
                const endY = center.y - Math.cos(tick.angle) * outerRadius;

                context.beginPath();
                context.moveTo(center.x, center.y);
                context.lineTo(endX, endY);
                context.stroke();
            }
            context.restore();
        }

        // 3. Outer Axis Boundary
        if (angularAxis.visible && angularAxis.axisLine) {
            context.save();
            context.beginPath();

            if (radialAxis.gridShape === "polygon" && angularAxis.ticks.length >= 3) {
                for (let i = 0; i < angularAxis.ticks.length; i++) {
                    const spoke = angularAxis.ticks[i];
                    const x = center.x + Math.sin(spoke.angle) * outerRadius;
                    const y = center.y - Math.cos(spoke.angle) * outerRadius;
                    if (i === 0) {
                        context.moveTo(x, y);
                    } else {
                        context.lineTo(x, y);
                    }
                }
                context.closePath();
            } else {
                context.arc(center.x, center.y, outerRadius, 0, Math.PI * 2);
            }

            context.strokeStyle = axisLineColor;
            context.lineWidth = 1;
            context.stroke();
            context.restore();
        }

        context.restore();
    }
}
