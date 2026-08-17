import { scaleLinear } from "d3-scale";
import { isFiniteNumber } from "../utils/number-utils";
import { normalizeContinuousNumericDomain } from "./chart-domain";

export interface ResolvedRadialDomain {
    domain: readonly [number, number];
    isZeroCrossed: boolean;
    ticks: readonly number[];
}

export function computeRadialDomain(
    values: readonly number[],
    options?: {
        explicitMax?: number;
        explicitMin?: number;
        nice?: boolean;
        tickCount?: number;
    }
): ResolvedRadialDomain {
    const explicitMin = isFiniteNumber(options?.explicitMin) ? (options!.explicitMin as number) : undefined;
    const explicitMax = isFiniteNumber(options?.explicitMax) ? (options!.explicitMax as number) : undefined;
    const shouldNice = options?.nice ?? true;
    const tickCount = options?.tickCount ?? 5;

    const finiteValues = values.filter(v => isFiniteNumber(v));

    let observedMin = 0;
    let observedMax = 1;

    if (finiteValues.length > 0) {
        const valMin = Math.min(...finiteValues);
        const valMax = Math.max(...finiteValues);
        observedMin = Math.min(valMin, 0);
        observedMax = Math.max(valMax, 0);
    }

    const normalized = normalizeContinuousNumericDomain(observedMin, observedMax, explicitMin, explicitMax);
    let [min, max] = normalized.domain;

    let scale = scaleLinear().domain([min, max]);

    if (shouldNice) {
        scale = scale.nice(tickCount);
        const [niceMin, niceMax] = scale.domain();
        min = normalized.explicitMin ? min : niceMin;
        max = normalized.explicitMax ? max : niceMax;
        scale = scaleLinear().domain([min, max]);
    }

    const ticks = scale.ticks(tickCount);
    // Ensure min and max ticks or relevant ticks are available
    if (ticks.length === 0) {
        ticks.push(min, max);
    }

    const isZeroCrossed = min < 0 && max > 0;

    return {
        domain: [min, max],
        isZeroCrossed,
        ticks
    };
}
