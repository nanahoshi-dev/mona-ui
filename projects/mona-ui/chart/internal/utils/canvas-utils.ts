import type { ChartCornerRadii } from "../scene/scene-geometry";
import { clamp } from "./number-utils";

export function crispPixel(pixel: number, lineWidth: number = 1): number {
    if (lineWidth % 2 === 1) {
        return Math.floor(pixel) + 0.5;
    }
    return Math.round(pixel);
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
    const tl = cornerRadii ? clamp(cornerRadii.topLeft, 0, maxRadius) : (isPositive ? clamp(radius, 0, maxRadius) : 0);
    const tr = cornerRadii ? clamp(cornerRadii.topRight, 0, maxRadius) : (isPositive ? clamp(radius, 0, maxRadius) : 0);
    const br = cornerRadii ? clamp(cornerRadii.bottomRight, 0, maxRadius) : (!isPositive ? clamp(radius, 0, maxRadius) : 0);
    const bl = cornerRadii ? clamp(cornerRadii.bottomLeft, 0, maxRadius) : (!isPositive ? clamp(radius, 0, maxRadius) : 0);

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
