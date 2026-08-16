import type { ChartPoint } from "../../models/chart.models";
import type { SceneHitTarget } from "../scene/scene-geometry";

export interface ChartInteractionState {
    activeHitTarget: SceneHitTarget | null;
    activeHits: readonly SceneHitTarget[];
    pointerPosition: ChartPoint | null;
}
