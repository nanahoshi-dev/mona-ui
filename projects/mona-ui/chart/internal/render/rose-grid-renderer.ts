import type { ChartPoint } from "../../models/chart.models";
import type { ChartAngularAxisScene, ChartRadialAxisScene } from "../scene/polar-axis-scene";
import type { ChartStyleResolver } from "../style/chart-style-resolver";

export interface RoseGridRendererOptions {
    readonly angularAxis?: ChartAngularAxisScene;
    readonly center: ChartPoint;
    readonly endAngleRad: number;
    readonly innerRadius: number;
    readonly outerRadius: number;
    readonly radialAxis?: ChartRadialAxisScene;
    readonly startAngleRad: number;
    readonly styleResolver: ChartStyleResolver;
}

export class RoseGridRenderer {
    public static renderBackground(context: CanvasRenderingContext2D, options: RoseGridRendererOptions): void {
        const { angularAxis, center, endAngleRad, innerRadius, outerRadius, radialAxis, startAngleRad, styleResolver } =
            options;
        if (outerRadius <= 0) {
            return;
        }

        const gridColor =
            styleResolver.resolveCssVariable("--mona-chart-grid-color") ||
            styleResolver.resolveCssVariable("--color-border-control") ||
            "rgba(150, 150, 150, 0.2)";

        const zeroLineColor =
            styleResolver.resolveCssVariable("--mona-chart-zero-line-color") ||
            styleResolver.resolveCssVariable("--color-muted-foreground") ||
            "rgba(100, 100, 100, 0.6)";

        const sweepSpan = Math.abs(endAngleRad - startAngleRad);
        const isFullSweep = sweepSpan >= Math.PI * 2 - 1e-4;
        const canvasStart = startAngleRad - Math.PI / 2;
        const canvasEnd = endAngleRad - Math.PI / 2;

        context.save();

        // 1. Radial Grid Rings
        if (radialAxis?.visible && radialAxis.gridLines) {
            for (const tick of radialAxis.ticks) {
                if (tick.radius <= 0) continue;

                context.save();
                context.beginPath();

                if (isFullSweep) {
                    context.arc(center.x, center.y, tick.radius, 0, Math.PI * 2);
                } else {
                    context.arc(center.x, center.y, tick.radius, canvasStart, canvasEnd);
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
        if (angularAxis?.visible && angularAxis.gridLines) {
            context.save();
            context.strokeStyle = gridColor;
            context.lineWidth = 1;

            const startR = Math.max(0, innerRadius);

            for (const tick of angularAxis.ticks) {
                const startX = center.x + Math.sin(tick.angle) * startR;
                const startY = center.y - Math.cos(tick.angle) * startR;
                const endX = center.x + Math.sin(tick.angle) * outerRadius;
                const endY = center.y - Math.cos(tick.angle) * outerRadius;

                context.beginPath();
                context.moveTo(startX, startY);
                context.lineTo(endX, endY);
                context.stroke();
            }
            context.restore();
        }

        context.restore();
    }

    public static renderForeground(context: CanvasRenderingContext2D, options: RoseGridRendererOptions): void {
        const { angularAxis, center, endAngleRad, innerRadius, outerRadius, radialAxis, startAngleRad, styleResolver } =
            options;
        if (outerRadius <= 0) {
            return;
        }

        const axisLineColor =
            styleResolver.resolveCssVariable("--mona-chart-axis-line-color") ||
            styleResolver.resolveCssVariable("--color-border-control") ||
            "rgba(150, 150, 150, 0.5)";

        const sweepSpan = Math.abs(endAngleRad - startAngleRad);
        const isFullSweep = sweepSpan >= Math.PI * 2 - 1e-4;
        const canvasStart = startAngleRad - Math.PI / 2;
        const canvasEnd = endAngleRad - Math.PI / 2;

        context.save();

        // 1. Radial Axis Line (spoke along labelAngle or start/end edges)
        if (radialAxis?.visible && radialAxis.axisLine) {
            const startR = Math.max(0, innerRadius);
            const labelAngleRad = (radialAxis.labelAngle * Math.PI) / 180;
            const startX = center.x + Math.sin(labelAngleRad) * startR;
            const startY = center.y - Math.cos(labelAngleRad) * startR;
            const endX = center.x + Math.sin(labelAngleRad) * outerRadius;
            const endY = center.y - Math.cos(labelAngleRad) * outerRadius;

            context.save();
            context.beginPath();
            context.moveTo(startX, startY);
            context.lineTo(endX, endY);
            context.strokeStyle = axisLineColor;
            context.lineWidth = 1;
            context.stroke();
            context.restore();
        }

        // 2. Outer Angular Axis Boundary
        if (angularAxis?.visible && angularAxis.axisLine) {
            context.save();
            context.beginPath();

            if (isFullSweep) {
                context.arc(center.x, center.y, outerRadius, 0, Math.PI * 2);
            } else {
                context.arc(center.x, center.y, outerRadius, canvasStart, canvasEnd);
            }

            context.strokeStyle = axisLineColor;
            context.lineWidth = 1;
            context.stroke();
            context.restore();
        }

        context.restore();
    }
}
