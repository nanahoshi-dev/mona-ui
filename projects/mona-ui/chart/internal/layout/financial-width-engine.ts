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
        const {
            bandwidth,
            explicitBodyWidth,
            explicitBodyWidthRatio,
            explicitMaxBodyWidth,
            markPixelXCoordinates,
            plotWidth
        } = options;

        const maxBodyWidth = isFiniteNumber(explicitMaxBodyWidth) && (explicitMaxBodyWidth as number) > 0
            ? (explicitMaxBodyWidth as number)
            : 32;

        if (isFiniteNumber(explicitBodyWidth) && (explicitBodyWidth as number) > 0) {
            return clamp(explicitBodyWidth as number, 2, maxBodyWidth);
        }

        const rawRatio = isFiniteNumber(explicitBodyWidthRatio) ? (explicitBodyWidthRatio as number) : 0.7;
        const widthRatio = clamp(rawRatio, 0.05, 1.0);

        // 1. Band / category scale bandwidth available
        if (isFiniteNumber(bandwidth) && (bandwidth as number) > 0) {
            const candidate = (bandwidth as number) * widthRatio;
            return clamp(candidate, 2, maxBodyWidth);
        }

        // 2. Continuous scale (Linear, Time, UTC)
        if (!markPixelXCoordinates || markPixelXCoordinates.length <= 1) {
            const fallbackWidth = Math.min(maxBodyWidth, Math.max(4, plotWidth * 0.05));
            return clamp(fallbackWidth, 2, maxBodyWidth);
        }

        const distinctX = Array.from(new Set(markPixelXCoordinates.filter(x => Number.isFinite(x)))).sort(
            (a, b) => a - b
        );

        if (distinctX.length <= 1) {
            const fallbackWidth = Math.min(maxBodyWidth, Math.max(4, plotWidth * 0.05));
            return clamp(fallbackWidth, 2, maxBodyWidth);
        }

        let minSpacing = Number.POSITIVE_INFINITY;
        for (let i = 1; i < distinctX.length; i++) {
            const diff = distinctX[i] - distinctX[i - 1];
            if (diff > 0 && diff < minSpacing) {
                minSpacing = diff;
            }
        }

        if (!Number.isFinite(minSpacing) || minSpacing <= 0) {
            const fallbackWidth = Math.min(maxBodyWidth, Math.max(4, plotWidth * 0.05));
            return clamp(fallbackWidth, 2, maxBodyWidth);
        }

        const candidate = minSpacing * widthRatio;
        return clamp(candidate, 2, maxBodyWidth);
    }
}
