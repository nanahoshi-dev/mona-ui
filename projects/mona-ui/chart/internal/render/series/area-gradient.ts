import { formatRgb, parse } from "culori";
import type { SceneAreaPoint, ScenePoint } from "../../scene/scene-geometry";
import { clamp } from "../../utils/number-utils";

export interface AreaGradientStop {
    readonly color: string;
    readonly offset: number;
}

export interface AreaGradientSpec {
    readonly endPos: number;
    readonly endX?: number;
    readonly endY?: number;
    readonly startPos: number;
    readonly startX?: number;
    readonly startY?: number;
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
    baselineValue: number,
    definedPoints: readonly (SceneAreaPoint | ScenePoint)[],
    fillColor: string,
    fillOpacity: number,
    direction: "x" | "y" = "y"
): AreaGradientSpec | null {
    if (definedPoints.length < 2) {
        return null;
    }

    if (direction === "x") {
        let minX = definedPoints[0].x;
        let maxX = definedPoints[0].x;
        let minBaseX = (definedPoints[0] as SceneAreaPoint).baseX ?? baselineValue;
        let maxBaseX = minBaseX;

        for (let i = 1; i < definedPoints.length; i++) {
            const px = definedPoints[i].x;
            const bx = (definedPoints[i] as SceneAreaPoint).baseX ?? baselineValue;
            if (px < minX) minX = px;
            if (px > maxX) maxX = px;
            if (bx < minBaseX) minBaseX = bx;
            if (bx > maxBaseX) maxBaseX = bx;
        }

        // In horizontal layout, px > baseX => positive (extends to right)
        // px < baseX => negative (extends to left)
        const hasPositiveRegion = definedPoints.some(p => p.x > ((p as SceneAreaPoint).baseX ?? baselineValue) + 0.5);
        const hasNegativeRegion = definedPoints.some(p => p.x < ((p as SceneAreaPoint).baseX ?? baselineValue) - 0.5);

        if (!hasPositiveRegion && !hasNegativeRegion) {
            return null;
        }

        const normalizedOpacity = clamp(fillOpacity, 0, 1);

        if (hasPositiveRegion && !hasNegativeRegion) {
            const startX = minBaseX;
            const endX = maxX;
            if (Math.abs(endX - startX) <= 1) {
                return null;
            }
            return {
                endPos: endX,
                endX,
                startPos: startX,
                startX,
                stops: [
                    { offset: 0, color: withAlpha(fillColor, 0) },
                    { offset: 1, color: withAlpha(fillColor, normalizedOpacity) }
                ]
            };
        }

        if (!hasPositiveRegion && hasNegativeRegion) {
            const startX = minX;
            const endX = maxBaseX;
            if (Math.abs(endX - startX) <= 1) {
                return null;
            }
            return {
                endPos: endX,
                endX,
                startPos: startX,
                startX,
                stops: [
                    { offset: 0, color: withAlpha(fillColor, normalizedOpacity) },
                    { offset: 1, color: withAlpha(fillColor, 0) }
                ]
            };
        }

        const overallMinX = Math.min(minX, minBaseX);
        const overallMaxX = Math.max(maxX, maxBaseX);
        const span = overallMaxX - overallMinX;
        if (span <= 1) {
            return null;
        }
        const baselineOffset = span > 0 ? clamp((baselineValue - overallMinX) / span, 0, 1) : 0.5;
        const baselineAlpha = normalizedOpacity * MIXED_BASELINE_OPACITY_RATIO;

        return {
            endPos: overallMaxX,
            endX: overallMaxX,
            startPos: overallMinX,
            startX: overallMinX,
            stops: [
                { offset: 0, color: withAlpha(fillColor, normalizedOpacity) },
                { offset: baselineOffset, color: withAlpha(fillColor, baselineAlpha) },
                { offset: 1, color: withAlpha(fillColor, normalizedOpacity) }
            ]
        };
    }

    let minY = definedPoints[0].y;
    let maxY = definedPoints[0].y;
    let minBaseY = (definedPoints[0] as SceneAreaPoint).baseY ?? baselineValue;
    let maxBaseY = minBaseY;

    for (let i = 1; i < definedPoints.length; i++) {
        const py = definedPoints[i].y;
        const by = (definedPoints[i] as SceneAreaPoint).baseY ?? baselineValue;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
        if (by < minBaseY) minBaseY = by;
        if (by > maxBaseY) maxBaseY = by;
    }

    // In Canvas pixel space, Y grows downward:
    // point.y < baseY => visually above zero/band baseline (positive value)
    // point.y > baseY => visually below zero/band baseline (negative value)
    const hasPositiveRegion = definedPoints.some(p => p.y < ((p as SceneAreaPoint).baseY ?? baselineValue) - 0.5);
    const hasNegativeRegion = definedPoints.some(p => p.y > ((p as SceneAreaPoint).baseY ?? baselineValue) + 0.5);

    // All points are on the baseline
    if (!hasPositiveRegion && !hasNegativeRegion) {
        return null;
    }

    const normalizedOpacity = clamp(fillOpacity, 0, 1);

    // Case 1: Positive-only data (all points at or above baseline)
    if (hasPositiveRegion && !hasNegativeRegion) {
        const startY = minY;
        const endY = maxBaseY;
        if (Math.abs(endY - startY) <= 1) {
            return null;
        }
        return {
            endPos: endY,
            endY,
            startPos: startY,
            startY,
            stops: [
                { offset: 0, color: withAlpha(fillColor, normalizedOpacity) },
                { offset: 1, color: withAlpha(fillColor, 0) }
            ]
        };
    }

    // Case 2: Negative-only data (all points at or below baseline)
    if (!hasPositiveRegion && hasNegativeRegion) {
        const startY = minBaseY;
        const endY = maxY;
        if (Math.abs(endY - startY) <= 1) {
            return null;
        }
        return {
            endPos: endY,
            endY,
            startPos: startY,
            startY,
            stops: [
                { offset: 0, color: withAlpha(fillColor, 0) },
                { offset: 1, color: withAlpha(fillColor, normalizedOpacity) }
            ]
        };
    }

    // Case 3: Mixed-sign data (points exist both above and below baseline)
    const overallMinY = Math.min(minY, minBaseY);
    const overallMaxY = Math.max(maxY, maxBaseY);
    const span = overallMaxY - overallMinY;
    if (span <= 1) {
        return null;
    }
    const baselineOffset = span > 0 ? clamp((baselineValue - overallMinY) / span, 0, 1) : 0.5;
    const baselineAlpha = normalizedOpacity * MIXED_BASELINE_OPACITY_RATIO;

    return {
        endPos: overallMaxY,
        endY: overallMaxY,
        startPos: overallMinY,
        startY: overallMinY,
        stops: [
            { offset: 0, color: withAlpha(fillColor, normalizedOpacity) },
            { offset: baselineOffset, color: withAlpha(fillColor, baselineAlpha) },
            { offset: 1, color: withAlpha(fillColor, normalizedOpacity) }
        ]
    };
}
