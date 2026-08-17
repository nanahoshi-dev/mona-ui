import type { ChartInteractionState } from "../interaction/chart-interaction-state";
import type { PolarChartScene } from "../scene/chart-scene";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { PolarAxisChartRenderer } from "./polar-axis-chart-renderer";
import { PolarSectorChartRenderer } from "./polar-sector-chart-renderer";

export class PolarChartRenderer {
    public static render(
        context: CanvasRenderingContext2D,
        scene: PolarChartScene,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver
    ): void {
        if (scene.polarKind === "sector") {
            PolarSectorChartRenderer.render(context, scene, interactionState, styleResolver);
        } else if (scene.polarKind === "axis") {
            PolarAxisChartRenderer.render(context, scene, interactionState, styleResolver);
        }
    }
}
