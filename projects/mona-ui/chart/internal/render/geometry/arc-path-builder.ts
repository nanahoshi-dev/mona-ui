import { arc } from "d3-shape";

export interface ArcPathOptions {
    readonly cornerRadius?: number;
    readonly endAngle: number;
    readonly innerRadius: number;
    readonly outerRadius: number;
    readonly padAngle?: number;
    readonly startAngle: number;
}

export function buildArcPath(options: ArcPathOptions): string | null {
    if (options.outerRadius <= 0 || options.outerRadius < options.innerRadius) {
        return null;
    }
    if (Math.abs(options.endAngle - options.startAngle) < 1e-6) {
        return null;
    }

    const generator = arc<ArcPathOptions>()
        .innerRadius(d => d.innerRadius)
        .outerRadius(d => d.outerRadius)
        .startAngle(d => d.startAngle)
        .endAngle(d => d.endAngle)
        .padAngle(d => d.padAngle ?? 0)
        .cornerRadius(d => d.cornerRadius ?? 0);

    return generator(options);
}
