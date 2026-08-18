import type { ChartInteractionState } from "../interaction/chart-interaction-state";
import type { PolarArcChartScene } from "../scene/polar-arc-scene";
import type { ChartAngularAxisScene, ChartRadialAxisScene } from "../scene/polar-axis-scene";
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
        if (scene.radialAxis || scene.angularAxis) {
            const fallbackAngular: ChartAngularAxisScene = scene.angularAxis ?? {
                axisLine: false,
                gridLines: false,
                labelOffset: 0,
                labels: false,
                mode: "category",
                rotation: 0,
                ticks: [],
                visible: false
            };
            const fallbackRadial: ChartRadialAxisScene = scene.radialAxis ?? {
                axisLine: false,
                domain: [0, 1],
                gridLines: false,
                gridShape: "circle",
                labelAngle: 0,
                labelOffset: 0,
                labels: false,
                ticks: [],
                visible: false
            };
            PolarAxisGridRenderer.render(
                context,
                {
                    angularAxis: fallbackAngular,
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
                    radialAxis: fallbackRadial,
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
