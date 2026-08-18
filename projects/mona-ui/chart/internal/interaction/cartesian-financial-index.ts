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
    readonly #maxHalfWidth: number;

    public constructor(entries: readonly FinancialHitEntry[]) {
        this.#entries = [...entries].sort((a, b) => a.centerX - b.centerX);
        let maxHalf = 0;
        for (const e of this.#entries) {
            const halfW = Math.max(
                Math.abs(e.centerX - e.bounds.x),
                Math.abs(e.bounds.x + e.bounds.width - e.centerX)
            );
            if (halfW > maxHalf) {
                maxHalf = halfW;
            }
        }
        this.#maxHalfWidth = maxHalf;
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
        const minCenterX = px - this.#maxHalfWidth;
        const maxCenterX = px + this.#maxHalfWidth;

        let low = 0;
        let high = this.#entries.length - 1;
        let firstIdx = this.#entries.length;

        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            if (this.#entries[mid].centerX >= minCenterX) {
                firstIdx = mid;
                high = mid - 1;
            } else {
                low = mid + 1;
            }
        }

        const results: SceneHitTarget[] = [];
        for (let i = firstIdx; i < this.#entries.length; i++) {
            const entry = this.#entries[i];
            if (entry.centerX > maxCenterX) {
                break;
            }
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
        const px = point.x;
        const minCenterX = px - this.#maxHalfWidth;
        const maxCenterX = px + this.#maxHalfWidth;

        let low = 0;
        let high = this.#entries.length - 1;
        let firstIdx = this.#entries.length;

        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            if (this.#entries[mid].centerX >= minCenterX) {
                firstIdx = mid;
                high = mid - 1;
            } else {
                low = mid + 1;
            }
        }

        let count = 0;
        for (let i = firstIdx; i < this.#entries.length; i++) {
            if (this.#entries[i].centerX > maxCenterX) {
                break;
            }
            count++;
        }
        return count;
    }
}
