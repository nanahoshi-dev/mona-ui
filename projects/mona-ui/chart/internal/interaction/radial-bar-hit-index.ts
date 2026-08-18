import type { ChartPoint } from "../../models/chart.models";
import type { PolarArcHitIndex } from "../scene/polar-arc-scene";
import type { SceneHitTarget } from "../scene/scene-geometry";
import { isAngleInsideArc, normalizeAngle } from "../utils/angle-utils";

interface RadialRingTarget {
    readonly hitTarget: SceneHitTarget;
    readonly innerRadius: number;
    readonly outerRadius: number;
    readonly padAngle: number;
    readonly startAngle: number;
    readonly endAngle: number;
}

export class RadialBarHitIndex implements PolarArcHitIndex {
    readonly #center: ChartPoint;
    readonly #rings: readonly RadialRingTarget[];

    public constructor(center: ChartPoint, targets: readonly SceneHitTarget[]) {
        this.#center = center;
        const rings: RadialRingTarget[] = [];

        for (const t of targets) {
            if (t.arc) {
                rings.push({
                    endAngle: t.arc.endAngle,
                    hitTarget: t,
                    innerRadius: t.arc.innerRadius,
                    outerRadius: t.arc.outerRadius,
                    padAngle: t.arc.padAngle ?? 0,
                    startAngle: t.arc.startAngle
                });
            }
        }

        // Sort descending by outer radius (outermost first)
        rings.sort((a, b) => b.outerRadius - a.outerRadius);
        this.#rings = rings;
    }

    public query(pointer: ChartPoint): readonly SceneHitTarget[] {
        if (this.#rings.length === 0) {
            return [];
        }

        const dx = pointer.x - this.#center.x;
        const dy = pointer.y - this.#center.y;
        const r = Math.sqrt(dx * dx + dy * dy);

        // Quick bounding radial range check
        const outermost = this.#rings[0].outerRadius;
        const innermost = this.#rings[this.#rings.length - 1].innerRadius;
        if (r < innermost - 1 || r > outermost + 1) {
            return [];
        }

        // Pointer angle in Mona convention: 0 is 12 o'clock (dy negative), clockwise
        const rawAngle = Math.atan2(dx, -dy);
        const pointerAngle = normalizeAngle(rawAngle);

        // Binary search ring by radius
        let low = 0;
        let high = this.#rings.length - 1;
        let matchedIndex = -1;

        while (low <= high) {
            const mid = (low + high) >> 1;
            const ring = this.#rings[mid];

            if (r >= ring.innerRadius - 0.5 && r <= ring.outerRadius + 0.5) {
                matchedIndex = mid;
                break;
            } else if (r > ring.outerRadius) {
                // radius is larger than this ring -> ring is in the lower index (since sorted descending)
                high = mid - 1;
            } else {
                low = mid + 1;
            }
        }

        if (matchedIndex === -1) {
            return [];
        }

        const matchedRing = this.#rings[matchedIndex];
        if (isAngleInsideArc(pointerAngle, matchedRing.startAngle, matchedRing.endAngle, matchedRing.padAngle)) {
            return [matchedRing.hitTarget];
        }

        return [];
    }
}
