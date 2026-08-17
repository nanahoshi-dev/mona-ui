import type { ChartAnimationEasing } from "../../models/chart-animation.models";

export type ChartEasingFn = (t: number) => number;

export function linear(t: number): number {
    const clamped = t <= 0 ? 0 : t >= 1 ? 1 : t;
    return clamped;
}

export function easeIn(t: number): number {
    const clamped = t <= 0 ? 0 : t >= 1 ? 1 : t;
    return clamped * clamped * clamped;
}

export function easeOut(t: number): number {
    const clamped = t <= 0 ? 0 : t >= 1 ? 1 : t;
    const inv = 1 - clamped;
    return 1 - inv * inv * inv;
}

export function easeInOut(t: number): number {
    const clamped = t <= 0 ? 0 : t >= 1 ? 1 : t;
    return clamped < 0.5 ? 4 * clamped * clamped * clamped : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
}

const EASING_MAP: Record<ChartAnimationEasing, ChartEasingFn> = {
    "ease-in": easeIn,
    "ease-in-out": easeInOut,
    "ease-out": easeOut,
    linear
};

export function getEasingFunction(easing: ChartAnimationEasing): ChartEasingFn {
    return EASING_MAP[easing] ?? easeOut;
}
