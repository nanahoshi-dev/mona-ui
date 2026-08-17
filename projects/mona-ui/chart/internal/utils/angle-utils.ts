import { isFiniteNumber } from "./number-utils";

export const TWO_PI = 2 * Math.PI;

export function degreesToRadians(degrees: number): number {
    if (!isFiniteNumber(degrees)) {
        return 0;
    }
    return (degrees * Math.PI) / 180;
}

export function radiansToDegrees(radians: number): number {
    if (!isFiniteNumber(radians)) {
        return 0;
    }
    return (radians * 180) / Math.PI;
}

export function normalizeAngle(radians: number): number {
    if (!isFiniteNumber(radians)) {
        return 0;
    }
    let norm = radians % TWO_PI;
    if (norm < 0) {
        norm += TWO_PI;
    }
    return norm;
}

export function normalizeDegrees(degrees: number): number {
    if (!isFiniteNumber(degrees)) {
        return 0;
    }
    let norm = degrees % 360;
    if (norm < 0) {
        norm += 360;
    }
    return norm;
}

export function circularAngleDistance(aRad: number, bRad: number): number {
    if (!isFiniteNumber(aRad) || !isFiniteNumber(bRad)) {
        return 0;
    }
    const normA = normalizeAngle(aRad);
    const normB = normalizeAngle(bRad);
    const delta = Math.abs(normA - normB);
    return Math.min(delta, TWO_PI - delta);
}

export function normalizeAngleSpan(
    startDegrees: number | undefined,
    endDegrees: number | undefined
): { endAngleRad: number; endDegrees: number; spanDegrees: number; startAngleRad: number; startDegrees: number } {
    const rawStart = isFiniteNumber(startDegrees) ? startDegrees : 0;
    const rawEnd = isFiniteNumber(endDegrees) ? endDegrees : 360;

    let span = rawEnd - rawStart;
    if (span <= 0) {
        // If equal and 0/360 or negative, normalize wrapped span
        if (rawStart === 0 && rawEnd === 0) {
            span = 360;
        } else {
            span = ((span % 360) + 360) % 360;
            if (span === 0) {
                span = 360;
            }
        }
    }

    if (span > 360) {
        span = 360;
    }

    const startNormDeg = normalizeDegrees(rawStart);
    const endNormDeg = startNormDeg + span;

    const startAngleRad = degreesToRadians(startNormDeg);
    const endAngleRad = startAngleRad + degreesToRadians(span);

    return {
        endAngleRad,
        endDegrees: endNormDeg,
        spanDegrees: span,
        startAngleRad,
        startDegrees: startNormDeg
    };
}

export function isAngleInsideArc(
    pointerAngle: number,
    startAngle: number,
    endAngle: number,
    padAngle: number = 0
): boolean {
    if (!isFiniteNumber(pointerAngle) || !isFiniteNumber(startAngle) || !isFiniteNumber(endAngle)) {
        return false;
    }

    const halfPad = Math.max(0, padAngle) / 2;
    const effStart = startAngle + halfPad;
    const effEnd = endAngle - halfPad;

    if (effStart >= effEnd) {
        return false;
    }

    const span = effEnd - effStart;
    if (span >= TWO_PI - 1e-6) {
        return true;
    }

    const normPointer = normalizeAngle(pointerAngle);
    const normStart = normalizeAngle(effStart);

    let diff = (normPointer - normStart) % TWO_PI;
    if (diff < 0) {
        diff += TWO_PI;
    }

    return diff <= span + 1e-9;
}
