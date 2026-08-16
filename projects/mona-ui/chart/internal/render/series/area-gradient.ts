import { formatRgb, parse } from "culori";
import type { ScenePoint } from "../../scene/scene-geometry";
import { clamp } from "../../utils/number-utils";

export interface AreaGradientStop {
    readonly color: string;
    readonly offset: number;
}

export interface AreaGradientSpec {
    readonly endY: number;
    readonly startY: number;
    readonly stops: readonly AreaGradientStop[];
}

export const MIXED_BASELINE_OPACITY_RATIO = 0.25;

export function withAlpha(color: string, alpha: number): string {
    if (!color) {
        return `rgba(0, 0, 0, ${clamp(alpha, 0, 1)})`;
    }
    const parsed = parse(color);
    if (parsed) {
        const clampedAlpha = clamp(alpha, 0, 1);
        return formatRgb({ ...parsed, alpha: clampedAlpha }) || `rgba(0, 0, 0, ${clampedAlpha})`;
    }
    return `rgba(0, 0, 0, ${clamp(alpha, 0, 1)})`;
}

export function createAreaGradientSpec(
    baselineY: number,
    definedPoints: readonly ScenePoint[],
    fillColor: string,
    fillOpacity: number
): AreaGradientSpec | null {
    if (definedPoints.length < 2) {
        return null;
    }

    let minY = definedPoints[0].y;
    let maxY = definedPoints[0].y;
    for (let i = 1; i < definedPoints.length; i++) {
        const py = definedPoints[i].y;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
    }

    // Degenerate nearly-zero gradient height
    if (Math.abs(maxY - minY) <= 1) {
        return null;
    }

    // In Canvas pixel space, Y grows downward:
    // point.y < baselineY => visually above zero baseline (positive value)
    // point.y > baselineY => visually below zero baseline (negative value)
    const hasPositiveRegion = definedPoints.some(p => p.y < baselineY - 0.5);
    const hasNegativeRegion = definedPoints.some(p => p.y > baselineY + 0.5);

    // All points are on the baseline
    if (!hasPositiveRegion && !hasNegativeRegion) {
        return null;
    }

    const normalizedOpacity = clamp(fillOpacity, 0, 1);

    // Case 1: Positive-only data (all points at or above baseline)
    if (hasPositiveRegion && !hasNegativeRegion) {
        return {
            startY: minY,
            endY: baselineY,
            stops: [
                { offset: 0, color: withAlpha(fillColor, normalizedOpacity) },
                { offset: 1, color: withAlpha(fillColor, 0) }
            ]
        };
    }

    // Case 2: Negative-only data (all points at or below baseline)
    if (!hasPositiveRegion && hasNegativeRegion) {
        return {
            startY: baselineY,
            endY: maxY,
            stops: [
                { offset: 0, color: withAlpha(fillColor, 0) },
                { offset: 1, color: withAlpha(fillColor, normalizedOpacity) }
            ]
        };
    }

    // Case 3: Mixed-sign data (points exist both above and below baseline)
    const span = maxY - minY;
    const baselineOffset = span > 0 ? clamp((baselineY - minY) / span, 0, 1) : 0.5;
    const baselineAlpha = normalizedOpacity * MIXED_BASELINE_OPACITY_RATIO;

    return {
        startY: minY,
        endY: maxY,
        stops: [
            { offset: 0, color: withAlpha(fillColor, normalizedOpacity) },
            { offset: baselineOffset, color: withAlpha(fillColor, baselineAlpha) },
            { offset: 1, color: withAlpha(fillColor, normalizedOpacity) }
        ]
    };
}
