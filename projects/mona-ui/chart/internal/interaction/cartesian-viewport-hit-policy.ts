import type { ChartPoint, ChartRect } from "../../models/chart.models";
import type { SceneHitTarget } from "../scene/scene-geometry";

export class CartesianViewportHitPolicy {
    public static doesRectIntersectPlot(rect: ChartRect, plotRect: ChartRect, tolerance = 2): boolean {
        const rLeft = rect.x;
        const rRight = rect.x + rect.width;
        const rTop = rect.y;
        const rBottom = rect.y + rect.height;

        const pLeft = plotRect.x - tolerance;
        const pRight = plotRect.x + plotRect.width + tolerance;
        const pTop = plotRect.y - tolerance;
        const pBottom = plotRect.y + plotRect.height + tolerance;

        return !(rRight < pLeft || rLeft > pRight || rBottom < pTop || rTop > pBottom);
    }

    public static filterVisibleHitTargets(
        targets: readonly SceneHitTarget[],
        plotRect: ChartRect
    ): readonly SceneHitTarget[] {
        return targets.filter(t => this.isHitTargetVisible(t, plotRect));
    }

    public static isHitTargetVisible(target: SceneHitTarget, plotRect: ChartRect): boolean {
        if (target.bounds) {
            return this.doesRectIntersectPlot(target.bounds, plotRect);
        }
        if (target.point) {
            const radius = Math.max(target.radius ?? 6, target.visualRadius ?? 4);
            return this.isPointInPlot(target.point, plotRect, radius);
        }
        return true;
    }

    public static isPointInPlot(point: ChartPoint, plotRect: ChartRect, tolerance = 4): boolean {
        return (
            point.x >= plotRect.x - tolerance &&
            point.x <= plotRect.x + plotRect.width + tolerance &&
            point.y >= plotRect.y - tolerance &&
            point.y <= plotRect.y + plotRect.height + tolerance
        );
    }
}
