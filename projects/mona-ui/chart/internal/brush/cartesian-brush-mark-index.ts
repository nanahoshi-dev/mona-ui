import type { ChartBrushHitPolicy, ChartBrushMode } from "../../models/chart-brush.models";
import type { ChartPoint, ChartRect } from "../../models/chart.models";
import { CartesianHitAxisCompatibility } from "../interaction/cartesian-hit-axis-compatibility";
import type { SceneHitTarget } from "../scene/scene-geometry";

export class CartesianBrushMarkIndex {
    readonly #cellSize: number;
    readonly #grid = new Map<string, SceneHitTarget[]>();
    readonly #allHits: SceneHitTarget[] = [];

    public constructor(cellSize: number = 48) {
        this.#cellSize = Math.max(16, cellSize);
    }

    public build(hits: readonly SceneHitTarget[]): void {
        this.#grid.clear();
        this.#allHits.length = 0;

        for (const hit of hits) {
            this.#allHits.push(hit);
            const bounds = CartesianBrushMarkIndex.#getHitBounds(hit);
            if (!bounds) {
                continue;
            }

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
                    cellHits.push(hit);
                }
            }
        }
    }

    public query(
        brushBounds: ChartRect,
        hitPolicy: ChartBrushHitPolicy = "intersect",
        mode: ChartBrushMode = "xy",
        targetXAxisId?: string,
        targetYAxisId?: string
    ): readonly SceneHitTarget[] {
        if (this.#allHits.length === 0) {
            return [];
        }

        const minCellX = Math.floor(brushBounds.x / this.#cellSize);
        const maxCellX = Math.floor((brushBounds.x + brushBounds.width) / this.#cellSize);
        const minCellY = Math.floor(brushBounds.y / this.#cellSize);
        const maxCellY = Math.floor((brushBounds.y + brushBounds.height) / this.#cellSize);

        const candidates = new Set<SceneHitTarget>();

        for (let cx = minCellX; cx <= maxCellX; cx++) {
            for (let cy = minCellY; cy <= maxCellY; cy++) {
                const key = `${cx}:${cy}`;
                const cellHits = this.#grid.get(key);
                if (cellHits) {
                    for (const hit of cellHits) {
                        candidates.add(hit);
                    }
                }
            }
        }

        const results: SceneHitTarget[] = [];

        for (const hit of this.#allHits) {
            if (!candidates.has(hit)) {
                continue;
            }

            if (!CartesianHitAxisCompatibility.isCompatible(hit, mode, targetXAxisId, targetYAxisId)) {
                continue;
            }

            if (CartesianBrushMarkIndex.#matches(hit, brushBounds, hitPolicy)) {
                results.push(hit);
            }
        }

        return results;
    }

    static #getHitBounds(hit: SceneHitTarget): ChartRect | null {
        if (hit.visualBounds) {
            return hit.visualBounds;
        }
        if (hit.bounds) {
            return hit.bounds;
        }
        if (hit.highPoint && hit.lowPoint) {
            const minX = Math.min(hit.highPoint.x, hit.lowPoint.x);
            const maxX = Math.max(hit.highPoint.x, hit.lowPoint.x);
            const minY = Math.min(hit.highPoint.y, hit.lowPoint.y);
            const maxY = Math.max(hit.highPoint.y, hit.lowPoint.y);
            return {
                height: Math.max(4, maxY - minY),
                width: Math.max(4, maxX - minX),
                x: minX,
                y: minY
            };
        }
        if (hit.point) {
            const r = hit.radius ?? 4;
            return {
                height: r * 2,
                width: r * 2,
                x: hit.point.x - r,
                y: hit.point.y - r
            };
        }
        return null;
    }

    static #getHitCenter(hit: SceneHitTarget): ChartPoint {
        if (hit.point) {
            return hit.point;
        }
        if (hit.highPoint && hit.lowPoint) {
            return {
                x: (hit.highPoint.x + hit.lowPoint.x) / 2,
                y: (hit.highPoint.y + hit.lowPoint.y) / 2
            };
        }
        if (hit.visualBounds) {
            return {
                x: hit.visualBounds.x + hit.visualBounds.width / 2,
                y: hit.visualBounds.y + hit.visualBounds.height / 2
            };
        }
        if (hit.bounds) {
            return {
                x: hit.bounds.x + hit.bounds.width / 2,
                y: hit.bounds.y + hit.bounds.height / 2
            };
        }
        return { x: 0, y: 0 };
    }

    static #matches(
        hit: SceneHitTarget,
        brush: ChartRect,
        policy: ChartBrushHitPolicy
    ): boolean {
        const hitBounds = CartesianBrushMarkIndex.#getHitBounds(hit);
        if (!hitBounds) {
            return false;
        }

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
        return (
            hitBounds.x < brush.x + brush.width &&
            hitBounds.x + hitBounds.width > brush.x &&
            hitBounds.y < brush.y + brush.height &&
            hitBounds.y + hitBounds.height > brush.y
        );
    }
}
