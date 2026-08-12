import type { RatingPrecision } from "../models/RatingPrecision";

const DEFAULT_ITEMS_COUNT = 5;

/**
 * Normalizes an arbitrary `itemsCount` value into a safe positive integer.
 * Numeric strings are converted, fractional values are floored, and
 * non-finite values fall back to the default.
 */
export function normalizeItemsCount(value: unknown): number {
    if (typeof value === "string") {
        if (value.trim() === "") {
            return DEFAULT_ITEMS_COUNT;
        }
        value = Number(value);
    }
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return DEFAULT_ITEMS_COUNT;
    }
    return Math.max(1, Math.floor(value));
}

/**
 * Returns the interaction step for the given precision.
 */
export function getRatingStep(precision: RatingPrecision): number {
    return precision === "half" ? 0.5 : 1;
}

/**
 * Rounds a value to the nearest multiple of the given step while avoiding
 * floating-point drift. The result is constrained to one decimal place.
 */
export function normalizeToStep(value: number, step: number): number {
    const normalized = Math.round((value + Number.EPSILON) / step) * step;
    return Number(normalized.toFixed(1));
}

/**
 * Normalizes an externally supplied value for rendering and interaction.
 * Non-finite values become `0`, out-of-range values are clamped to the
 * valid domain, and the result is snapped to the active precision step.
 */
export function normalizeRatingValue(
    value: number,
    itemsCount: number,
    precision: RatingPrecision
): number {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return 0;
    }
    const clamped = Math.max(0, Math.min(itemsCount, value));
    return Math.max(0, Math.min(itemsCount, normalizeToStep(clamped, getRatingStep(precision))));
}

/**
 * Fill amount for one item in continuous selection mode: every item at or
 * below the display value fills fully, one boundary item fills partially.
 */
export function getContinuousItemFill(displayValue: number, itemValue: number): number {
    return Math.max(0, Math.min(1, displayValue - (itemValue - 1)));
}

/**
 * Fill amount for one item in single selection mode: only the item
 * representing the display value fills, possibly partially.
 */
export function getSingleItemFill(displayValue: number, itemValue: number): number {
    if (displayValue === 0) {
        return 0;
    }
    const activeItem = Math.ceil(displayValue);
    if (itemValue !== activeItem) {
        return 0;
    }
    return Math.max(0, Math.min(1, displayValue - (itemValue - 1)));
}

/**
 * Converts a pointer position inside an item into a candidate rating value.
 * Whole-item precision always selects the full item; half precision splits
 * the item into two horizontal regions, honoring the effective text
 * direction so the first visual half maps to the lower value.
 */
export function getPointerRatingValue(args: {
    readonly clientX: number;
    readonly direction: "ltr" | "rtl";
    readonly itemRect: DOMRect;
    readonly itemValue: number;
    readonly precision: RatingPrecision;
}): number {
    const { clientX, direction, itemRect, itemValue, precision } = args;
    if (precision === "item") {
        return itemValue;
    }
    let ratio = (clientX - itemRect.left) / itemRect.width;
    if (direction === "rtl") {
        ratio = 1 - ratio;
    }
    return ratio <= 0.5 ? itemValue - 0.5 : itemValue;
}
