import type {
    ChartBubbleSeriesRegistration,
    ChartScatterSeriesRegistration
} from "../context/chart-registration-context";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { createBubbleRadiusScale, normalizeBubbleRadiusRange } from "../scale/bubble-size-scale";
import { isFiniteNumber, normalizeMarkerRadius } from "../utils/number-utils";

export interface CartesianMarkerGeometry {
    readonly bubbleMaxRadius: number;
    readonly bubbleMinRadius: number;
    readonly bubbleRadiusScale: ((val: number) => number) | null;
    readonly maxVisualRadius: number;
    readonly scatterRadius: number;
}

export interface ResolveCartesianMarkerGeometryOptions {
    readonly bubbleSizeDomain?: readonly [number, number];
    readonly series: ChartScatterSeriesRegistration | ChartBubbleSeriesRegistration;
    readonly styleResolver: ChartStyleResolver;
}

export function resolveCartesianMarkerGeometry(
    options: ResolveCartesianMarkerGeometryOptions
): CartesianMarkerGeometry {
    const { bubbleSizeDomain = [1, 1], series, styleResolver } = options;
    const isBubble = series.type === "bubble";
    const cssGeometry = styleResolver.resolveMarkerSeriesGeometry(series);

    let bubbleScale: ((val: number) => number) | null = null;
    let normalizedMinRadius = 4;
    let normalizedMaxRadius = 24;

    if (isBubble) {
        const bSeries = series as ChartBubbleSeriesRegistration;
        const explicitMin = bSeries.minRadius?.();
        const explicitMax = bSeries.maxRadius?.();
        const rawMin =
            explicitMin !== undefined && isFiniteNumber(explicitMin) ? explicitMin : (cssGeometry.bubbleMinRadius ?? 4);
        const rawMax =
            explicitMax !== undefined && isFiniteNumber(explicitMax)
                ? explicitMax
                : (cssGeometry.bubbleMaxRadius ?? 24);
        const range = normalizeBubbleRadiusRange(rawMin, rawMax);
        normalizedMinRadius = range.minRadius;
        normalizedMaxRadius = range.maxRadius;
        bubbleScale = createBubbleRadiusScale(bubbleSizeDomain, [range.minRadius, range.maxRadius]);
    }

    const scatterSeries = !isBubble ? (series as ChartScatterSeriesRegistration) : undefined;
    const explicitScatterRadius = scatterSeries?.pointRadius?.();
    const rawScatterRadius =
        explicitScatterRadius !== undefined && isFiniteNumber(explicitScatterRadius)
            ? explicitScatterRadius
            : (cssGeometry.pointRadius ?? 4);
    const scatterRadius = normalizeMarkerRadius(rawScatterRadius, 4, 1, 100);

    const maxVisualRadius = isBubble ? normalizedMaxRadius : scatterRadius;

    return {
        bubbleMaxRadius: normalizedMaxRadius,
        bubbleMinRadius: normalizedMinRadius,
        bubbleRadiusScale: bubbleScale,
        maxVisualRadius,
        scatterRadius
    };
}
