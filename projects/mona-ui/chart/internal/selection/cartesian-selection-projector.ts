import type { CartesianSelectionScene } from "../scene/cartesian-selection-scene";
import type { SceneHitTarget } from "../scene/scene-geometry";
import type { ChartVisibleMarkIndex } from "../interaction/chart-visible-mark-index";

export class CartesianSelectionProjector {
    public static project(
        visibleIndex: ChartVisibleMarkIndex,
        selectedMarkIdSet: ReadonlySet<string>
    ): CartesianSelectionScene {
        if (selectedMarkIdSet.size === 0 || visibleIndex.size === 0) {
            return { hits: [] };
        }

        const hits: SceneHitTarget[] = [];
        for (const markId of selectedMarkIdSet) {
            const hit = visibleIndex.get(markId);
            if (hit) {
                hits.push(hit);
            }
        }

        return { hits };
    }
}
