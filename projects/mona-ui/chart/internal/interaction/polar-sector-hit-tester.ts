import type { ChartPoint } from "../../models/chart.models";
import type { PolarSectorChartScene } from "../scene/chart-scene";
import { isAngleInsideArc, normalizeAngle } from "../utils/angle-utils";
import type { ChartInteractionState } from "./chart-interaction-state";

export class PolarSectorHitTester {
    public static testHit(pointer: ChartPoint, scene: PolarSectorChartScene): ChartInteractionState {
        const { hitTargets } = scene;

        for (const target of hitTargets) {
            if (target.arc) {
                const { center, endAngle, innerRadius, outerRadius, padAngle, startAngle } = target.arc;
                const dx = pointer.x - center.x;
                const dy = pointer.y - center.y;
                const radius = Math.hypot(dx, dy);

                // Donut hole or outside ring
                if (radius < innerRadius || radius > outerRadius) {
                    continue;
                }

                // Clockwise angle from 12 o'clock (-Y)
                const rawAngle = Math.atan2(dx, -dy);
                const pointerAngle = normalizeAngle(rawAngle);

                if (isAngleInsideArc(pointerAngle, startAngle, endAngle, padAngle)) {
                    return {
                        activeHitTarget: target,
                        activeHits: [target],
                        pointerPosition: pointer
                    };
                }
            }
        }

        return {
            activeHitTarget: null,
            activeHits: [],
            pointerPosition: pointer
        };
    }
}
