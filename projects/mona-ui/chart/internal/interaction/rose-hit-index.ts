import type { ChartPoint } from "../../models/chart.models";
import type { PolarArcHitIndex } from "../scene/polar-arc-scene";
import type { SceneHitTarget } from "../scene/scene-geometry";
import { isAngleInsideArc, normalizeAngle } from "../utils/angle-utils";

export class RoseHitIndex implements PolarArcHitIndex {
    readonly #center: ChartPoint;
    readonly #targets: readonly SceneHitTarget[];

    public constructor(center: ChartPoint, targets: readonly SceneHitTarget[]) {
        this.#center = center;
        this.#targets = targets.filter(t => t.arc !== undefined);
    }

    public query(pointer: ChartPoint): readonly SceneHitTarget[] {
        if (this.#targets.length === 0) {
            return [];
        }

        const dx = pointer.x - this.#center.x;
        const dy = pointer.y - this.#center.y;
        const r = Math.sqrt(dx * dx + dy * dy);

        // Mona polar angle convention: 0 at 12 o'clock, clockwise
        const rawAngle = Math.atan2(dx, -dy);
        const pointerAngle = normalizeAngle(rawAngle);

        for (const target of this.#targets) {
            const arc = target.arc!;
            if (r >= arc.innerRadius - 0.5 && r <= arc.outerRadius + 0.5) {
                if (isAngleInsideArc(pointerAngle, arc.startAngle, arc.endAngle, arc.padAngle)) {
                    return [target];
                }
            }
        }

        return [];
    }
}
