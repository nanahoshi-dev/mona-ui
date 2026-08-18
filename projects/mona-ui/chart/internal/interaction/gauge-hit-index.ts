import type { ChartPoint } from "../../models/chart.models";
import type { PolarArcHitIndex } from "../scene/polar-arc-scene";
import type { SceneHitTarget } from "../scene/scene-geometry";
import { isAngleInsideArc, normalizeAngle } from "../utils/angle-utils";

export class GaugeHitIndex implements PolarArcHitIndex {
    readonly #center: ChartPoint;
    readonly #innerRadius: number;
    readonly #outerRadius: number;
    readonly #targets: readonly SceneHitTarget[];

    public constructor(
        center: ChartPoint,
        targets: readonly SceneHitTarget[],
        innerRadius: number,
        outerRadius: number
    ) {
        this.#center = center;
        this.#targets = targets.filter(t => t.arc !== undefined);
        this.#innerRadius = innerRadius;
        this.#outerRadius = outerRadius;
    }

    public query(pointer: ChartPoint): readonly SceneHitTarget[] {
        if (this.#targets.length === 0) {
            return [];
        }

        const dx = pointer.x - this.#center.x;
        const dy = pointer.y - this.#center.y;
        const r = Math.sqrt(dx * dx + dy * dy);

        if (r < this.#innerRadius - 0.5 || r > this.#outerRadius + 0.5) {
            return [];
        }

        // 0 is 12 o'clock, clockwise
        const rawAngle = Math.atan2(dx, -dy);
        const pointerAngle = normalizeAngle(rawAngle);

        for (const target of this.#targets) {
            const arc = target.arc!;
            if (isAngleInsideArc(pointerAngle, arc.startAngle, arc.endAngle, arc.padAngle)) {
                return [target];
            }
        }

        return [];
    }
}
