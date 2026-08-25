import type { ChartPoint } from "../../models/chart.models";
import type { CartesianHeatmapChartScene } from "../scene/chart-scene";
import type { ChartInteractionState } from "./chart-interaction-state";

export class HeatmapHitTester {
    public static testHit(pointer: ChartPoint, scene: CartesianHeatmapChartScene): ChartInteractionState {
        const hit = scene.cellIndex.hitTest(pointer);
        return {
            activeHitTarget: hit,
            activeHits: hit ? [hit] : [],
            pointerPosition: pointer
        };
    }
}
