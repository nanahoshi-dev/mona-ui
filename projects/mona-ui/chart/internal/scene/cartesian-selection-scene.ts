import type { SceneHitTarget } from "./scene-geometry";

export interface CartesianSelectionScene {
    readonly hits: readonly SceneHitTarget[];
}
