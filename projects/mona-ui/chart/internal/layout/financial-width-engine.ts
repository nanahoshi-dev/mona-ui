import { clamp, isFiniteNumber, normalizeNonNegativeNumber } from "../utils/number-utils";

export interface FinancialWidthOptions {
    readonly bandwidth?: number;
    readonly explicitBodyWidth?: number;
    readonly explicitBodyWidthRatio?: number;
    readonly explicitMaxBodyWidth?: number;
    readonly markPixelXCoordinates?: readonly number[];
    readonly plotWidth: number;
}

export class FinancialWidthEngine {
    public static resolveBodyWidth(options: FinancialWidthOptions): number {
        const widths = this.resolveBodyWidths(options);
        if (widths.length === 0) {
            const maxBodyWidth = isFiniteNumber(options.explicitMaxBodyWidth) && (options.explicitMaxBodyWidth as number) > 0
                ? (options.explicitMaxBodyWidth as number)
                : 32;
            return clamp(16, 2, maxBodyWidth);
        }
        return widths[0];
    }

    public static resolveBodyWidths(options: FinancialWidthOptions): readonly number[] {
        const {
            bandwidth,
            explicitBodyWidth,
            explicitBodyWidthRatio,
            explicitMaxBodyWidth,
            markPixelXCoordinates,
            plotWidth
        } = options;

        const maxBodyWidth = isFiniteNumber(explicitMaxBodyWidth) && (explicitMaxBodyWidth as number) > 0
            ? Math.max(2, explicitMaxBodyWidth as number)
            : 32;

        if (isFiniteNumber(explicitBodyWidth) && (explicitBodyWidth as number) > 0) {
            const width = clamp(explicitBodyWidth as number, 2, maxBodyWidth);
            const count = markPixelXCoordinates?.length ?? 1;
            return Array.from({ length: count }, () => width);
        }

        const rawRatio = isFiniteNumber(explicitBodyWidthRatio) ? (explicitBodyWidthRatio as number) : 0.7;
        const widthRatio = clamp(rawRatio, 0.05, 1.0);

        // 1. Band / category scale bandwidth available
        if (isFiniteNumber(bandwidth) && (bandwidth as number) > 0) {
            const candidate = (bandwidth as number) * widthRatio;
            const width = clamp(candidate, 2, maxBodyWidth);
            const count = markPixelXCoordinates?.length ?? 1;
            return Array.from({ length: count }, () => width);
        }

        // 2. Continuous scale (Linear, Time, UTC)
        const count = markPixelXCoordinates?.length ?? 0;
        if (count === 0) {
            return [];
        }

        const fallbackWidth = clamp(Math.min(maxBodyWidth, Math.max(4, plotWidth * 0.05)), 2, maxBodyWidth);

        if (count === 1) {
            return [fallbackWidth];
        }

        const indexedCoords = markPixelXCoordinates!.map((x, index) => ({ index, x }));
        indexedCoords.sort((a, b) => a.x - b.x);

        const result = new Array<number>(count);

        for (let k = 0; k < count; k++) {
            const curr = indexedCoords[k];
            let prevGap = Number.POSITIVE_INFINITY;
            let nextGap = Number.POSITIVE_INFINITY;

            if (k > 0) {
                const diff = curr.x - indexedCoords[k - 1].x;
                if (diff > 0) {
                    prevGap = diff;
                }
            }
            if (k < count - 1) {
                const diff = indexedCoords[k + 1].x - curr.x;
                if (diff > 0) {
                    nextGap = diff;
                }
            }

            const localSpacing = Math.min(prevGap, nextGap);

            if (!Number.isFinite(localSpacing) || localSpacing <= 0) {
                result[curr.index] = fallbackWidth;
            } else {
                result[curr.index] = clamp(localSpacing * widthRatio, 2, maxBodyWidth);
            }
        }

        return result;
    }
}
