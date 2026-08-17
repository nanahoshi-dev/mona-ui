import type { CartesianHeatmapChartScene } from "../scene/chart-scene";
import type { SceneHitTarget } from "../scene/scene-geometry";

export class HeatmapKeyboardNavigation {
    public static handleKey(
        event: KeyboardEvent,
        scene: CartesianHeatmapChartScene,
        currentSelection: SceneHitTarget | null
    ): SceneHitTarget | null {
        const { cellIndex, hitTargets, xCategories, yCategories } = scene;
        if (hitTargets.length === 0) {
            return null;
        }

        const xCount = xCategories.length;
        const yCount = yCategories.length;

        // No current selection: pick starting cell
        if (!currentSelection || currentSelection.xIndex === undefined || currentSelection.yIndex === undefined) {
            switch (event.key) {
                case "ArrowDown":
                case "ArrowRight":
                case "Home":
                    return hitTargets[0] ?? null;
                case "ArrowLeft":
                case "ArrowUp":
                case "End":
                    return hitTargets[hitTargets.length - 1] ?? null;
                default:
                    return null;
            }
        }

        const col = currentSelection.xIndex;
        const row = currentSelection.yIndex;

        switch (event.key) {
            case "ArrowRight": {
                for (let c = col + 1; c < xCount; c++) {
                    const hit = cellIndex.get(c, row);
                    if (hit) {
                        return hit;
                    }
                }
                return currentSelection;
            }

            case "ArrowLeft": {
                for (let c = col - 1; c >= 0; c--) {
                    const hit = cellIndex.get(c, row);
                    if (hit) {
                        return hit;
                    }
                }
                return currentSelection;
            }

            case "ArrowDown": {
                for (let r = row + 1; r < yCount; r++) {
                    const hit = cellIndex.get(col, r);
                    if (hit) {
                        return hit;
                    }
                }
                return currentSelection;
            }

            case "ArrowUp": {
                for (let r = row - 1; r >= 0; r--) {
                    const hit = cellIndex.get(col, r);
                    if (hit) {
                        return hit;
                    }
                }
                return currentSelection;
            }

            case "Home": {
                if (event.ctrlKey || event.metaKey) {
                    return hitTargets[0] ?? currentSelection;
                }
                for (let c = 0; c < xCount; c++) {
                    const hit = cellIndex.get(c, row);
                    if (hit) {
                        return hit;
                    }
                }
                return currentSelection;
            }

            case "End": {
                if (event.ctrlKey || event.metaKey) {
                    return hitTargets[hitTargets.length - 1] ?? currentSelection;
                }
                for (let c = xCount - 1; c >= 0; c--) {
                    const hit = cellIndex.get(c, row);
                    if (hit) {
                        return hit;
                    }
                }
                return currentSelection;
            }

            default:
                return currentSelection;
        }
    }
}
