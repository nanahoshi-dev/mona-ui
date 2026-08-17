export type ChartAnimationEasing = "linear" | "ease-in" | "ease-out" | "ease-in-out";

export interface ChartAnimationOptions {
    readonly data?: boolean;
    readonly duration?: number;
    readonly easing?: ChartAnimationEasing;
    readonly enabled?: boolean;
    readonly initial?: boolean;
    readonly visibility?: boolean;
}

export type ChartAnimationInput = boolean | ChartAnimationOptions;
