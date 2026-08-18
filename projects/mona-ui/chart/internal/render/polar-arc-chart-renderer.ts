import type { ChartInteractionState } from "../interaction/chart-interaction-state";
import type { ChartRoseSeriesScene, PolarArcChartScene } from "../scene/polar-arc-scene";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { RoseGridRenderer } from "./rose-grid-renderer";
import { GaugeSeriesRenderer } from "./series/gauge-series-renderer";
import { RadialBarSeriesRenderer } from "./series/radial-bar-series-renderer";
import { RoseSeriesRenderer } from "./series/rose-series-renderer";

export class PolarArcChartRenderer {
    public static render(
        context: CanvasRenderingContext2D,
        scene: PolarArcChartScene,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver
    ): void {
        const { arcMode, center, innerRadius, outerRadius, series } = scene;

        const isRose = arcMode === "rose";
        let roseStartAngleRad = 0;
        let roseEndAngleRad = Math.PI * 2;

        if (isRose && series.length > 0 && series[0].type === "rose") {
            const roseScene = series[0] as ChartRoseSeriesScene;
            if (roseScene.angularCategories.length > 0) {
                roseStartAngleRad = roseScene.angularCategories[0].startAngle;
                roseEndAngleRad = roseScene.angularCategories[roseScene.angularCategories.length - 1].endAngle;
            }
        }

        // 1. Render background grid if configured
        if (isRose && (scene.radialAxis || scene.angularAxis)) {
            RoseGridRenderer.renderBackground(context, {
                angularAxis: scene.angularAxis,
                center,
                endAngleRad: roseEndAngleRad,
                innerRadius,
                outerRadius,
                radialAxis: scene.radialAxis,
                startAngleRad: roseStartAngleRad,
                styleResolver
            });
        }

        // 2. Render each series
        for (const s of series) {
            switch (s.type) {
                case "radialBar":
                    RadialBarSeriesRenderer.render(context, s, center, interactionState, styleResolver);
                    break;
                case "rose":
                    RoseSeriesRenderer.render(context, s, center, interactionState, styleResolver);
                    break;
                case "gauge":
                    GaugeSeriesRenderer.render(context, s, center, interactionState, styleResolver);
                    break;
            }
        }

        // 3. Render foreground axis lines for Rose if configured
        if (isRose && (scene.radialAxis || scene.angularAxis)) {
            RoseGridRenderer.renderForeground(context, {
                angularAxis: scene.angularAxis,
                center,
                endAngleRad: roseEndAngleRad,
                innerRadius,
                outerRadius,
                radialAxis: scene.radialAxis,
                startAngleRad: roseStartAngleRad,
                styleResolver
            });
        }
    }
}
