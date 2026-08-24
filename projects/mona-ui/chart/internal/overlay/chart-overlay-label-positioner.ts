import type { ChartPoint, ChartRect } from "../../models/chart.models";
import type { ChartLabelMeasurement } from "../../models/chart-polar.models";

export interface LabelAnchorFraction {
    readonly x: number; // 0 = left, 0.5 = center, 1 = right
    readonly y: number; // 0 = top, 0.5 = center, 1 = bottom
}

export interface PositionOverlayLabelOptions {
    readonly anchorFraction: LabelAnchorFraction;
    readonly containerRect: ChartRect;
    readonly desiredAnchor: ChartPoint;
    readonly measurement?: ChartLabelMeasurement;
    readonly padding?: number;
}

export interface PositionedOverlayLabel {
    readonly anchor: ChartPoint;
    readonly bounds: ChartRect;
    readonly transform: string;
}

export class ChartOverlayLabelPositioner {
    public static position(options: PositionOverlayLabelOptions): PositionedOverlayLabel {
        const { anchorFraction, containerRect, desiredAnchor, measurement, padding = 0 } = options;

        const w = measurement?.width ?? 40;
        const h = measurement?.height ?? 20;
        const fx = anchorFraction.x;
        const fy = anchorFraction.y;

        const minX = containerRect.x + w * fx + padding;
        const maxX = containerRect.x + containerRect.width - w * (1 - fx) - padding;
        const minY = containerRect.y + h * fy + padding;
        const maxY = containerRect.y + containerRect.height - h * (1 - fy) - padding;

        const clampedX = Math.max(minX, Math.min(Math.max(minX, maxX), desiredAnchor.x));
        const clampedY = Math.max(minY, Math.min(Math.max(minY, maxY), desiredAnchor.y));

        const transformX = fx === 0 ? "0%" : fx === 0.5 ? "-50%" : "-100%";
        const transformY = fy === 0 ? "0%" : fy === 0.5 ? "-50%" : "-100%";
        const transform = `translate(${transformX}, ${transformY})`;

        const left = clampedX - w * fx;
        const top = clampedY - h * fy;
        const bounds: ChartRect = {
            height: h,
            width: w,
            x: left,
            y: top
        };

        return {
            anchor: { x: clampedX, y: clampedY },
            bounds,
            transform
        };
    }
}
