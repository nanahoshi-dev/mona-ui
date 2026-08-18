import type { ChartPoint, ChartRect } from "../../models/chart.models";
import type { ChartFunnelOrientation } from "../../models/chart-funnel.models";
import type { SceneHitTarget } from "../scene/scene-geometry";

export function isPointInConvexPolygon(point: ChartPoint, vertices: readonly ChartPoint[]): boolean {
    if (vertices.length < 3) {
        return false;
    }

    let positive = false;
    let negative = false;

    for (let i = 0; i < vertices.length; i++) {
        const v1 = vertices[i];
        const v2 = vertices[(i + 1) % vertices.length];

        const cross = (v2.x - v1.x) * (point.y - v1.y) - (v2.y - v1.y) * (point.x - v1.x);

        if (cross > 1e-7) {
            positive = true;
        }
        if (cross < -1e-7) {
            negative = true;
        }

        if (positive && negative) {
            return false;
        }
    }

    return true;
}

export interface FunnelHitEntry {
    readonly animationKey?: string;
    readonly bounds: ChartRect;
    readonly polygon: readonly [ChartPoint, ChartPoint, ChartPoint, ChartPoint];
    readonly slotIndex?: number;
    readonly target: SceneHitTarget;
}

export interface FunnelHitIndexOptions {
    readonly entries: readonly FunnelHitEntry[];
    readonly gap: number;
    readonly orientation: ChartFunnelOrientation;
    readonly plotRect: ChartRect;
    readonly slotSpan: number;
}

export class FunnelHitIndex {
    readonly #entries: readonly FunnelHitEntry[];
    readonly #gap: number;
    readonly #orientation: ChartFunnelOrientation;
    readonly #plotRect: ChartRect;
    readonly #slotMap = new Map<number, FunnelHitEntry>();
    readonly #slotSpan: number;

    public constructor(options: FunnelHitIndexOptions) {
        this.#plotRect = options.plotRect;
        this.#orientation = options.orientation;
        this.#slotSpan = options.slotSpan;
        this.#gap = options.gap;
        this.#entries = options.entries;

        for (const entry of options.entries) {
            if (entry.slotIndex !== undefined) {
                this.#slotMap.set(entry.slotIndex, entry);
            }
        }
    }

    public get entries(): readonly FunnelHitEntry[] {
        return this.#entries;
    }

    public get gap(): number {
        return this.#gap;
    }

    public get orientation(): ChartFunnelOrientation {
        return this.#orientation;
    }

    public get plotRect(): ChartRect {
        return this.#plotRect;
    }

    public get slotSpan(): number {
        return this.#slotSpan;
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

        const step = this.#slotSpan + this.#gap;
        if (step > 0 && this.#slotMap.size > 0) {
            const offset = this.#orientation === "vertical" ? point.y - this.#plotRect.y : point.x - this.#plotRect.x;
            const slotIdx = Math.floor(offset / step);
            const inSlotOffset = offset - slotIdx * step;
            if (inSlotOffset > this.#slotSpan) {
                return null; // Inside gap between stages
            }

            const entry = this.#slotMap.get(slotIdx);
            if (entry && entry.bounds.width > 0 && entry.bounds.height > 0) {
                if (isPointInConvexPolygon(point, entry.polygon)) {
                    return entry.target;
                }
            }
            return null;
        }

        // Fallback for sampled / arbitrary frames
        for (let i = 0; i < this.#entries.length; i++) {
            const entry = this.#entries[i];
            if (entry.bounds.width > 0 && entry.bounds.height > 0) {
                if (isPointInConvexPolygon(point, entry.polygon)) {
                    return entry.target;
                }
            }
        }

        return null;
    }
}
