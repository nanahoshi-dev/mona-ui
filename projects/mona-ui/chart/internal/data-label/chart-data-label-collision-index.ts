import type { ChartRect } from "../../models/chart.models";

export class ChartDataLabelCollisionIndex {
    readonly #cellSize: number;
    readonly #grid = new Map<string, ChartRect[]>();
    #count = 0;

    public constructor(cellSize: number = 48) {
        this.#cellSize = Math.max(16, cellSize);
    }

    public get count(): number {
        return this.#count;
    }

    public clear(): void {
        this.#grid.clear();
        this.#count = 0;
    }

    public collides(bounds: ChartRect, padding: number = 0): boolean {
        const padded: ChartRect =
            padding > 0
                ? {
                      height: bounds.height + padding * 2,
                      width: bounds.width + padding * 2,
                      x: bounds.x - padding,
                      y: bounds.y - padding
                  }
                : bounds;

        const minCellX = Math.floor(padded.x / this.#cellSize);
        const maxCellX = Math.floor((padded.x + padded.width) / this.#cellSize);
        const minCellY = Math.floor(padded.y / this.#cellSize);
        const maxCellY = Math.floor((padded.y + padded.height) / this.#cellSize);

        const checkedRects = new Set<ChartRect>();

        for (let cx = minCellX; cx <= maxCellX; cx++) {
            for (let cy = minCellY; cy <= maxCellY; cy++) {
                const key = `${cx}:${cy}`;
                const cellRects = this.#grid.get(key);
                if (!cellRects) {
                    continue;
                }
                for (const other of cellRects) {
                    if (checkedRects.has(other)) {
                        continue;
                    }
                    checkedRects.add(other);
                    if (ChartDataLabelCollisionIndex.#intersects(padded, other)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    public insert(bounds: ChartRect, padding: number = 0): void {
        const padded: ChartRect =
            padding > 0
                ? {
                      height: bounds.height + padding * 2,
                      width: bounds.width + padding * 2,
                      x: bounds.x - padding,
                      y: bounds.y - padding
                  }
                : bounds;

        const minCellX = Math.floor(padded.x / this.#cellSize);
        const maxCellX = Math.floor((padded.x + padded.width) / this.#cellSize);
        const minCellY = Math.floor(padded.y / this.#cellSize);
        const maxCellY = Math.floor((padded.y + padded.height) / this.#cellSize);

        for (let cx = minCellX; cx <= maxCellX; cx++) {
            for (let cy = minCellY; cy <= maxCellY; cy++) {
                const key = `${cx}:${cy}`;
                let cellRects = this.#grid.get(key);
                if (!cellRects) {
                    cellRects = [];
                    this.#grid.set(key, cellRects);
                }
                cellRects.push(padded);
            }
        }
        this.#count++;
    }

    static #intersects(a: ChartRect, b: ChartRect): boolean {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }
}
