import type { ChartLineStyle } from "../../models/chart-series.models";
import type { ChartRect } from "../../models/chart.models";
import type { ChartCornerRadii } from "../scene/scene-geometry";
import { clamp } from "./number-utils";


/**
 * Small overflow allowance so marks whose stroke or radius sits exactly at a
 * domain extreme (a peak touching the max, a hovered point marker at the
 * first/last category) aren't visually chopped in half by the plot clip rect.
 * Only applied on sides that don't already have a drawn axis boundary line
 * (see {@link resolvePlotEdgeAxisLines}) — a side with a visible axis line
 * clips flush against it instead, so series strokes don't visibly poke past it.
 */
export const PLOT_CLIP_OVERFLOW = 8;

/** The subset of ChartAxisScene fields needed to resolve which plot edges have a drawn axis line. */
export interface PlotEdgeAxisDescriptor {
    readonly axisLine: boolean;
    readonly position: "bottom" | "left" | "right" | "top";
    readonly sideOffset?: number;
    readonly visible: boolean;
}

export interface PlotEdgeAxisLines {
    readonly bottom: boolean;
    readonly left: boolean;
    readonly right: boolean;
    readonly top: boolean;
}

/**
 * Resolves which of the plot rect's four edges have a visible, boundary-hugging
 * (sideOffset 0) axis line drawn on them. Stacked secondary axes (sideOffset > 0)
 * don't count: their line is drawn further out, not at the plot boundary itself.
 */
export function resolvePlotEdgeAxisLines(axes: readonly PlotEdgeAxisDescriptor[]): PlotEdgeAxisLines {
    let top = false;
    let bottom = false;
    let left = false;
    let right = false;
    for (const axis of axes) {
        if (!axis.visible || !axis.axisLine || (axis.sideOffset ?? 0) !== 0) {
            continue;
        }
        switch (axis.position) {
            case "top":
                top = true;
                break;
            case "bottom":
                bottom = true;
                break;
            case "left":
                left = true;
                break;
            case "right":
                right = true;
                break;
        }
    }
    return { bottom, left, right, top };
}

/**
 * Computes the clip rect for series/overlay content: `plotRect` inflated by
 * {@link PLOT_CLIP_OVERFLOW} on each side, except sides with a visible boundary
 * axis line, which stay flush so strokes don't visibly cross the axis line.
 */
export function computeSeriesClipRect(plotRect: ChartRect, axes: readonly PlotEdgeAxisDescriptor[]): ChartRect {
    const edges = resolvePlotEdgeAxisLines(axes);
    const left = edges.left ? 0 : PLOT_CLIP_OVERFLOW;
    const right = edges.right ? 0 : PLOT_CLIP_OVERFLOW;
    const top = edges.top ? 0 : PLOT_CLIP_OVERFLOW;
    const bottom = edges.bottom ? 0 : PLOT_CLIP_OVERFLOW;
    return {
        height: plotRect.height + top + bottom,
        width: plotRect.width + left + right,
        x: plotRect.x - left,
        y: plotRect.y - top
    };
}

export function crispPixel(pixel: number, lineWidth: number = 1): number {
    if (lineWidth % 2 === 1) {
        return Math.floor(pixel) + 0.5;
    }
    return Math.round(pixel);
}

/** Clips the canvas context to `rect` as-is, with no further inflation. */
export function clipToRect(context: CanvasRenderingContext2D, rect: ChartRect): void {
    context.beginPath();
    context.rect(rect.x, rect.y, rect.width, rect.height);
    context.clip();
}

/**
 * Clips the canvas context to `plotRect`, inflated per {@link computeSeriesClipRect}.
 * Pass the scene's `axes` so sides with a visible boundary line clip flush against it.
 */
export function clipToPlotRect(
    context: CanvasRenderingContext2D,
    plotRect: ChartRect,
    axes: readonly PlotEdgeAxisDescriptor[] = []
): void {
    clipToRect(context, computeSeriesClipRect(plotRect, axes));
}

export function drawRoundedRectCorners(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radii: ChartCornerRadii
): void {
    if (width <= 0 || height <= 0) {
        return;
    }
    const maxRadius = Math.min(width / 2, height / 2);
    const tl = clamp(radii.topLeft, 0, maxRadius);
    const tr = clamp(radii.topRight, 0, maxRadius);
    const br = clamp(radii.bottomRight, 0, maxRadius);
    const bl = clamp(radii.bottomLeft, 0, maxRadius);

    if (tl <= 0 && tr <= 0 && br <= 0 && bl <= 0) {
        context.beginPath();
        context.rect(x, y, width, height);
        context.fill();
        return;
    }

    context.beginPath();
    context.moveTo(x + tl, y);
    context.lineTo(x + width - tr, y);
    if (tr > 0) {
        context.quadraticCurveTo(x + width, y, x + width, y + tr);
    } else {
        context.lineTo(x + width, y);
    }
    context.lineTo(x + width, y + height - br);
    if (br > 0) {
        context.quadraticCurveTo(x + width, y + height, x + width - br, y + height);
    } else {
        context.lineTo(x + width, y + height);
    }
    context.lineTo(x + bl, y + height);
    if (bl > 0) {
        context.quadraticCurveTo(x, y + height, x, y + height - bl);
    } else {
        context.lineTo(x, y + height);
    }
    context.lineTo(x, y + tl);
    if (tl > 0) {
        context.quadraticCurveTo(x, y, x + tl, y);
    } else {
        context.lineTo(x, y);
    }
    context.closePath();
    context.fill();
}

export function drawBarRect(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number = 0,
    isPositive: boolean = true,
    cornerRadii?: ChartCornerRadii
): void {
    if (width <= 0 || height <= 0) {
        return;
    }

    if (cornerRadii) {
        drawRoundedRectCorners(context, x, y, width, height, cornerRadii);
        return;
    }

    const maxRadius = Math.min(width / 2, height / 2);
    const clampedRadius = clamp(radius, 0, maxRadius);

    if (clampedRadius <= 0) {
        context.beginPath();
        context.rect(x, y, width, height);
        context.fill();
        return;
    }

    context.beginPath();
    if (isPositive) {
        // Rounded top corners
        context.moveTo(x, y + height);
        context.lineTo(x, y + clampedRadius);
        context.quadraticCurveTo(x, y, x + clampedRadius, y);
        context.lineTo(x + width - clampedRadius, y);
        context.quadraticCurveTo(x + width, y, x + width, y + clampedRadius);
        context.lineTo(x + width, y + height);
    } else {
        // Rounded bottom corners
        context.moveTo(x, y);
        context.lineTo(x + width, y);
        context.lineTo(x + width, y + height - clampedRadius);
        context.quadraticCurveTo(x + width, y + height, x + width - clampedRadius, y + height);
        context.lineTo(x + clampedRadius, y + height);
        context.quadraticCurveTo(x, y + height, x, y + height - clampedRadius);
    }
    context.closePath();
    context.fill();
}

export function drawBarRectOutline(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number = 0,
    isPositive: boolean = true,
    cornerRadii?: ChartCornerRadii
): void {
    if (width <= 0 || height <= 0) {
        return;
    }
    const maxRadius = Math.min(width / 2, height / 2);
    const tl = cornerRadii ? clamp(cornerRadii.topLeft, 0, maxRadius) : isPositive ? clamp(radius, 0, maxRadius) : 0;
    const tr = cornerRadii ? clamp(cornerRadii.topRight, 0, maxRadius) : isPositive ? clamp(radius, 0, maxRadius) : 0;
    const br = cornerRadii
        ? clamp(cornerRadii.bottomRight, 0, maxRadius)
        : !isPositive
          ? clamp(radius, 0, maxRadius)
          : 0;
    const bl = cornerRadii
        ? clamp(cornerRadii.bottomLeft, 0, maxRadius)
        : !isPositive
          ? clamp(radius, 0, maxRadius)
          : 0;

    context.beginPath();
    if (tl <= 0 && tr <= 0 && br <= 0 && bl <= 0) {
        context.rect(x, y, width, height);
    } else {
        context.moveTo(x + tl, y);
        context.lineTo(x + width - tr, y);
        if (tr > 0) {
            context.quadraticCurveTo(x + width, y, x + width, y + tr);
        } else {
            context.lineTo(x + width, y);
        }
        context.lineTo(x + width, y + height - br);
        if (br > 0) {
            context.quadraticCurveTo(x + width, y + height, x + width - br, y + height);
        } else {
            context.lineTo(x + width, y + height);
        }
        context.lineTo(x + bl, y + height);
        if (bl > 0) {
            context.quadraticCurveTo(x, y + height, x, y + height - bl);
        } else {
            context.lineTo(x, y + height);
        }
        context.lineTo(x, y + tl);
        if (tl > 0) {
            context.quadraticCurveTo(x, y, x + tl, y);
        } else {
            context.lineTo(x, y);
        }
        context.closePath();
    }
    context.stroke();
}

export function drawCellRect(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number = 0
): void {
    if (width <= 0 || height <= 0) {
        return;
    }
    const maxRadius = Math.min(width / 2, height / 2);
    const r = clamp(radius, 0, maxRadius);
    const radii: ChartCornerRadii = {
        bottomLeft: r,
        bottomRight: r,
        topLeft: r,
        topRight: r
    };
    drawRoundedRectCorners(context, x, y, width, height, radii);
}

export function drawCellRectOutline(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number = 0
): void {
    if (width <= 0 || height <= 0) {
        return;
    }
    const maxRadius = Math.min(width / 2, height / 2);
    const r = clamp(radius, 0, maxRadius);
    const radii: ChartCornerRadii = {
        bottomLeft: r,
        bottomRight: r,
        topLeft: r,
        topRight: r
    };
    drawBarRectOutline(context, x, y, width, height, r, true, radii);
}

export function drawPointMarker(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    fillColor: string,
    strokeColor: string,
    strokeWidth: number = 2
): void {
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    if (fillColor) {
        context.fillStyle = fillColor;
        context.fill();
    }
    if (strokeColor && strokeWidth > 0) {
        context.lineWidth = strokeWidth;
        context.strokeStyle = strokeColor;
        context.stroke();
    }
}

export function resolveCanvasStrokeDashArray(lineStyle?: ChartLineStyle | null): readonly number[] {
    switch (lineStyle) {
        case "dashed":
            return [4, 4];
        case "dotted":
            return [2, 2];
        case "solid":
        default:
            return [];
    }
}

