import type { ChartInteractionState } from "../interaction/chart-interaction-state";
import type { PolarAxisChartScene } from "../scene/chart-scene";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { withAlpha } from "./series/area-gradient";

export class RadialInteractionRenderer {
    public static render(
        context: CanvasRenderingContext2D,
        scene: PolarAxisChartScene,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver
    ): void {
        if (!interactionState || (!interactionState.activeHitTarget && interactionState.activeHits.length === 0)) {
            return;
        }

        const { center, outerRadius } = scene;
        const activeHit = interactionState.activeHitTarget ?? interactionState.activeHits[0];
        if (!activeHit) {
            return;
        }

        const focusColor =
            styleResolver.resolveCssVariable("--color-focus-indicator") ||
            styleResolver.resolveCssVariable("--color-primary") ||
            "#3b82f6";

        const crosshairColor =
            styleResolver.resolveCssVariable("--mona-chart-crosshair-color") ||
            "rgba(59, 130, 246, 0.4)";

        const isKeyboard = interactionState.source === "keyboard";

        context.save();

        // 1. Highlight active angular spoke
        if (activeHit.angle !== undefined && outerRadius > 0) {
            const angle = activeHit.angle;
            const endX = center.x + Math.sin(angle) * outerRadius;
            const endY = center.y - Math.cos(angle) * outerRadius;

            context.save();
            context.beginPath();
            context.setLineDash([4, 4]);
            context.moveTo(center.x, center.y);
            context.lineTo(endX, endY);
            context.strokeStyle = isKeyboard ? focusColor : crosshairColor;
            context.lineWidth = isKeyboard ? 1.5 : 1;
            context.stroke();
            context.restore();
        }

        // 2. Highlight active series points
        const hitsToHighlight = interactionState.activeHits.length > 0
            ? interactionState.activeHits
            : [activeHit];

        const surfaceColor =
            styleResolver.resolveCssVariable("--color-surface") ||
            styleResolver.resolveCssVariable("--color-card") ||
            styleResolver.resolveCssVariable("--color-background") ||
            "#ffffff";

        for (const hit of hitsToHighlight) {
            if (!hit.point) continue;

            const markerColor = hit.color ?? focusColor;
            const radius = (hit.radius ?? 4) + 2;

            context.save();
            context.beginPath();
            context.arc(hit.point.x, hit.point.y, radius, 0, Math.PI * 2);

            if (isKeyboard && hit === activeHit) {
                context.strokeStyle = focusColor;
                context.lineWidth = 3;
                context.fillStyle = withAlpha(surfaceColor, 0.85);
                context.fill();
                context.stroke();
            } else {
                context.strokeStyle = markerColor;
                context.lineWidth = 2;
                context.fillStyle = withAlpha(surfaceColor, 0.65);
                context.fill();
                context.stroke();
            }

            context.restore();
        }

        context.restore();
    }
}
