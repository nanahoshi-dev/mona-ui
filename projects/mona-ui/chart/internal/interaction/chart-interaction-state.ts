import type { ChartPoint } from "../../models/chart.models";
import type { SceneHitTarget } from "../scene/scene-geometry";

export type ChartInteractionSource = "keyboard" | "pointer";

export interface ChartInteractionState {
    activeHitTarget: SceneHitTarget | null;
    activeHits: readonly SceneHitTarget[];
    pointerPosition: ChartPoint | null;
    source?: ChartInteractionSource;
}
