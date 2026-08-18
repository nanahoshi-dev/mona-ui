import type { ChartInteractionState } from "../interaction/chart-interaction-state";
import type { PolarArcChartScene } from "../scene/polar-arc-scene";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { PolarAxisGridRenderer } from "./polar-axis-grid-renderer";
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
        const { center, series } = scene;

        // 1. Render background radial/angular grids if configured (e.g. for Rose)
        if (scene.radialAxis && scene.angularAxis) {
            PolarAxisGridRenderer.render(
                context,
                {
                    angularAxis: scene.angularAxis,
                    axisMode: "radar",
                    center: scene.center,
                    coordinateSystem: "polar",
                    hasRenderableData: scene.hasRenderableData,
                    height: scene.height,
                    hitTargets: [],
                    interactionBuckets: [],
                    legendItems: [],
                    outerRadius: scene.outerRadius,
                    plotRect: scene.plotRect,
                    polarKind: "axis",
                    radialAxis: scene.radialAxis,
                    series: [],
                    width: scene.width
                },
                styleResolver
            );
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
    }
}
