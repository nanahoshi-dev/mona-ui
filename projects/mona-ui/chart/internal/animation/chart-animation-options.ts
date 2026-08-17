import type {
    ChartAnimationEasing,
    ChartAnimationInput,
    ChartAnimationOptions
} from "../../models/chart-animation.models";

export interface NormalizedChartAnimationOptions {
    readonly data: boolean;
    readonly duration: number;
    readonly easing: ChartAnimationEasing;
    readonly enabled: boolean;
    readonly initial: boolean;
    readonly visibility: boolean;
}

export const DEFAULT_CHART_ANIMATION_OPTIONS: NormalizedChartAnimationOptions = {
    data: true,
    duration: 300,
    easing: "ease-out",
    enabled: true,
    initial: true,
    visibility: true
};

const VALID_EASINGS = new Set<ChartAnimationEasing>(["linear", "ease-in", "ease-out", "ease-in-out"]);

export function normalizeChartAnimationOptions(
    input: ChartAnimationInput | undefined
): NormalizedChartAnimationOptions {
    if (input === false) {
        return {
            ...DEFAULT_CHART_ANIMATION_OPTIONS,
            duration: 0,
            enabled: false
        };
    }

    if (input === true || input === undefined || input === null) {
        return DEFAULT_CHART_ANIMATION_OPTIONS;
    }

    if (typeof input !== "object") {
        return DEFAULT_CHART_ANIMATION_OPTIONS;
    }

    const enabled = input.enabled ?? DEFAULT_CHART_ANIMATION_OPTIONS.enabled;

    let duration: number;
    if (!enabled) {
        duration = 0;
    } else if (input.duration === undefined) {
        duration = DEFAULT_CHART_ANIMATION_OPTIONS.duration;
    } else if (typeof input.duration !== "number" || !Number.isFinite(input.duration) || input.duration < 0) {
        duration = DEFAULT_CHART_ANIMATION_OPTIONS.duration;
    } else {
        duration = Math.min(10000, input.duration);
    }

    const easing: ChartAnimationEasing =
        input.easing && VALID_EASINGS.has(input.easing) ? input.easing : DEFAULT_CHART_ANIMATION_OPTIONS.easing;

    const initial = input.initial ?? DEFAULT_CHART_ANIMATION_OPTIONS.initial;
    const data = input.data ?? DEFAULT_CHART_ANIMATION_OPTIONS.data;
    const visibility = input.visibility ?? DEFAULT_CHART_ANIMATION_OPTIONS.visibility;

    return {
        data,
        duration,
        easing,
        enabled,
        initial,
        visibility
    };
}
