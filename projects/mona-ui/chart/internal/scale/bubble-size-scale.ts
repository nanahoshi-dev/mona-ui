import { scaleSqrt } from "d3-scale";
import { isFiniteNumber } from "../utils/number-utils";

export interface NormalizedBubbleRadiusRange {
    readonly maxRadius: number;
    readonly minRadius: number;
}

export function normalizeBubbleRadiusRange(
    rawMin: number | undefined,
    rawMax: number | undefined
): NormalizedBubbleRadiusRange {
    let min = isFiniteNumber(rawMin) ? Math.max(1, Math.min(100, rawMin as number)) : 4;
    let max = isFiniteNumber(rawMax) ? Math.max(1, Math.min(100, rawMax as number)) : 24;

    if (min > max) {
        const temp = min;
        min = max;
        max = temp;
    }

    return { maxRadius: max, minRadius: min };
}

export function createBubbleRadiusScale(
    domain: readonly [number, number],
    range: readonly [number, number]
): (value: number) => number {
    const minVal = Math.min(domain[0], domain[1]);
    const maxVal = Math.max(domain[0], domain[1]);
    const minRadius = Math.min(range[0], range[1]);
    const maxRadius = Math.max(range[0], range[1]);

    if (!Number.isFinite(minVal) || !Number.isFinite(maxVal) || minVal <= 0 || maxVal <= 0) {
        const midRadius = (minRadius + maxRadius) / 2;
        return () => midRadius;
    }

    if (minVal === maxVal) {
        const midRadius = (minRadius + maxRadius) / 2;
        return () => midRadius;
    }

    const d3Scale = scaleSqrt()
        .domain([minVal, maxVal])
        .range([minRadius, maxRadius])
        .clamp(true);

    return (val: number) => {
        if (!isFiniteNumber(val) || val <= 0) {
            return 0;
        }
        return d3Scale(val);
    };
}
