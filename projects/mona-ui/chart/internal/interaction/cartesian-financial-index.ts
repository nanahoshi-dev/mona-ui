import type { ChartPoint, ChartRect } from "../../models/chart.models";
import type { SceneHitTarget } from "../scene/scene-geometry";

export interface FinancialHitEntry {
    readonly bounds: ChartRect;
    readonly centerX: number;
    readonly highY: number;
    readonly lowY: number;
    readonly target: SceneHitTarget;
}

export class CartesianFinancialIndex {
    readonly #entries: readonly FinancialHitEntry[];

    public constructor(entries: readonly FinancialHitEntry[]) {
        this.#entries = [...entries].sort((a, b) => a.centerX - b.centerX);
    }

    public get size(): number {
        return this.#entries.length;
    }

    public query(point: ChartPoint): readonly SceneHitTarget[] {
        if (this.#entries.length === 0) {
            return [];
        }

        const px = point.x;
        const py = point.y;

        // Binary search for the closest entry by centerX
        let low = 0;
        let high = this.#entries.length - 1;
        let mid = 0;

        while (low <= high) {
            mid = Math.floor((low + high) / 2);
            const midX = this.#entries[mid].centerX;
            if (midX < px) {
                low = mid + 1;
            } else if (midX > px) {
                high = mid - 1;
            } else {
                break;
            }
        }

        // Candidate window around mid: bounded neighborhood search (O(log n + k))
        const results: SceneHitTarget[] = [];
        const start = Math.max(0, mid - 15);
        const end = Math.min(this.#entries.length - 1, mid + 15);

        for (let i = start; i <= end; i++) {
            const entry = this.#entries[i];
            const b = entry.bounds;
            if (px >= b.x && px <= b.x + b.width && py >= b.y && py <= b.y + b.height) {
                results.push(entry.target);
            }
        }

        return results;
    }

    public queryCandidateCount(point: ChartPoint): number {
        if (this.#entries.length === 0) {
            return 0;
        }
        return Math.min(this.#entries.length, 31);
    }
}
