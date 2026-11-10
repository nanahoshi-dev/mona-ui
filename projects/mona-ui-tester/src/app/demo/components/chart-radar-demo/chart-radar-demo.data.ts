/** One spoke of the radar playground: a product's score on one metric, this release and the target. */
export interface ScorePoint {
    readonly current: number | null;
    readonly metric: string;
    readonly target: number | null;
}

/** One bearing of the polar playground: the average wind and the gusts from that direction. */
export interface WindPoint {
    readonly bearing: number;
    readonly gust: number | null;
    readonly wind: number | null;
}

export type RadialDataSet = "basic" | "empty" | "gaps" | "many";

const METRICS = ["Performance", "Reliability", "Usability", "Security", "Accessibility", "Documentation"];

const MORE_METRICS = [...METRICS, "Test coverage", "Bundle size", "Startup time", "Localization", "Theming", "Support"];

/** Six metrics scored out of 100. */
export const SCORES: readonly ScorePoint[] = METRICS.map((metric, index) => ({
    current: [82, 74, 88, 69, 91, 58][index],
    metric,
    target: [90, 85, 85, 80, 95, 75][index]
}));

/** Twelve metrics, for a busier set of spokes. */
export const MANY_SCORES: readonly ScorePoint[] = MORE_METRICS.map((metric, index) => ({
    current: Math.round(62 + Math.sin(index * 1.3) * 18 + (index % 3) * 4),
    metric,
    target: Math.round(80 + Math.cos(index * 0.9) * 8)
}));

/** The six metrics with two scores missing, to show `connectNulls`. */
export const SCORES_WITH_GAPS: readonly ScorePoint[] = SCORES.map((point, index) =>
    index === 1 || index === 4 ? { ...point, current: null } : point
);

/** Wind every 30 degrees, in km/h. */
export const WIND: readonly WindPoint[] = Array.from({ length: 12 }, (_, index) => {
    const bearing = index * 30;
    const wind = Math.round(14 + Math.cos(((bearing - 240) * Math.PI) / 180) * 9 + (index % 2) * 2);
    return { bearing, gust: Math.round(wind * 1.6 + 4), wind };
});

/** Wind every 5 degrees, for a smooth continuous line. */
export const DENSE_WIND: readonly WindPoint[] = Array.from({ length: 72 }, (_, index) => {
    const bearing = index * 5;
    const radians = ((bearing - 240) * Math.PI) / 180;
    const wind = Math.round((14 + Math.cos(radians) * 9 + Math.sin(radians * 3) * 2) * 10) / 10;
    return { bearing, gust: Math.round((wind * 1.6 + 4) * 10) / 10, wind };
});

/** Wind every 30 degrees with two bearings missing, to show `connectNulls`. */
export const WIND_WITH_GAPS: readonly WindPoint[] = WIND.map((point, index) =>
    index === 3 || index === 8 ? { ...point, gust: null, wind: null } : point
);

export function scoreData(set: RadialDataSet): readonly ScorePoint[] {
    switch (set) {
        case "basic":
            return SCORES;
        case "empty":
            return [];
        case "gaps":
            return SCORES_WITH_GAPS;
        case "many":
            return MANY_SCORES;
    }
}

export function windData(set: RadialDataSet): readonly WindPoint[] {
    switch (set) {
        case "basic":
            return WIND;
        case "empty":
            return [];
        case "gaps":
            return WIND_WITH_GAPS;
        case "many":
            return DENSE_WIND;
    }
}
