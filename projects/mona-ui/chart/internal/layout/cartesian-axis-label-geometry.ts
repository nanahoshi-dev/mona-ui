import type { ChartAxisLabelRotation } from "../../models/chart-axis.models";
import { clamp, isFiniteNumber } from "../utils/number-utils";

export interface RotatedDimensions {
    readonly projectedHeight: number;
    readonly projectedWidth: number;
}

export interface LabelDimensions {
    readonly height: number;
    readonly width: number;
}

export interface CategoryLabelThinningParams {
    readonly categoryCount: number;
    readonly categoryStep: number;
    readonly maxLabelExtentAlongAxis: number;
    readonly preferredTickCount?: number;
}

export class CartesianAxisLabelGeometry {
    static #measureCanvas: HTMLCanvasElement | null = null;

    public static createTickKey(axis: "x" | "y", axisType: string, value: unknown, index: number): string {
        if (axisType === "category") {
            const serialized = value !== undefined && value !== null ? String(value) : String(index);
            return `axis:${axis}:category:${index}:${serialized}`;
        }
        if (axisType === "linear") {
            return `axis:${axis}:linear:${value}`;
        }
        if (axisType === "time" || axisType === "utc") {
            const epoch = value instanceof Date ? value.getTime() : String(value);
            return `axis:${axis}:${axisType}:${epoch}`;
        }
        return `axis:${axis}:${axisType}:${index}:${String(value)}`;
    }

    public static estimateLabelDimensions(
        formattedText: string,
        font: string = "12px ui-sans-serif, system-ui, sans-serif"
    ): LabelDimensions {
        const textLen = Math.max(1, formattedText.length);
        if (typeof document !== "undefined") {
            try {
                if (!CartesianAxisLabelGeometry.#measureCanvas) {
                    CartesianAxisLabelGeometry.#measureCanvas = document.createElement("canvas");
                }
                // Re-resolve the 2D context on every call rather than caching it: the canvas
                // element itself is cheap to reuse, but caching the *context* would freeze in
                // whatever mock/implementation was active the first time this ran.
                const ctx = CartesianAxisLabelGeometry.#measureCanvas.getContext("2d");
                if (ctx) {
                    ctx.font = font;
                    const measuredWidth = ctx.measureText(formattedText).width;
                    if (typeof measuredWidth === "number" && !isNaN(measuredWidth) && measuredWidth > 0) {
                        return {
                            height: 16,
                            width: Math.ceil(measuredWidth)
                        };
                    }
                }
            } catch {
                // Fall back to character estimate
            }
        }
        return {
            height: 16,
            width: Math.max(12, Math.round(textLen * 7.5 + 4))
        };
    }

    public static normalizeRotation(rotation: ChartAxisLabelRotation | undefined): number | "auto" {
        if (rotation === "auto") {
            return "auto";
        }
        if (rotation === undefined || rotation === null || typeof rotation !== "number" || !isFiniteNumber(rotation)) {
            return 0;
        }
        return clamp(rotation, -90, 90);
    }

    public static projectRotatedDimensions(width: number, height: number, angleDeg: number): RotatedDimensions {
        const safeWidth = Math.max(0, width);
        const safeHeight = Math.max(0, height);
        if (angleDeg === 0 || !isFiniteNumber(angleDeg)) {
            return {
                projectedHeight: safeHeight,
                projectedWidth: safeWidth
            };
        }

        const angleRad = (Math.abs(angleDeg) * Math.PI) / 180;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);

        const projectedWidth = Math.abs(safeWidth * cos) + Math.abs(safeHeight * sin);
        const projectedHeight = Math.abs(safeWidth * sin) + Math.abs(safeHeight * cos);

        return {
            projectedHeight: Math.round(projectedHeight * 100) / 100,
            projectedWidth: Math.round(projectedWidth * 100) / 100
        };
    }

    public static resolveCategoryLabelThinning(params: CategoryLabelThinningParams): readonly boolean[] {
        const { categoryCount, categoryStep, maxLabelExtentAlongAxis, preferredTickCount } = params;

        if (categoryCount <= 0) {
            return [];
        }
        if (categoryCount === 1) {
            return [true];
        }

        const safeStep = Math.max(1, categoryStep);
        const safeExtent = Math.max(1, maxLabelExtentAlongAxis);
        const strideByCollision = Math.max(1, Math.ceil((safeExtent + 4) / safeStep));

        let stride = strideByCollision;
        if (preferredTickCount !== undefined && preferredTickCount > 0) {
            const strideByCount = Math.max(1, Math.ceil(categoryCount / preferredTickCount));
            stride = Math.max(strideByCollision, strideByCount);
        }

        if (stride <= 1) {
            return Array.from({ length: categoryCount }, () => true);
        }

        const flags = Array.from({ length: categoryCount }, () => false);
        let lastMarked = 0;

        for (let i = 0; i < categoryCount; i += stride) {
            flags[i] = true;
            lastMarked = i;
        }

        // First & last preservation
        flags[0] = true;
        const lastIndex = categoryCount - 1;

        if (!flags[lastIndex]) {
            const distanceToLast = lastIndex - lastMarked;
            const minSafeGap = Math.max(1, Math.floor(stride * 0.6));

            if (distanceToLast >= minSafeGap) {
                flags[lastIndex] = true;
            } else if (lastMarked > 0) {
                flags[lastMarked] = false;
                flags[lastIndex] = true;
            }
        }

        return flags;
    }
}
