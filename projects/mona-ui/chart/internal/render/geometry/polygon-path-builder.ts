import type { ChartPoint } from "../../../models/chart.models";

export function buildPolygonPath(points: readonly ChartPoint[]): string {
    if (points.length === 0) {
        return "";
    }
    const [first, ...rest] = points;
    const parts = [`M ${first.x} ${first.y}`];
    for (const pt of rest) {
        parts.push(`L ${pt.x} ${pt.y}`);
    }
    parts.push("Z");
    return parts.join(" ");
}

export function buildPolylinePath(points: readonly ChartPoint[]): string {
    if (points.length === 0) {
        return "";
    }
    const [first, ...rest] = points;
    const parts = [`M ${first.x} ${first.y}`];
    for (const pt of rest) {
        parts.push(`L ${pt.x} ${pt.y}`);
    }
    return parts.join(" ");
}
