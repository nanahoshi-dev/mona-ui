import type { ChartInteractionState } from "../interaction/chart-interaction-state";
import type { CartesianFunnelChartScene } from "../scene/funnel-scene";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { FunnelSeriesRenderer } from "./series/funnel-series-renderer";

export class FunnelChartRenderer {
    public static render(
        context: CanvasRenderingContext2D,
        scene: CartesianFunnelChartScene,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver
    ): void {
        const { plotRect, series } = scene;
        if (plotRect.width <= 0 || plotRect.height <= 0 || series.length === 0) {
            return;
        }

        context.save();

        // 1. Clip series rendering to plot area
        context.beginPath();
        context.rect(plotRect.x, plotRect.y, plotRect.width, plotRect.height);
        context.clip();

        for (const s of series) {
            FunnelSeriesRenderer.render(context, s);
        }

        // 2. Render interaction highlight (hover & keyboard focus)
        if (interactionState) {
            const isKeyboard = interactionState.source === "keyboard";
            const hit = interactionState.activeHitTarget ?? interactionState.activeHits[0];
            if (hit && hit.seriesType === "funnel") {
                const s = series[0];
                const stage = s?.stages.find(
                    st =>
                        st.animationKey === hit.animationKey ||
                        st.stageId === hit.itemId ||
                        st.dataIndex === hit.dataIndex
                );

                if (stage && stage.polygon) {
                    const [p0, p1, p2, p3] = stage.polygon;

                    context.save();
                    context.beginPath();
                    context.moveTo(p0.x, p0.y);
                    context.lineTo(p1.x, p1.y);
                    context.lineTo(p2.x, p2.y);
                    context.lineTo(p3.x, p3.y);
                    context.closePath();

                    if (isKeyboard) {
                        const focusColor =
                            styleResolver.resolveCssVariable("--color-ring") ||
                            styleResolver.resolveCssVariable("--color-focus-indicator") ||
                            styleResolver.resolveCssVariable("--color-primary") ||
                            "#3b82f6";
                        context.strokeStyle = focusColor;
                        context.lineWidth = 2.5;
                    } else {
                        const hoverColor =
                            styleResolver.resolveCssVariable("--mona-chart-funnel-hover-outline-color") ||
                            styleResolver.resolveCssVariable("--color-border-control") ||
                            "rgba(255, 255, 255, 0.85)";
                        context.strokeStyle = hoverColor;
                        context.lineWidth = 1.5;
                    }

                    context.stroke();
                    context.restore();
                }
            }
        }

        context.restore();
    }
}
