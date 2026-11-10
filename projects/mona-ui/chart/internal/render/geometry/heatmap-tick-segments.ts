import type { ChartRect } from "../../../models/chart.models";
import type { ChartAxisScene } from "../../scene/cartesian-scene";

/** A straight tick mark, from the plot edge outward. */
export interface HeatmapTickSegment {
    readonly x1: number;
    readonly x2: number;
    readonly y1: number;
    readonly y2: number;
}

/**
 * Lists the tick marks of a heatmap's axes. A heatmap's axes sit on the plot's edges, so each tick starts at the edge
 * and runs `tickSize` pixels outward, centered on its category.
 */
export function buildHeatmapTickSegments(axes: readonly ChartAxisScene[], plotRect: ChartRect): HeatmapTickSegment[] {
    const segments: HeatmapTickSegment[] = [];
    for (const axis of axes) {
        if (!axis.visible || !axis.tickMarks) {
            continue;
        }
        const size = axis.tickSize ?? 6;
        if (axis.axis === "x") {
            const top = axis.position === "top";
            const edge = top ? plotRect.y : plotRect.y + plotRect.height;
            const end = top ? edge - size : edge + size;
            for (const tick of axis.ticks) {
                segments.push({ x1: tick.coordinate, x2: tick.coordinate, y1: edge, y2: end });
            }
        } else {
            const right = axis.position === "right";
            const edge = right ? plotRect.x + plotRect.width : plotRect.x;
            const end = right ? edge + size : edge - size;
            for (const tick of axis.ticks) {
                segments.push({ x1: edge, x2: end, y1: tick.coordinate, y2: tick.coordinate });
            }
        }
    }
    return segments;
}
