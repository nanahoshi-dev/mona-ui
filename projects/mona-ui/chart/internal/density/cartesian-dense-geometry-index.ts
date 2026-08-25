import type { ChartPoint } from "../../models/chart.models";
import type { CartesianDenseNearestDimension } from "./cartesian-dense-interaction-provider";

export interface DenseGeometryItemDistance {
    readonly distance: number;
    readonly secondaryDistance: number;
}

export interface DenseGeometryQuery {
    readonly dimension: CartesianDenseNearestDimension;
    readonly mapX: (xVal: number) => number | undefined;
    readonly mapY: (yVal: number) => number | undefined;
    readonly pixel: ChartPoint;
}

export interface DensePointDataSource {
    readonly count: number;
    getX(index: number): number;
    getY(index: number): number;
    isValid(index: number): boolean;
}

export interface DenseSegmentDataSource {
    readonly count: number;
    getHighY(index: number): number;
    getLowY(index: number): number;
    getX(index: number): number;
    isValid(index: number): boolean;
}

const BLOCK_SIZE = 64;
const SUPER_BLOCK_SIZE = 64; // in leaf blocks (4096 points)

interface LeafBlock {
    readonly end: number;
    readonly hasValid: boolean;
    readonly maxX: number;
    readonly maxY: number;
    readonly minX: number;
    readonly minY: number;
    readonly start: number;
}

interface SuperBlock {
    readonly leafBlocks: readonly LeafBlock[];
    readonly maxX: number;
    readonly maxY: number;
    readonly minX: number;
    readonly minY: number;
}

export class DensePointGeometryIndex {
    readonly #source: DensePointDataSource;
    readonly #superBlocks: readonly SuperBlock[];

    public constructor(source: DensePointDataSource) {
        this.#source = source;
        const n = source.count;
        const leafBlocks: LeafBlock[] = [];

        for (let start = 0; start < n; start += BLOCK_SIZE) {
            const end = Math.min(n, start + BLOCK_SIZE);
            let minX = Number.POSITIVE_INFINITY;
            let maxX = Number.NEGATIVE_INFINITY;
            let minY = Number.POSITIVE_INFINITY;
            let maxY = Number.NEGATIVE_INFINITY;
            let hasValid = false;

            for (let i = start; i < end; i++) {
                if (!source.isValid(i)) continue;
                const x = source.getX(i);
                const y = source.getY(i);
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
                hasValid = true;
            }

            leafBlocks.push({
                end,
                hasValid,
                maxX: hasValid ? maxX : 0,
                maxY: hasValid ? maxY : 0,
                minX: hasValid ? minX : 0,
                minY: hasValid ? minY : 0,
                start
            });
        }

        const superBlocks: SuperBlock[] = [];
        for (let i = 0; i < leafBlocks.length; i += SUPER_BLOCK_SIZE) {
            const chunk = leafBlocks.slice(i, i + SUPER_BLOCK_SIZE);
            let minX = Number.POSITIVE_INFINITY;
            let maxX = Number.NEGATIVE_INFINITY;
            let minY = Number.POSITIVE_INFINITY;
            let maxY = Number.NEGATIVE_INFINITY;
            let anyValid = false;

            for (const b of chunk) {
                if (!b.hasValid) continue;
                if (b.minX < minX) minX = b.minX;
                if (b.maxX > maxX) maxX = b.maxX;
                if (b.minY < minY) minY = b.minY;
                if (b.maxY > maxY) maxY = b.maxY;
                anyValid = true;
            }

            superBlocks.push({
                leafBlocks: chunk,
                maxX: anyValid ? maxX : 0,
                maxY: anyValid ? maxY : 0,
                minX: anyValid ? minX : 0,
                minY: anyValid ? minY : 0
            });
        }

        this.#superBlocks = superBlocks;
    }

    public resolveNearest(query: DenseGeometryQuery): number | null {
        const { dimension, mapX, mapY, pixel } = query;
        let bestIdx = -1;
        let bestDist = Number.POSITIVE_INFINITY;
        let bestSecDist = Number.POSITIVE_INFINITY;

        // X-only fast monotonic narrowing if applicable
        for (const superBlock of this.#superBlocks) {
            const sbLowerBound = this.#rectDistance(
                superBlock.minX,
                superBlock.maxX,
                superBlock.minY,
                superBlock.maxY,
                query
            );
            if (sbLowerBound > bestDist) {
                continue;
            }

            for (const leaf of superBlock.leafBlocks) {
                if (!leaf.hasValid) continue;
                const leafLowerBound = this.#rectDistance(leaf.minX, leaf.maxX, leaf.minY, leaf.maxY, query);
                if (leafLowerBound > bestDist) {
                    continue;
                }

                for (let i = leaf.start; i < leaf.end; i++) {
                    if (!this.#source.isValid(i)) continue;
                    const px = mapX(this.#source.getX(i));
                    const py = mapY(this.#source.getY(i));
                    if (px === undefined || py === undefined || !Number.isFinite(px) || !Number.isFinite(py)) {
                        continue;
                    }

                    const dx = px - pixel.x;
                    const dy = py - pixel.y;
                    let dist = 0;
                    let secDist = 0;

                    if (dimension === "x") {
                        dist = Math.abs(dx);
                        secDist = Math.abs(dy);
                    } else if (dimension === "y") {
                        dist = Math.abs(dy);
                        secDist = Math.abs(dx);
                    } else {
                        dist = dx * dx + dy * dy;
                        secDist = 0;
                    }

                    if (
                        dist < bestDist ||
                        (Math.abs(dist - bestDist) < 1e-9 &&
                            (secDist < bestSecDist || (Math.abs(secDist - bestSecDist) < 1e-9 && i < bestIdx)))
                    ) {
                        bestDist = dist;
                        bestSecDist = secDist;
                        bestIdx = i;
                    }
                }
            }
        }

        return bestIdx >= 0 ? bestIdx : null;
    }

    #rectDistance(minX: number, maxX: number, minY: number, maxY: number, query: DenseGeometryQuery): number {
        const { dimension, mapX, mapY, pixel } = query;
        const pxA = mapX(minX);
        const pxB = mapX(maxX);
        const pyA = mapY(minY);
        const pyB = mapY(maxY);
        if (pxA === undefined || pxB === undefined || pyA === undefined || pyB === undefined) {
            return 0;
        }
        const minPxX = Math.min(pxA, pxB);
        const maxPxX = Math.max(pxA, pxB);
        const minPxY = Math.min(pyA, pyB);
        const maxPxY = Math.max(pyA, pyB);

        const dx = Math.max(minPxX - pixel.x, 0, pixel.x - maxPxX);
        const dy = Math.max(minPxY - pixel.y, 0, pixel.y - maxPxY);

        if (dimension === "x") {
            return dx;
        }
        if (dimension === "y") {
            return dy;
        }
        return dx * dx + dy * dy;
    }
}

export class DenseSegmentGeometryIndex {
    readonly #source: DenseSegmentDataSource;
    readonly #superBlocks: readonly SuperBlock[];

    public constructor(source: DenseSegmentDataSource) {
        this.#source = source;
        const n = source.count;
        const leafBlocks: LeafBlock[] = [];

        for (let start = 0; start < n; start += BLOCK_SIZE) {
            const end = Math.min(n, start + BLOCK_SIZE);
            let minX = Number.POSITIVE_INFINITY;
            let maxX = Number.NEGATIVE_INFINITY;
            let minY = Number.POSITIVE_INFINITY;
            let maxY = Number.NEGATIVE_INFINITY;
            let hasValid = false;

            for (let i = start; i < end; i++) {
                if (!source.isValid(i)) continue;
                const x = source.getX(i);
                const lowY = source.getLowY(i);
                const highY = source.getHighY(i);
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                const mn = Math.min(lowY, highY);
                const mx = Math.max(lowY, highY);
                if (mn < minY) minY = mn;
                if (mx > maxY) maxY = mx;
                hasValid = true;
            }

            leafBlocks.push({
                end,
                hasValid,
                maxX: hasValid ? maxX : 0,
                maxY: hasValid ? maxY : 0,
                minX: hasValid ? minX : 0,
                minY: hasValid ? minY : 0,
                start
            });
        }

        const superBlocks: SuperBlock[] = [];
        for (let i = 0; i < leafBlocks.length; i += SUPER_BLOCK_SIZE) {
            const chunk = leafBlocks.slice(i, i + SUPER_BLOCK_SIZE);
            let minX = Number.POSITIVE_INFINITY;
            let maxX = Number.NEGATIVE_INFINITY;
            let minY = Number.POSITIVE_INFINITY;
            let maxY = Number.NEGATIVE_INFINITY;
            let anyValid = false;

            for (const b of chunk) {
                if (!b.hasValid) continue;
                if (b.minX < minX) minX = b.minX;
                if (b.maxX > maxX) maxX = b.maxX;
                if (b.minY < minY) minY = b.minY;
                if (b.maxY > maxY) maxY = b.maxY;
                anyValid = true;
            }

            superBlocks.push({
                leafBlocks: chunk,
                maxX: anyValid ? maxX : 0,
                maxY: anyValid ? maxY : 0,
                minX: anyValid ? minX : 0,
                minY: anyValid ? minY : 0
            });
        }

        this.#superBlocks = superBlocks;
    }

    public resolveNearest(query: DenseGeometryQuery): number | null {
        const { dimension, mapX, mapY, pixel } = query;
        let bestIdx = -1;
        let bestDist = Number.POSITIVE_INFINITY;
        let bestSecDist = Number.POSITIVE_INFINITY;

        for (const superBlock of this.#superBlocks) {
            const sbLowerBound = this.#rectDistance(
                superBlock.minX,
                superBlock.maxX,
                superBlock.minY,
                superBlock.maxY,
                query
            );
            if (sbLowerBound > bestDist) {
                continue;
            }

            for (const leaf of superBlock.leafBlocks) {
                if (!leaf.hasValid) continue;
                const leafLowerBound = this.#rectDistance(leaf.minX, leaf.maxX, leaf.minY, leaf.maxY, query);
                if (leafLowerBound > bestDist) {
                    continue;
                }

                for (let i = leaf.start; i < leaf.end; i++) {
                    if (!this.#source.isValid(i)) continue;
                    const px = mapX(this.#source.getX(i));
                    const pyLow = mapY(this.#source.getLowY(i));
                    const pyHigh = mapY(this.#source.getHighY(i));
                    if (
                        px === undefined ||
                        pyLow === undefined ||
                        pyHigh === undefined ||
                        !Number.isFinite(px) ||
                        !Number.isFinite(pyLow) ||
                        !Number.isFinite(pyHigh)
                    ) {
                        continue;
                    }

                    const minY = Math.min(pyLow, pyHigh);
                    const maxY = Math.max(pyLow, pyHigh);
                    const dx = px - pixel.x;
                    const dy = pixel.y < minY ? minY - pixel.y : pixel.y > maxY ? pixel.y - maxY : 0;

                    let dist = 0;
                    let secDist = 0;

                    if (dimension === "x") {
                        dist = Math.abs(dx);
                        secDist = Math.abs(dy);
                    } else if (dimension === "y") {
                        dist = Math.abs(dy);
                        secDist = Math.abs(dx);
                    } else {
                        dist = dx * dx + dy * dy;
                        secDist = 0;
                    }

                    if (
                        dist < bestDist ||
                        (Math.abs(dist - bestDist) < 1e-9 &&
                            (secDist < bestSecDist || (Math.abs(secDist - bestSecDist) < 1e-9 && i < bestIdx)))
                    ) {
                        bestDist = dist;
                        bestSecDist = secDist;
                        bestIdx = i;
                    }
                }
            }
        }

        return bestIdx >= 0 ? bestIdx : null;
    }

    #rectDistance(minX: number, maxX: number, minY: number, maxY: number, query: DenseGeometryQuery): number {
        const { dimension, mapX, mapY, pixel } = query;
        const pxA = mapX(minX);
        const pxB = mapX(maxX);
        const pyA = mapY(minY);
        const pyB = mapY(maxY);
        if (pxA === undefined || pxB === undefined || pyA === undefined || pyB === undefined) {
            return 0;
        }
        const minPxX = Math.min(pxA, pxB);
        const maxPxX = Math.max(pxA, pxB);
        const minPxY = Math.min(pyA, pyB);
        const maxPxY = Math.max(pyA, pyB);

        const dx = Math.max(minPxX - pixel.x, 0, pixel.x - maxPxX);
        const dy = Math.max(minPxY - pixel.y, 0, pixel.y - maxPxY);

        if (dimension === "x") {
            return dx;
        }
        if (dimension === "y") {
            return dy;
        }
        return dx * dx + dy * dy;
    }
}
