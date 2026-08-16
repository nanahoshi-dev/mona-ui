import { clamp } from "./number-utils";

export function crispPixel(pixel: number, lineWidth: number = 1): number {
    if (lineWidth % 2 === 1) {
        return Math.floor(pixel) + 0.5;
    }
    return Math.round(pixel);
}

export function drawBarRect(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number = 0,
    isPositive: boolean = true
): void {
    if (width <= 0 || height <= 0) {
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
