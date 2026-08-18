import type { ChartPoint, ChartRect } from "../../models/chart.models";
import type { ChartFunnelOrientation } from "../../models/chart-funnel.models";
import type { SceneHitTarget } from "../scene/scene-geometry";
import type { SceneFunnelStage } from "../scene/funnel-scene";

export function isPointInConvexPolygon(point: ChartPoint, vertices: readonly ChartPoint[]): boolean {
    if (vertices.length < 3) {
        return false;
    }

    let positive = false;
    let negative = false;

    for (let i = 0; i < vertices.length; i++) {
        const v1 = vertices[i];
        const v2 = vertices[(i + 1) % vertices.length];

        const cross = (v2.x - v1.x) * (point.y - v1.y) - (v2.y - v1.y) * (point.x - v1.x);

        if (cross > 1e-7) {
            positive = true;
        }
        if (cross < -1e-7) {
            negative = true;
        }

        if (positive && negative) {
            return false;
        }
    }

    return true;
}

export class FunnelHitIndex {
    public constructor(
        public readonly plotRect: ChartRect,
        public readonly orientation: ChartFunnelOrientation,
        public readonly slotSpan: number,
        public readonly gap: number,
        public readonly stages: readonly SceneFunnelStage[],
        public readonly hitTargets: readonly SceneHitTarget[]
    ) {}

    public query(point: ChartPoint): SceneHitTarget | null {
        if (
            point.x < this.plotRect.x ||
            point.x > this.plotRect.x + this.plotRect.width ||
            point.y < this.plotRect.y ||
            point.y > this.plotRect.y + this.plotRect.height
        ) {
            return null;
        }

        const step = this.slotSpan + this.gap;
        if (step <= 0 || this.stages.length === 0) {
            return null;
        }

        const offset = this.orientation === "vertical" ? point.y - this.plotRect.y : point.x - this.plotRect.x;
        const slotIdx = Math.floor(offset / step);

        if (slotIdx < 0 || slotIdx >= this.stages.length) {
            return null;
        }

        const inSlotOffset = offset - slotIdx * step;
        if (inSlotOffset > this.slotSpan) {
            return null; // Inside the gap between stages
        }

        const stage = this.stages[slotIdx];
        if (!stage || stage.bounds.width <= 0 || stage.bounds.height <= 0) {
            return null;
        }

        if (isPointInConvexPolygon(point, stage.polygon)) {
            return this.hitTargets[slotIdx] ?? null;
        }

        return null;
    }
}
