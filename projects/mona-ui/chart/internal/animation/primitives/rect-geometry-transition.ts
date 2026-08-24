import type { ChartRect } from "../../../models/chart.models";

export class RectGeometryTransition {
    public static interpolate(fromRect: ChartRect, toRect: ChartRect, progress: number): ChartRect {
        const p = Math.max(0, Math.min(1, progress));
        return {
            height: fromRect.height + (toRect.height - fromRect.height) * p,
            width: fromRect.width + (toRect.width - fromRect.width) * p,
            x: fromRect.x + (toRect.x - fromRect.x) * p,
            y: fromRect.y + (toRect.y - fromRect.y) * p
        };
    }

    public static interpolateRadius(fromRadius: number, toRadius: number, progress: number): number {
        const p = Math.max(0, Math.min(1, progress));
        return fromRadius + (toRadius - fromRadius) * p;
    }
}
