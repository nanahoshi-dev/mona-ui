import type { ChartPoint, ChartRect } from "../../models/chart.models";
import type { SceneHitTarget } from "../scene/scene-geometry";

export interface WaterfallHitEntry {
    readonly animationKey?: string;
    readonly bounds: ChartRect;
    readonly isZeroChange: boolean;
    readonly slotIndex?: number;
    readonly target: SceneHitTarget;
}

export interface WaterfallHitIndexOptions {
    readonly bandwidth?: number;
    readonly entries: readonly WaterfallHitEntry[];
    readonly plotRect: ChartRect;
    readonly step?: number;
}

export class WaterfallHitIndex {
    readonly #bandwidth?: number;
    readonly #entries: readonly WaterfallHitEntry[];
    readonly #plotRect: ChartRect;
    readonly #slotMap = new Map<number, WaterfallHitEntry>();
    readonly #step?: number;

    public constructor(options: WaterfallHitIndexOptions) {
        this.#plotRect = options.plotRect;
        this.#entries = options.entries;
        this.#step = options.step;
        this.#bandwidth = options.bandwidth;

        for (const entry of options.entries) {
            if (entry.slotIndex !== undefined) {
                this.#slotMap.set(entry.slotIndex, entry);
            }
        }
    }

    public get bandwidth(): number | undefined {
        return this.#bandwidth;
    }

    public get entries(): readonly WaterfallHitEntry[] {
        return this.#entries;
    }

    public get plotRect(): ChartRect {
        return this.#plotRect;
    }

    public get step(): number | undefined {
        return this.#step;
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

        // Fast O(1) path when regular step and slotMap are available
        if (this.#step !== undefined && this.#step > 0 && this.#slotMap.size > 0) {
            const relX = point.x - this.#plotRect.x;
            const slotIndex = Math.floor(relX / this.#step);
            const entry = this.#slotMap.get(slotIndex);
            if (entry) {
                const b = entry.bounds;
                const yMin = entry.isZeroChange ? b.y - 4 : b.y;
                const yMax = entry.isZeroChange ? b.y + b.height + 4 : b.y + b.height;
                if (point.x >= b.x && point.x <= b.x + b.width && point.y >= yMin && point.y <= yMax) {
                    return entry.target;
                }
            }
            return null;
        }

        // Fallback for sampled / dynamically positioned entries
        for (let i = 0; i < this.#entries.length; i++) {
            const entry = this.#entries[i];
            const b = entry.bounds;
            const yMin = entry.isZeroChange ? b.y - 4 : b.y;
            const yMax = entry.isZeroChange ? b.y + b.height + 4 : b.y + b.height;

            if (point.x >= b.x && point.x <= b.x + b.width && point.y >= yMin && point.y <= yMax) {
                return entry.target;
            }
        }

        return null;
    }
}
