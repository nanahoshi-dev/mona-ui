import { withAlpha } from "./area-gradient";

export interface PolarGradientStop {
    readonly color: string;
    readonly offset: number;
}

export interface PolarGradientSpec {
    readonly innerRadius: number;
    readonly outerRadius: number;
    readonly stops: readonly PolarGradientStop[];
}

/**
 * Creates a radial gradient specification for polar series matching Area chart styling.
 * The gradient transitions from a soft translucent tint near the outer arc to transparent
 * at the center (or inner radius).
 */
export function createPolarGradientSpec(
    innerRadius: number,
    outerRadius: number,
    baseColor: string,
    fillOpacity: number = 1
): PolarGradientSpec {
    const r0 = Math.max(0, innerRadius);
    const r1 = Math.max(1, outerRadius);
    const normalizedOpacity = Math.max(0, Math.min(1, fillOpacity));

    // Outer arc: soft translucent wash (~0.35 opacity, similar to Area chart top fill)
    // Center: transparent (0 opacity)
    const arcColor = withAlpha(baseColor, normalizedOpacity * 0.35);
    const midColor = withAlpha(baseColor, normalizedOpacity * 0.15);
    const centerColor = withAlpha(baseColor, 0);

    return {
        innerRadius: r0,
        outerRadius: r1,
        stops: [
            { offset: 0, color: centerColor },
            { offset: 0.5, color: midColor },
            { offset: 1, color: arcColor }
        ]
    };
}
