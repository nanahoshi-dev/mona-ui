import type { ChartPoint, ChartRect } from "../../models/chart.models";
import type { SceneHitTarget } from "../scene/scene-geometry";
import type { SceneWaterfallBar } from "../scene/waterfall-scene";

export class WaterfallHitIndex {
    public constructor(
        public readonly plotRect: ChartRect,
        public readonly bars: readonly SceneWaterfallBar[],
        public readonly hitTargets: readonly SceneHitTarget[]
    ) {}

    public query(point: ChartPoint): SceneHitTarget | null {
        if (
            point.x < this.plotRect.x ||
            point.x > this.plotRect.x + this.plotRect.width ||
            point.y < this.plotRect.y ||
            point.y > this.plotRect.y + this.plotRect.height
        ) {
            return null;
        }

        for (let i = 0; i < this.bars.length; i++) {
            const bar = this.bars[i];
            const b = bar.bounds;

            const yMin = bar.isZeroChange ? b.y - 4 : b.y;
            const yMax = bar.isZeroChange ? b.y + b.height + 4 : b.y + b.height;

            if (point.x >= b.x && point.x <= b.x + b.width && point.y >= yMin && point.y <= yMax) {
                return this.hitTargets[i] ?? null;
            }
        }

        return null;
    }
}
