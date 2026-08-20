import type { ChartBrushHitPolicy, ChartBrushMode } from "../../models/chart-brush.models";
import type { ChartPoint, ChartRect } from "../../models/chart.models";
import { CartesianHitAxisCompatibility } from "../interaction/cartesian-hit-axis-compatibility";
import { CartesianMarkVisualGeometry } from "../interaction/cartesian-mark-visual-geometry";
import type { SceneHitTarget } from "../scene/scene-geometry";

export interface IndexedBrushMark {
    readonly bounds: ChartRect;
    readonly hit: SceneHitTarget;
    readonly ordinal: number;
}

export interface BrushIndexInstrumentation {
    onCandidateExamined?(): void;
    onCellVisited?(): void;
    onIndexBuildHit?(): void;
}

export class CartesianBrushMarkIndex {
    readonly #cellSize: number;
    readonly #grid = new Map<string, IndexedBrushMark[]>();
    #totalHits = 0;

    public constructor(cellSize: number = 48) {
        this.#cellSize = Math.max(16, cellSize);
    }

    public get totalHits(): number {
        return this.#totalHits;
    }

    public build(hits: readonly SceneHitTarget[], instrumentation?: BrushIndexInstrumentation): void {
        this.#grid.clear();
        this.#totalHits = hits.length;

        let ordinal = 0;
        for (const hit of hits) {
            instrumentation?.onIndexBuildHit?.();
            const bounds = CartesianBrushMarkIndex.#getHitBounds(hit);
            if (!bounds) {
                ordinal++;
                continue;
            }

            const item: IndexedBrushMark = {
                bounds,
                hit,
                ordinal
            };
            ordinal++;

            const minCellX = Math.floor(bounds.x / this.#cellSize);
            const maxCellX = Math.floor((bounds.x + bounds.width) / this.#cellSize);
            const minCellY = Math.floor(bounds.y / this.#cellSize);
            const maxCellY = Math.floor((bounds.y + bounds.height) / this.#cellSize);

            for (let cx = minCellX; cx <= maxCellX; cx++) {
                for (let cy = minCellY; cy <= maxCellY; cy++) {
                    const key = `${cx}:${cy}`;
                    let cellHits = this.#grid.get(key);
                    if (!cellHits) {
                        cellHits = [];
                        this.#grid.set(key, cellHits);
                    }
                    cellHits.push(item);
                }
            }
        }
    }

    public query(
        brushBounds: ChartRect,
        hitPolicy: ChartBrushHitPolicy = "intersect",
        mode: ChartBrushMode = "xy",
        targetXAxisId?: string,
        targetYAxisId?: string,
        instrumentation?: BrushIndexInstrumentation
    ): readonly SceneHitTarget[] {
        if (this.#totalHits === 0 || this.#grid.size === 0) {
            return [];
        }

        const minCellX = Math.floor(brushBounds.x / this.#cellSize);
        const maxCellX = Math.floor((brushBounds.x + brushBounds.width) / this.#cellSize);
        const minCellY = Math.floor(brushBounds.y / this.#cellSize);
        const maxCellY = Math.floor((brushBounds.y + brushBounds.height) / this.#cellSize);

        const candidates = new Set<IndexedBrushMark>();

        for (let cx = minCellX; cx <= maxCellX; cx++) {
            for (let cy = minCellY; cy <= maxCellY; cy++) {
                instrumentation?.onCellVisited?.();
                const key = `${cx}:${cy}`;
                const cellHits = this.#grid.get(key);
                if (cellHits) {
                    for (const item of cellHits) {
                        candidates.add(item);
                    }
                }
            }
        }

        const matched: IndexedBrushMark[] = [];

        for (const item of candidates) {
            instrumentation?.onCandidateExamined?.();
            const hit = item.hit;

            if (!CartesianHitAxisCompatibility.isCompatible(hit, mode, targetXAxisId, targetYAxisId)) {
                continue;
            }

            if (CartesianBrushMarkIndex.#matches(item, brushBounds, hitPolicy)) {
                matched.push(item);
            }
        }

        matched.sort((a, b) => a.ordinal - b.ordinal);
        return matched.map(m => m.hit);
    }

    static #getHitBounds(hit: SceneHitTarget): ChartRect | null {
        return CartesianMarkVisualGeometry.getVisualBounds(hit);
    }

    static #getHitCenter(hit: SceneHitTarget): ChartPoint {
        return CartesianMarkVisualGeometry.getVisualCenter(hit);
    }

    static #matches(
        item: IndexedBrushMark,
        brush: ChartRect,
        policy: ChartBrushHitPolicy
    ): boolean {
        const hit = item.hit;
        const hitBounds = item.bounds;

        if (policy === "center") {
            const center = CartesianBrushMarkIndex.#getHitCenter(hit);
            return (
                center.x >= brush.x &&
                center.x <= brush.x + brush.width &&
                center.y >= brush.y &&
                center.y <= brush.y + brush.height
            );
        }

        // policy === "intersect"
        // For point-like marks (line/area without markers), intersect means center containment
        if ((hit.seriesType === "line" || hit.seriesType === "area") && !hit.visualRadius) {
            const center = CartesianBrushMarkIndex.#getHitCenter(hit);
            return (
                center.x >= brush.x &&
                center.x <= brush.x + brush.width &&
                center.y >= brush.y &&
                center.y <= brush.y + brush.height
            );
        }

        return (
            hitBounds.x < brush.x + brush.width &&
            hitBounds.x + hitBounds.width > brush.x &&
            hitBounds.y < brush.y + brush.height &&
            hitBounds.y + hitBounds.height > brush.y
        );
    }
}
