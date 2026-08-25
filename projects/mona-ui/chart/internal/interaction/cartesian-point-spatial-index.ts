import type { ChartPoint } from "../../models/chart.models";
import type { SceneHitTarget } from "../scene/scene-geometry";

export class CartesianPointSpatialIndex {
    readonly #cellSize: number;
    readonly #cells = new Map<string, SceneHitTarget[]>();

    public constructor(cellSize = 32) {
        this.#cellSize = Math.max(8, cellSize);
    }

    public insert(target: SceneHitTarget): void {
        if (!target.point) {
            return;
        }

        const { x, y } = target.point;
        const radius = Math.max(target.radius ?? 10, target.visualRadius ?? 4);

        const minCellX = Math.floor((x - radius) / this.#cellSize);
        const maxCellX = Math.floor((x + radius) / this.#cellSize);
        const minCellY = Math.floor((y - radius) / this.#cellSize);
        const maxCellY = Math.floor((y + radius) / this.#cellSize);

        for (let cx = minCellX; cx <= maxCellX; cx++) {
            for (let cy = minCellY; cy <= maxCellY; cy++) {
                const key = `${cx}:${cy}`;
                let cell = this.#cells.get(key);
                if (!cell) {
                    cell = [];
                    this.#cells.set(key, cell);
                }
                cell.push(target);
            }
        }
    }

    public insertAll(targets: readonly SceneHitTarget[]): void {
        for (let i = 0; i < targets.length; i++) {
            this.insert(targets[i]);
        }
    }

    public query(point: ChartPoint, searchRadius = 32): readonly SceneHitTarget[] {
        const minCellX = Math.floor((point.x - searchRadius) / this.#cellSize);
        const maxCellX = Math.floor((point.x + searchRadius) / this.#cellSize);
        const minCellY = Math.floor((point.y - searchRadius) / this.#cellSize);
        const maxCellY = Math.floor((point.y + searchRadius) / this.#cellSize);

        const resultSet = new Set<SceneHitTarget>();

        for (let cx = minCellX; cx <= maxCellX; cx++) {
            for (let cy = minCellY; cy <= maxCellY; cy++) {
                const key = `${cx}:${cy}`;
                const cell = this.#cells.get(key);
                if (cell) {
                    for (let i = 0; i < cell.length; i++) {
                        resultSet.add(cell[i]);
                    }
                }
            }
        }

        return Array.from(resultSet);
    }

    public get size(): number {
        return this.#cells.size;
    }
}
