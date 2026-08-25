import type { ChartScene } from "../scene/chart-scene";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import type { ChartRenderPresentationState } from "./chart-render-presentation-state";

export interface ChartRenderFrame {
    readonly presentation: ChartRenderPresentationState | null;
    readonly scene: ChartScene;
    readonly styleResolver: ChartStyleResolver;
}

export interface ChartCrossfadeRenderFrame {
    readonly fromScene: ChartScene | null;
    readonly presentation: ChartRenderPresentationState | null;
    readonly progress: number;
    readonly styleResolver: ChartStyleResolver;
    readonly toScene: ChartScene;
}
