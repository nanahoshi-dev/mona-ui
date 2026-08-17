import type { ChartPoint, ChartRect } from "../../models/chart.models";

export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

export function lerpOpacity(a: number, b: number, t: number): number {
    const val = lerp(a, b, t);
    return Math.max(0, Math.min(1, val));
}

export function lerpPoint(a: ChartPoint, b: ChartPoint, t: number): ChartPoint {
    return {
        x: lerp(a.x, b.x, t),
        y: lerp(a.y, b.y, t)
    };
}

export function lerpRect(a: ChartRect, b: ChartRect, t: number): ChartRect {
    return {
        height: lerp(a.height, b.height, t),
        width: lerp(a.width, b.width, t),
        x: lerp(a.x, b.x, t),
        y: lerp(a.y, b.y, t)
    };
}

const TWO_PI = 2 * Math.PI;

export function lerpCircularAngle(fromRad: number, toRad: number, t: number): number {
    let diff = (toRad - fromRad) % TWO_PI;
    if (diff > Math.PI) {
        diff -= TWO_PI;
    } else if (diff < -Math.PI) {
        diff += TWO_PI;
    }
    return fromRad + diff * t;
}

export function lerpCircularDegrees(fromDeg: number, toDeg: number, t: number): number {
    let diff = (toDeg - fromDeg) % 360;
    if (diff > 180) {
        diff -= 360;
    } else if (diff < -180) {
        diff += 360;
    }
    return fromDeg + diff * t;
}
