import type { ChartInteractionState } from "../interaction/chart-interaction-state";
import type { ChartScene } from "../scene/chart-scene";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { CartesianChartRenderer } from "./cartesian-chart-renderer";
import { FunnelChartRenderer } from "./funnel-chart-renderer";
import { HeatmapChartRenderer } from "./heatmap-chart-renderer";
import { PolarChartRenderer } from "./polar-chart-renderer";
import { TreemapChartRenderer } from "./treemap-chart-renderer";
import { WaterfallChartRenderer } from "./waterfall-chart-renderer";

export class CanvasChartRenderer {
    public static clear(context: CanvasRenderingContext2D, width: number, height: number): void {
        context.clearRect(0, 0, width, height);
    }

    public static render(
        context: CanvasRenderingContext2D,
        scene: ChartScene,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver
    ): void {
        this.clear(context, scene.width, scene.height);
        this.renderContent(context, scene, interactionState, styleResolver);
    }

    public static renderContent(
        context: CanvasRenderingContext2D,
        scene: ChartScene,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver
    ): void {
        switch (scene.coordinateSystem) {
            case "cartesian":
                if (scene.cartesianKind === "xy") {
                    CartesianChartRenderer.render(context, scene, interactionState, styleResolver);
                    return;
                }
                if (scene.cartesianKind === "heatmap") {
                    HeatmapChartRenderer.render(context, scene, interactionState, styleResolver);
                    return;
                }
                if (scene.cartesianKind === "funnel") {
                    FunnelChartRenderer.render(context, scene, interactionState, styleResolver);
                    return;
                }
                if (scene.cartesianKind === "waterfall") {
                    WaterfallChartRenderer.render(context, scene, interactionState, styleResolver);
                    return;
                }
                return;
            case "hierarchical":
                if (scene.hierarchicalKind === "treemap") {
                    TreemapChartRenderer.render(context, scene, interactionState, styleResolver);
                    return;
                }
                return;
            case "polar":
                PolarChartRenderer.render(context, scene, interactionState, styleResolver);
                return;
        }
    }

    public static renderCrossfade(
        context: CanvasRenderingContext2D,
        fromScene: ChartScene | null,
        toScene: ChartScene,
        progress: number,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver
    ): void {
        this.clear(context, toScene.width, toScene.height);

        if (fromScene && progress < 1) {
            context.save();
            context.globalAlpha = Math.max(0, Math.min(1, 1 - progress));
            this.renderContent(context, fromScene, null, styleResolver);
            context.restore();
        }

        if (progress > 0) {
            context.save();
            context.globalAlpha = Math.max(0, Math.min(1, progress));
            this.renderContent(context, toScene, interactionState, styleResolver);
            context.restore();
        }
    }
}
