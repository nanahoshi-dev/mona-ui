import type { ChartPoint, ChartRect } from "../../models/chart.models";
import type { SceneHitTarget } from "../scene/scene-geometry";

export interface TreemapSpatialBin {
    readonly targets: readonly SceneHitTarget[];
}

export class TreemapHitIndex {
    readonly #plotRect: ChartRect;
    readonly #cols: number;
    readonly #rows: number;
    readonly #cellWidth: number;
    readonly #cellHeight: number;
    readonly #grid: readonly (readonly SceneHitTarget[])[];
    readonly #allTargets: readonly SceneHitTarget[];

    public constructor(
        plotRect: ChartRect,
        hitTargets: readonly SceneHitTarget[]
    ) {
        this.#plotRect = plotRect;
        this.#allTargets = hitTargets;

        const count = hitTargets.length;
        if (count === 0 || plotRect.width <= 0 || plotRect.height <= 0) {
            this.#cols = 1;
            this.#rows = 1;
            this.#cellWidth = Math.max(1, plotRect.width);
            this.#cellHeight = Math.max(1, plotRect.height);
            this.#grid = [[]];
            return;
        }

        // Adaptive spatial grid up to 128x128
        const aspectRatio = plotRect.width / Math.max(1, plotRect.height);
        const targetBins = Math.min(1024, Math.max(16, count));
        let cols = Math.round(Math.sqrt(targetBins * aspectRatio));
        let rows = Math.round(targetBins / Math.max(1, cols));
        cols = Math.max(1, Math.min(128, cols));
        rows = Math.max(1, Math.min(128, rows));

        this.#cols = cols;
        this.#rows = rows;
        this.#cellWidth = plotRect.width / cols;
        this.#cellHeight = plotRect.height / rows;

        const bins: SceneHitTarget[][] = Array.from({ length: cols * rows }, () => []);

        for (const target of hitTargets) {
            const bounds = target.bounds;
            if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
                continue;
            }

            const minCol = Math.max(0, Math.min(cols - 1, Math.floor((bounds.x - plotRect.x) / this.#cellWidth)));
            const maxCol = Math.max(0, Math.min(cols - 1, Math.floor((bounds.x + bounds.width - plotRect.x) / this.#cellWidth)));
            const minRow = Math.max(0, Math.min(rows - 1, Math.floor((bounds.y - plotRect.y) / this.#cellHeight)));
            const maxRow = Math.max(0, Math.min(rows - 1, Math.floor((bounds.y + bounds.height - plotRect.y) / this.#cellHeight)));

            for (let r = minRow; r <= maxRow; r++) {
                for (let c = minCol; c <= maxCol; c++) {
                    bins[r * cols + c].push(target);
                }
            }
        }

        this.#grid = bins;
    }

    public query(point: ChartPoint): SceneHitTarget | null {
        if (
            point.x < this.#plotRect.x ||
            point.x > this.#plotRect.x + this.#plotRect.width ||
            point.y < this.#plotRect.y ||
            point.y > this.#plotRect.y + this.#plotRect.height
        ) {
            return null;
        }

        if (this.#allTargets.length < 32) {
            return this.#queryLinear(point, this.#allTargets);
        }

        const col = Math.max(0, Math.min(this.#cols - 1, Math.floor((point.x - this.#plotRect.x) / this.#cellWidth)));
        const row = Math.max(0, Math.min(this.#rows - 1, Math.floor((point.y - this.#plotRect.y) / this.#cellHeight)));
        const bin = this.#grid[row * this.#cols + col];

        return this.#queryLinear(point, bin);
    }

    #queryLinear(point: ChartPoint, candidates: readonly SceneHitTarget[]): SceneHitTarget | null {
        let bestTarget: SceneHitTarget | null = null;
        let bestDepth = -1;
        let bestOrder = -1;

        for (const candidate of candidates) {
            const b = candidate.bounds;
            if (!b) {
                continue;
            }

            if (point.x >= b.x && point.x <= b.x + b.width && point.y >= b.y && point.y <= b.y + b.height) {
                const depth = candidate.hierarchy?.depth ?? 0;
                const order = candidate.renderOrder ?? candidate.index ?? 0;

                if (depth > bestDepth || (depth === bestDepth && order >= bestOrder)) {
                    bestTarget = candidate;
                    bestDepth = depth;
                    bestOrder = order;
                }
            }
        }

        return bestTarget;
    }
}
