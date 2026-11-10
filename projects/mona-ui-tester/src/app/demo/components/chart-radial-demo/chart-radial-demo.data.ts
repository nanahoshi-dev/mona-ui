/** One ring of the radial bar series: how far a team is towards its goal, in percent. */
export interface GoalRow {
    readonly progress: number | null;
    readonly team: string;
}

/** One petal of the rose series: the hours the wind blew from a direction. */
export interface WindRow {
    readonly direction: string;
    readonly hours: number | null;
}

/** The reading of the gauge series. */
export interface LoadRow {
    readonly load: number | null;
    readonly metric: string;
}

export type RadialDataSet = "empty" | "missing" | "outOfRange" | "typical";

export type RadialSeriesType = "gauge" | "radialBar" | "rose";

/** Five teams, each below its goal. */
export const GOALS: readonly GoalRow[] = [
    { progress: 82, team: "Sales" },
    { progress: 64, team: "Support" },
    { progress: 91, team: "Product" },
    { progress: 47, team: "Marketing" },
    { progress: 73, team: "Design" }
];

/** Support has no reading and Marketing a negative one: radial bars leave both out. */
export const GOALS_WITH_MISSING: readonly GoalRow[] = GOALS.map(row =>
    row.team === "Support" ? { ...row, progress: null } : row.team === "Marketing" ? { ...row, progress: -10 } : row
);

/** Product went past its goal: with a maximum of 100 its ring is full, and the tooltip still says 118. */
export const GOALS_OUT_OF_RANGE: readonly GoalRow[] = GOALS.map(row =>
    row.team === "Product" ? { ...row, progress: 118 } : row
);

/** Eight compass directions, the cyclical categories a rose suits. */
export const WIND: readonly WindRow[] = [
    { direction: "N", hours: 42 },
    { direction: "NE", hours: 31 },
    { direction: "E", hours: 18 },
    { direction: "SE", hours: 12 },
    { direction: "S", hours: 26 },
    { direction: "SW", hours: 48 },
    { direction: "W", hours: 57 },
    { direction: "NW", hours: 39 }
];

/** SE has no reading and W a negative one: the rose keeps their slots empty. */
export const WIND_WITH_MISSING: readonly WindRow[] = WIND.map(row =>
    row.direction === "SE" ? { ...row, hours: null } : row.direction === "W" ? { ...row, hours: -5 } : row
);

export const LOAD: readonly LoadRow[] = [{ load: 72, metric: "CPU" }];

/** The first row has no reading, so the gauge shows the first valid one. */
export const LOAD_WITH_MISSING: readonly LoadRow[] = [
    { load: null, metric: "CPU" },
    { load: 64, metric: "CPU" }
];

/** Past the gauge's maximum of 100: the arc stops at the end and the value is marked as clamped. */
export const LOAD_OUT_OF_RANGE: readonly LoadRow[] = [{ load: 128, metric: "CPU" }];

/** The full names of the compass directions, for the angular axis formatter. */
export const DIRECTION_NAMES: Readonly<Record<string, string>> = {
    E: "East",
    N: "North",
    NE: "Northeast",
    NW: "Northwest",
    S: "South",
    SE: "Southeast",
    SW: "Southwest",
    W: "West"
};

export function radialData(type: RadialSeriesType, set: RadialDataSet): readonly unknown[] {
    if (set === "empty") {
        return [];
    }
    switch (type) {
        case "gauge":
            return set === "missing" ? LOAD_WITH_MISSING : set === "outOfRange" ? LOAD_OUT_OF_RANGE : LOAD;
        case "radialBar":
            return set === "missing" ? GOALS_WITH_MISSING : set === "outOfRange" ? GOALS_OUT_OF_RANGE : GOALS;
        case "rose":
            return set === "missing" ? WIND_WITH_MISSING : WIND;
    }
}
