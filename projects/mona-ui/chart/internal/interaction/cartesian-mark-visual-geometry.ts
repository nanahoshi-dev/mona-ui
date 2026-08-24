import type { ChartPoint, ChartRect } from "../../models/chart.models";
import type { SceneHitTarget } from "../scene/scene-geometry";

export class CartesianMarkVisualGeometry {
    public static getVisualBounds(hit: SceneHitTarget): ChartRect | null {
        if (hit.visualBounds) {
            return hit.visualBounds;
        }
        if (hit.bounds) {
            return hit.bounds;
        }
        if (hit.highPoint && hit.lowPoint) {
            const minX = Math.min(hit.highPoint.x, hit.lowPoint.x);
            const maxX = Math.max(hit.highPoint.x, hit.lowPoint.x);
            const minY = Math.min(hit.highPoint.y, hit.lowPoint.y);
            const maxY = Math.max(hit.highPoint.y, hit.lowPoint.y);
            return {
                height: Math.max(1, maxY - minY),
                width: Math.max(1, maxX - minX),
                x: minX,
                y: minY
            };
        }
        if (hit.point) {
            const r = CartesianMarkVisualGeometry.getVisualRadius(hit, 0);
            return {
                height: Math.max(1, r * 2),
                width: Math.max(1, r * 2),
                x: hit.point.x - r,
                y: hit.point.y - r
            };
        }
        return null;
    }

    public static getVisualCenter(hit: SceneHitTarget): ChartPoint {
        if (hit.point) {
            return hit.point;
        }
        if (hit.highPoint && hit.lowPoint) {
            return {
                x: (hit.highPoint.x + hit.lowPoint.x) / 2,
                y: (hit.highPoint.y + hit.lowPoint.y) / 2
            };
        }
        if (hit.visualBounds) {
            return {
                x: hit.visualBounds.x + hit.visualBounds.width / 2,
                y: hit.visualBounds.y + hit.visualBounds.height / 2
            };
        }
        if (hit.bounds) {
            return {
                x: hit.bounds.x + hit.bounds.width / 2,
                y: hit.bounds.y + hit.bounds.height / 2
            };
        }
        return { x: 0, y: 0 };
    }

    public static getVisualRadius(hit: SceneHitTarget, defaultPointRadius: number = 0): number {
        if (hit.visualRadius !== undefined && Number.isFinite(hit.visualRadius)) {
            return hit.visualRadius;
        }
        if (hit.seriesType === "bubble" || hit.seriesType === "scatter") {
            return hit.visualRadius ?? 4;
        }
        if (hit.seriesType === "line" || hit.seriesType === "area") {
            return hit.visualRadius ?? defaultPointRadius;
        }
        return 0;
    }
}
