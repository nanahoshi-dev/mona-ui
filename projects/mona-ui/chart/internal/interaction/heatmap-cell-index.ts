import type { ChartPoint, ChartRect } from "../../models/chart.models";
import type { SceneHeatmapCell } from "../../models/chart-heatmap.models";
import type { SceneHitTarget } from "../scene/scene-geometry";
import { isPointInRect } from "../utils/geometry-utils";

export interface HeatmapCellIndexOptions {
    readonly cellGap: number;
    readonly cells: readonly SceneHeatmapCell[];
    readonly hitTargets: readonly SceneHitTarget[];
    readonly plotRect: ChartRect;
    readonly xBandWidth: number;
    readonly xCount: number;
    readonly yBandHeight: number;
    readonly yCount: number;
}

export class HeatmapCellIndex {
    readonly #byCoordinate = new Map<string, SceneHitTarget>();
    readonly #byIndex = new Map<string, SceneHeatmapCell>();
    readonly #cellCount: number;
    readonly #cellGap: number;
    readonly #plotRect: ChartRect;
    readonly #xBandWidth: number;
    readonly #xCount: number;
    readonly #yBandHeight: number;
    readonly #yCount: number;

    public constructor(options: HeatmapCellIndexOptions) {
        const { cellGap, cells, hitTargets, plotRect, xBandWidth, xCount, yBandHeight, yCount } = options;
        this.#cellGap = cellGap;
        this.#plotRect = plotRect;
        this.#xBandWidth = xBandWidth;
        this.#xCount = xCount;
        this.#yBandHeight = yBandHeight;
        this.#yCount = yCount;
        this.#cellCount = cells.length;

        for (const cell of cells) {
            this.#byIndex.set(`${cell.xIndex}:${cell.yIndex}`, cell);
        }

        for (const hit of hitTargets) {
            if (hit.xIndex !== undefined && hit.yIndex !== undefined) {
                this.#byCoordinate.set(`${hit.xIndex}:${hit.yIndex}`, hit);
            }
        }
    }

    public get byCoordinate(): ReadonlyMap<string, SceneHeatmapCell> {
        return this.#byIndex;
    }

    public get byIndex(): ReadonlyMap<string, SceneHeatmapCell> {
        return this.#byIndex;
    }

    public get cellCount(): number {
        return this.#cellCount;
    }

    public get xCount(): number {
        return this.#xCount;
    }

    public get yCount(): number {
        return this.#yCount;
    }

    public get(columnIndex: number, rowIndex: number): SceneHitTarget | undefined {
        return this.#byCoordinate.get(`${columnIndex}:${rowIndex}`);
    }

    public getCell(columnIndex: number, rowIndex: number): SceneHeatmapCell | undefined {
        return this.#byIndex.get(`${columnIndex}:${rowIndex}`);
    }

    public hitTest(pointer: ChartPoint): SceneHitTarget | null {
        if (!isPointInRect(pointer, this.#plotRect)) {
            return null;
        }

        if (this.#xBandWidth <= 0 || this.#yBandHeight <= 0 || this.#xCount === 0 || this.#yCount === 0) {
            return null;
        }

        const col = Math.floor((pointer.x - this.#plotRect.x) / this.#xBandWidth);
        const row = Math.floor((pointer.y - this.#plotRect.y) / this.#yBandHeight);

        if (col < 0 || col >= this.#xCount || row < 0 || row >= this.#yCount) {
            return null;
        }

        const hit = this.#byCoordinate.get(`${col}:${row}`);
        if (!hit || !hit.bounds) {
            return null;
        }

        if (isPointInRect(pointer, hit.bounds)) {
            return hit;
        }

        return null;
    }
}
