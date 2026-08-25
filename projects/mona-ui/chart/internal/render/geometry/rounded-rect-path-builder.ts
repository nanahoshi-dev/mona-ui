import type { ChartCornerRadii } from "../../scene/scene-geometry";
import { clamp } from "../../utils/number-utils";

export interface RoundedRectOptions {
    readonly cornerRadii?: ChartCornerRadii;
    readonly height: number;
    readonly isPositive?: boolean;
    readonly orientation?: "horizontal" | "vertical";
    readonly radius?: number;
    readonly width: number;
    readonly x: number;
    readonly y: number;
}

export function buildRoundedRectPath(
    x: number,
    y: number,
    width: number,
    height: number,
    radii: ChartCornerRadii
): string {
    if (width <= 0 || height <= 0) {
        return "";
    }
    const maxRadius = Math.min(width / 2, height / 2);
    const tl = clamp(radii.topLeft, 0, maxRadius);
    const tr = clamp(radii.topRight, 0, maxRadius);
    const br = clamp(radii.bottomRight, 0, maxRadius);
    const bl = clamp(radii.bottomLeft, 0, maxRadius);

    if (tl <= 0 && tr <= 0 && br <= 0 && bl <= 0) {
        return `M ${x} ${y} h ${width} v ${height} h ${-width} Z`;
    }

    const path: string[] = [];
    path.push(`M ${x + tl} ${y}`);
    path.push(`L ${x + width - tr} ${y}`);
    if (tr > 0) {
        path.push(`A ${tr} ${tr} 0 0 1 ${x + width} ${y + tr}`);
    }
    path.push(`L ${x + width} ${y + height - br}`);
    if (br > 0) {
        path.push(`A ${br} ${br} 0 0 1 ${x + width - br} ${y + height}`);
    }
    path.push(`L ${x + bl} ${y + height}`);
    if (bl > 0) {
        path.push(`A ${bl} ${bl} 0 0 1 ${x} ${y + height - bl}`);
    }
    path.push(`L ${x} ${y + tl}`);
    if (tl > 0) {
        path.push(`A ${tl} ${tl} 0 0 1 ${x + tl} ${y}`);
    }
    path.push("Z");

    return path.join(" ");
}

export function buildBarPath(options: RoundedRectOptions): string {
    const { cornerRadii, height, isPositive = true, orientation = "vertical", radius = 0, width, x, y } = options;

    if (width <= 0 || height <= 0) {
        return "";
    }

    if (cornerRadii) {
        return buildRoundedRectPath(x, y, width, height, cornerRadii);
    }

    const maxRadius = Math.min(width / 2, height / 2);
    const r = clamp(radius, 0, maxRadius);

    if (r <= 0) {
        return `M ${x} ${y} h ${width} v ${height} h ${-width} Z`;
    }

    let resolvedRadii: ChartCornerRadii;
    if (orientation === "horizontal") {
        if (isPositive) {
            resolvedRadii = { bottomLeft: 0, bottomRight: r, topLeft: 0, topRight: r };
        } else {
            resolvedRadii = { bottomLeft: r, bottomRight: 0, topLeft: r, topRight: 0 };
        }
    } else {
        if (isPositive) {
            resolvedRadii = { bottomLeft: 0, bottomRight: 0, topLeft: r, topRight: r };
        } else {
            resolvedRadii = { bottomLeft: r, bottomRight: r, topLeft: 0, topRight: 0 };
        }
    }

    return buildRoundedRectPath(x, y, width, height, resolvedRadii);
}
