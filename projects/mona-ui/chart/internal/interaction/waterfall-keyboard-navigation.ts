import type { ChartKeyboardNavResult } from "./chart-keyboard-navigation";
import type { CartesianWaterfallChartScene } from "../scene/waterfall-scene";

export class WaterfallKeyboardNavigation {
    public static handleKeyDown(
        event: KeyboardEvent,
        scene: CartesianWaterfallChartScene,
        currentBucketIndex: number
    ): ChartKeyboardNavResult | null {
        const series = scene.series[0];
        if (!series || series.bars.length === 0 || scene.hitTargets.length === 0) {
            return null;
        }

        const count = scene.hitTargets.length;
        let targetIndex: number | null = null;

        const currentIndex =
            currentBucketIndex >= 0 && currentBucketIndex < count
                ? currentBucketIndex
                : currentBucketIndex < 0
                  ? -1
                  : count - 1;

        if (event.key === "Home") {
            targetIndex = 0;
        } else if (event.key === "End") {
            targetIndex = count - 1;
        } else if (event.key === "ArrowRight") {
            targetIndex = currentIndex < 0 ? 0 : Math.min(count - 1, currentIndex + 1);
        } else if (event.key === "ArrowLeft") {
            targetIndex = currentIndex < 0 ? count - 1 : Math.max(0, currentIndex - 1);
        }

        if (targetIndex !== null && targetIndex >= 0 && targetIndex < count) {
            event.preventDefault();
            const targetHit = scene.hitTargets[targetIndex];
            const hitKey = targetHit.animationKey ?? targetHit.itemId ?? `${targetHit.seriesId}:${targetHit.index}`;
            return {
                bucketIndex: targetIndex,
                hitKey,
                seriesId: series.id
            };
        }

        return null;
    }
}
