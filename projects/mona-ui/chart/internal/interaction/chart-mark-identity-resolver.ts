import type { SceneHitTarget } from "../scene/scene-geometry";

export class ChartMarkIdentityResolver {
    public static resolve(hit: SceneHitTarget): string {
        if (hit.animationKey) {
            return hit.animationKey;
        }
        if (hit.itemId) {
            return hit.itemId;
        }
        if (hit.sliceId) {
            return hit.sliceId;
        }

        return JSON.stringify([hit.seriesId, "index", hit.dataIndex ?? hit.index]);
    }
}
