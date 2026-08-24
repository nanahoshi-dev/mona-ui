import {
    normalizeNonNegativeNumber
    ,normalizePositiveNumber,
    normalizeRatio
} from "../utils/number-utils";
import { degreesToRadians } from "../utils/angle-utils";

export interface RadialRingBand {
    readonly innerRadius: number;
    readonly outerRadius: number;
}

export interface RadialRingBandsResult {
    readonly bands: readonly RadialRingBand[];
    readonly gap: number;
    readonly thickness: number;
}

export function computeRadialRingBands(
    innerRadius: number,
    outerRadius: number,
    count: number,
    requestedGap: number = 4,
    requestedThickness?: number
): RadialRingBandsResult {
    const normInner = Number.isFinite(innerRadius) ? Math.max(0, innerRadius) : 0;
    const normOuter = Number.isFinite(outerRadius) ? Math.max(normInner, outerRadius) : normInner;
    const availableBand = Math.max(0, normOuter - normInner);

    if (count <= 0 || availableBand <= 0) {
        return {
            bands: [],
            gap: 0,
            thickness: 0
        };
    }

    const normGapInput = normalizeNonNegativeNumber(requestedGap, 4);
    const maxGapTotal = count > 1 ? normGapInput * (count - 1) : 0;

    let gap = normGapInput;
    if (maxGapTotal > availableBand && count > 1) {
        gap = availableBand / (count - 1);
    }

    const remainingBand = Math.max(0, availableBand - (count > 1 ? gap * (count - 1) : 0));
    const maxThickness = remainingBand / count;

    let thickness: number;
    const normReqThickness = requestedThickness !== undefined && Number.isFinite(requestedThickness) && requestedThickness > 0
        ? requestedThickness
        : undefined;

    if (normReqThickness !== undefined) {
        thickness = Math.min(normReqThickness, maxThickness);
    } else {
        thickness = maxThickness;
    }

    // Center explicit bands within available space
    const usedBand = count * thickness + (count > 1 ? (count - 1) * gap : 0);
    const offset = Math.max(0, (availableBand - usedBand) / 2);

    const bands: RadialRingBand[] = [];
    const outermost = normOuter - offset;

    for (let i = 0; i < count; i++) {
        const ringOuter = Math.max(normInner, outermost - i * (thickness + gap));
        const ringInner = Math.max(normInner, ringOuter - thickness);
        bands.push({
            innerRadius: ringInner,
            outerRadius: ringOuter
        });
    }

    return {
        bands,
        gap,
        thickness
    };
}

export function normalizeRosePadding(
    requestedPadDeg: number,
    slotSpanRad: number,
    categoryCount: number
): number {
    if (categoryCount <= 1 || !Number.isFinite(slotSpanRad) || slotSpanRad <= 0) {
        return 0;
    }

    const normPadDeg = normalizeNonNegativeNumber(requestedPadDeg, 0);
    const requestedPadRad = degreesToRadians(normPadDeg);
    const maxPadRad = slotSpanRad * 0.35;

    return Math.min(requestedPadRad, maxPadRad);
}

export function normalizeArcCornerRadius(
    value: unknown,
    maxCorner: number,
    fallback: number = 0
): number {
    if (value === undefined || value === null) {
        return fallback;
    }
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return fallback;
    }
    if (value <= 0) {
        return 0;
    }
    const safeMax = Number.isFinite(maxCorner) && maxCorner >= 0 ? maxCorner : 0;
    return Math.min(value, safeMax);
}

export function computeOuterRadiusWithStroke(
    maxAvailableRadius: number,
    outerRatio: number,
    strokeWidth: number = 0
): number {
    const normMaxR = Number.isFinite(maxAvailableRadius) ? Math.max(0, maxAvailableRadius) : 0;
    const normRatio = normalizeRatio(outerRatio, 0.9, 0.05, 1);
    const rawOuter = normMaxR * normRatio;
    const strokeInset = strokeWidth > 0 && Number.isFinite(strokeWidth) ? strokeWidth / 2 : 0;
    return Math.max(0, rawOuter - strokeInset);
}

export interface NormalizedGaugeGeometry {
    readonly cornerRadius: number;
    readonly endAngle: number;
    readonly hubRadius: number;
    readonly innerRadius: number;
    readonly needleLength: number;
    readonly needleWidth: number;
    readonly outerRadius: number;
    readonly startAngle: number;
}

export function normalizeGaugeGeometry(options: {
    readonly containerHeight: number;
    readonly containerWidth: number;
    readonly cornerRadius?: number;
    readonly endAngle: number;
    readonly hubRadius: number;
    readonly innerRadiusRatio: number;
    readonly needleLengthRatio: number;
    readonly needleWidth: number;
    readonly outerRadiusRatio: number;
    readonly startAngle: number;
}): NormalizedGaugeGeometry {
    const width = Number.isFinite(options.containerWidth) ? Math.max(0, options.containerWidth) : 0;
    const height = Number.isFinite(options.containerHeight) ? Math.max(0, options.containerHeight) : 0;
    const maxAvailableRadius = Math.max(0, Math.min(width, height) / 2);

    const outerRatio = normalizeRatio(options.outerRadiusRatio, 0.9, 0.05, 1);
    const outerRadius = maxAvailableRadius * outerRatio;

    const innerRatio = normalizeRatio(options.innerRadiusRatio, 0.72, 0, 0.99);
    const innerRadius = outerRadius * innerRatio;
    const arcThickness = Math.max(0, outerRadius - innerRadius);

    const cornerRadius = normalizeArcCornerRadius(options.cornerRadius, arcThickness / 2, 0);

    const needleLengthRatio = normalizeRatio(options.needleLengthRatio, 0.78, 0.1, 1);
    const needleLength = outerRadius * needleLengthRatio;
    const needleWidth = normalizePositiveNumber(options.needleWidth, 2) ?? 2;
    const hubRadius = normalizePositiveNumber(options.hubRadius, 5) ?? 5;

    const startAngle = Number.isFinite(options.startAngle) ? options.startAngle : 0;
    const endAngle = Number.isFinite(options.endAngle) ? options.endAngle : 360;

    return {
        cornerRadius,
        endAngle,
        hubRadius,
        innerRadius,
        needleLength,
        needleWidth,
        outerRadius,
        startAngle
    };
}
