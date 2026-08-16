import type { ChartInteractionState } from "../interaction/chart-interaction-state";
import type { ChartScene } from "../scene/chart-scene";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { CartesianChartRenderer } from "./cartesian-chart-renderer";
import { PolarChartRenderer } from "./polar-chart-renderer";

export class CanvasChartRenderer {
    public static render(
        context: CanvasRenderingContext2D,
        scene: ChartScene,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver
    ): void {
        const { height, width } = scene;

        context.clearRect(0, 0, width, height);

        switch (scene.coordinateSystem) {
            case "cartesian":
                CartesianChartRenderer.render(context, scene, interactionState, styleResolver);
                return;
            case "polar":
                PolarChartRenderer.render(context, scene, interactionState, styleResolver);
                return;
        }
    }
}
