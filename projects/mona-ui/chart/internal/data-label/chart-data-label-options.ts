import type {
    ChartDataLabelFormatter,
    ChartDataLabelPosition,
    ChartDataLabelsInput
} from "../../models/chart-data-label.models";

export interface NormalizedChartDataLabelOptions {
    readonly allowOverlap: boolean;
    readonly collisionPadding: number;
    readonly color?: string;
    readonly enabled: boolean;
    readonly formatter?: ChartDataLabelFormatter;
    readonly maxLabels: number;
    readonly offset: number;
    readonly overflow: "clip" | "hide";
    readonly position: ChartDataLabelPosition;
}

export const DEFAULT_CHART_DATA_LABEL_OPTIONS: NormalizedChartDataLabelOptions = {
    allowOverlap: false,
    collisionPadding: 2,
    enabled: false,
    maxLabels: 200,
    offset: 6,
    overflow: "hide",
    position: "auto"
};

export function normalizeChartDataLabelOptions(
    input: ChartDataLabelsInput | undefined
): NormalizedChartDataLabelOptions {
    if (!input) {
        return DEFAULT_CHART_DATA_LABEL_OPTIONS;
    }

    if (input === true) {
        return {
            ...DEFAULT_CHART_DATA_LABEL_OPTIONS,
            enabled: true
        };
    }

    const rawMax = input.maxLabels ?? 200;
    const maxLabels = !Number.isFinite(rawMax) || rawMax <= 0 ? 0 : Math.floor(rawMax);

    const rawOffset = input.offset ?? 6;
    const offset = Number.isFinite(rawOffset) ? rawOffset : 6;

    const rawPadding = input.collisionPadding ?? 2;
    const collisionPadding = Number.isFinite(rawPadding) && rawPadding >= 0 ? rawPadding : 2;

    return {
        allowOverlap: !!input.allowOverlap,
        color: input.color,
        collisionPadding,
        enabled: true,
        formatter: input.formatter,
        maxLabels,
        offset,
        overflow: input.overflow === "clip" ? "clip" : "hide",
        position: input.position ?? "auto"
    };
}
