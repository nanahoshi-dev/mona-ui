import { withAlpha } from "./area-gradient";

export interface RadialSeriesGradientStop {
    readonly color: string;
    readonly offset: number;
}

export interface RadialSeriesGradientSpec {
    readonly innerRadius: number;
    readonly outerRadius: number;
    readonly stops: readonly RadialSeriesGradientStop[];
}

/**
 * Creates a radial gradient specification for Radar and Polar series.
 * Gradient transitions from lighter/softer at the pole (0 offset) to full series fill opacity at max radius (1.0 offset).
 */
export function createRadialSeriesGradientSpec(
    maxRadius: number,
    baseColor: string,
    fillOpacity: number = 0.18
): RadialSeriesGradientSpec {
    const r1 = Math.max(1, maxRadius);
    const normalizedOpacity = Math.max(0, Math.min(1, fillOpacity));

    const centerColor = withAlpha(baseColor, normalizedOpacity * 0.15);
    const midColor = withAlpha(baseColor, normalizedOpacity * 0.6);
    const outerColor = withAlpha(baseColor, normalizedOpacity);

    return {
        innerRadius: 0,
        outerRadius: r1,
        stops: [
            { color: centerColor, offset: 0 },
            { color: midColor, offset: 0.6 },
            { color: outerColor, offset: 1 }
        ]
    };
}
