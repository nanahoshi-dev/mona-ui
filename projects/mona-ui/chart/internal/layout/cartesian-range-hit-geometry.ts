import { normalizeNonNegativeNumber } from "../utils/number-utils";

export interface RangeAreaHitGeometry {
    readonly hitRadius: number;
    readonly visualRadius: number;
}

export function resolveRangeAreaHitGeometry(showPoints: boolean, pointRadius: number): RangeAreaHitGeometry {
    const visualRadius = showPoints ? normalizeNonNegativeNumber(pointRadius, 0) : 0;
    return {
        hitRadius: showPoints ? Math.max(16, visualRadius + 4) : 16,
        visualRadius
    };
}
