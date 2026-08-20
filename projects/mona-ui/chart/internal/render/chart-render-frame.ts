import type { ChartScene } from "../scene/chart-scene";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import type { ChartRenderPresentationState } from "./chart-render-presentation-state";

export interface ChartRenderFrame {
    readonly scene: ChartScene;
    readonly presentation: ChartRenderPresentationState | null;
    readonly styleResolver: ChartStyleResolver;
}

export interface ChartCrossfadeRenderFrame {
    readonly fromScene: ChartScene | null;
    readonly toScene: ChartScene;
    readonly progress: number;
    readonly presentation: ChartRenderPresentationState | null;
    readonly styleResolver: ChartStyleResolver;
}
