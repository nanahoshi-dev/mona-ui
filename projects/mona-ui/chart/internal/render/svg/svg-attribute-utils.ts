import { formatRgb, parse } from "culori";
import { clamp } from "../../utils/number-utils";

export function formatSvgNumber(num: number): string {
    if (!Number.isFinite(num)) {
        return "0";
    }
    const rounded = Math.round(num * 10000) / 10000;
    return String(rounded);
}

export function setSvgAttribute(
    element: SVGElement,
    name: string,
    value: string | number | null | undefined
): void {
    if (value === null || value === undefined) {
        element.removeAttribute(name);
    } else if (typeof value === "number") {
        if (Number.isFinite(value)) {
            element.setAttribute(name, formatSvgNumber(value));
        } else {
            element.removeAttribute(name);
        }
    } else {
        const trimmed = value.trim();
        if (trimmed === "") {
            element.removeAttribute(name);
        } else {
            element.setAttribute(name, trimmed);
        }
    }
}

export function resolveStrokeDashArray(
    lineStyle?: "solid" | "dashed" | "dotted" | null
): string | undefined {
    switch (lineStyle) {
        case "dashed":
            return "6 6";
        case "dotted":
            return "2 2";
        case "solid":
        default:
            return undefined;
    }
}

export function withSvgAlpha(color: string, alpha: number): string {
    if (!color) {
        return `rgba(0, 0, 0, ${clamp(alpha, 0, 1)})`;
    }
    const parsed = parse(color);
    if (parsed) {
        const clampedAlpha = clamp(alpha, 0, 1);
        return formatRgb({ ...parsed, alpha: clampedAlpha }) || `rgba(0, 0, 0, ${clampedAlpha})`;
    }
    return `rgba(0, 0, 0, ${clamp(alpha, 0, 1)})`;
}
