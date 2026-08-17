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
 * Creates a radial gradient specification for polar series.
 * The gradient transitions from a translucent wash near the outer arc (~0.45 opacity at offset 1.0)
 * through a mid tone (~0.30 opacity at offset 0.65) to a subtle inner tint (~0.20 opacity at offset 0.25).
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

    // Outer arc: translucent wash (0.45 opacity scaled by fillOpacity at offset 1)
    // Mid tone: 0.30 opacity scaled by fillOpacity at offset 0.65
    // Inner tone / center: fixed 0.20 opacity at offset 0.25
    const arcColor = withAlpha(baseColor, normalizedOpacity * 0.45);
    const midColor = withAlpha(baseColor, normalizedOpacity * 0.3);
    const centerColor = withAlpha(baseColor, 0.2);

    return {
        innerRadius: r0,
        outerRadius: r1,
        stops: [
            { color: centerColor, offset: 0.25 },
            { color: midColor, offset: 0.65 },
            { color: arcColor, offset: 1 }
        ]
    };
}
