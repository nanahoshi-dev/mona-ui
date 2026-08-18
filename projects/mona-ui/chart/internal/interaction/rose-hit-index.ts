import type { ChartPoint } from "../../models/chart.models";
import type { PolarArcHitIndex } from "../scene/polar-arc-scene";
import type { SceneHitTarget } from "../scene/scene-geometry";
import { isAngleInsideArc, normalizeAngle } from "../utils/angle-utils";

export class RoseHitIndex implements PolarArcHitIndex {
    readonly #center: ChartPoint;
    readonly #deltaTheta: number;
    readonly #startAngleRad: number;
    readonly #targetBySlot = new Map<number, SceneHitTarget>();
    readonly #targets: readonly SceneHitTarget[];
    readonly #totalSpanRad: number;

    public constructor(
        center: ChartPoint,
        targets: readonly SceneHitTarget[],
        startAngleRad: number = 0,
        totalSpanRad: number = Math.PI * 2,
        categoryCount: number = targets.length
    ) {
        this.#center = center;
        this.#targets = targets.filter(t => t.arc !== undefined && t.arc.outerRadius - t.arc.innerRadius > 1e-6);
        this.#startAngleRad = startAngleRad;
        this.#totalSpanRad = totalSpanRad;
        this.#deltaTheta = categoryCount > 0 ? totalSpanRad / categoryCount : 0;

        for (let i = 0; i < this.#targets.length; i++) {
            const target = this.#targets[i];
            const slotIndex = target.categoryIndex !== undefined
                ? target.categoryIndex
                : target.index !== undefined
                  ? target.index
                  : i;
            this.#targetBySlot.set(slotIndex, target);
        }
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

        if (this.#deltaTheta > 0) {
            const relAngle = normalizeAngle(pointerAngle - this.#startAngleRad);
            if (relAngle <= this.#totalSpanRad + 1e-6) {
                const slotIndex = Math.floor(relAngle / this.#deltaTheta);
                const target = this.#targetBySlot.get(slotIndex);
                if (target?.arc) {
                    const arc = target.arc;
                    if (r >= arc.innerRadius - 0.5 && r <= arc.outerRadius + 0.5) {
                        if (isAngleInsideArc(pointerAngle, arc.startAngle, arc.endAngle, arc.padAngle)) {
                            return [target];
                        }
                    }
                }
            }
            return [];
        }

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
