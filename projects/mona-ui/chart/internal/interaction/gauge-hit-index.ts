import type { ChartPoint } from "../../models/chart.models";
import type { ChartGaugeIndicator } from "../../models/chart-radial-arc.models";
import type { PolarArcHitIndex } from "../scene/polar-arc-scene";
import type { SceneArcHitGeometry, SceneHitTarget } from "../scene/scene-geometry";
import { isAngleInsideArc, normalizeAngle } from "../utils/angle-utils";

export interface GaugeNeedleHitGeometry {
    readonly angle: number;
    readonly hubRadius: number;
    readonly length: number;
    readonly width: number;
}

export interface GaugeHitGeometry {
    readonly center: ChartPoint;
    readonly indicator: ChartGaugeIndicator;
    readonly needle?: GaugeNeedleHitGeometry;
    readonly target: SceneHitTarget;
    readonly valueArc?: SceneArcHitGeometry;
}

export class GaugeHitIndex implements PolarArcHitIndex {
    readonly #geometry: GaugeHitGeometry | null;

    public constructor(geometry: GaugeHitGeometry | null) {
        this.#geometry = geometry;
    }

    public query(pointer: ChartPoint): readonly SceneHitTarget[] {
        if (!this.#geometry) {
            return [];
        }

        const { center, indicator, needle, target, valueArc } = this.#geometry;
        const dx = pointer.x - center.x;
        const dy = pointer.y - center.y;
        const r = Math.sqrt(dx * dx + dy * dy);

        let hitArc = false;
        if ((indicator === "arc" || indicator === "both") && valueArc) {
            if (r >= valueArc.innerRadius - 0.5 && r <= valueArc.outerRadius + 0.5) {
                // 0 is 12 o'clock, clockwise
                const rawAngle = Math.atan2(dx, -dy);
                const pointerAngle = normalizeAngle(rawAngle);
                if (isAngleInsideArc(pointerAngle, valueArc.startAngle, valueArc.endAngle, valueArc.padAngle)) {
                    hitArc = true;
                }
            }
        }

        let hitNeedle = false;
        if ((indicator === "needle" || indicator === "both") && needle) {
            const hubTolerance = Math.max(needle.hubRadius, 6);
            if (r <= hubTolerance) {
                hitNeedle = true;
            } else {
                const tipX = Math.sin(needle.angle) * needle.length;
                const tipY = -Math.cos(needle.angle) * needle.length;
                const lenSq = tipX * tipX + tipY * tipY;

                if (lenSq > 0) {
                    const dot = dx * tipX + dy * tipY;
                    const t = Math.max(0, Math.min(1, dot / lenSq));
                    const projX = t * tipX;
                    const projY = t * tipY;
                    const distSq = (dx - projX) * (dx - projX) + (dy - projY) * (dy - projY);
                    const tolerance = Math.max(needle.width / 2 + 4, 6);
                    if (distSq <= tolerance * tolerance) {
                        hitNeedle = true;
                    }
                }
            }
        }

        if (indicator === "arc" && hitArc) {
            return [target];
        }
        if (indicator === "needle" && hitNeedle) {
            return [target];
        }
        if (indicator === "both" && (hitArc || hitNeedle)) {
            return [target];
        }

        return [];
    }
}
