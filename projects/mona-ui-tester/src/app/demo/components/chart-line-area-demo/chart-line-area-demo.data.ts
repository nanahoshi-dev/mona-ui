/** One row of the Line & Area playground: two measures for the line and area series, and a band for range area. */
export interface TrafficPoint {
    readonly date: Date;
    readonly high: number | null;
    readonly label: string;
    readonly low: number | null;
    readonly signups: number | null;
    readonly visitors: number | null;
}

export type TrafficDataSet = "daily" | "empty" | "gaps" | "monthly";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Twelve months on a category axis. */
export const MONTHLY_TRAFFIC: readonly TrafficPoint[] = MONTHS.map((label, index) => {
    const visitors = Math.round(3200 + index * 260 + Math.sin(index / 1.7) * 700);
    const signups = Math.round(visitors * (0.32 + Math.cos(index / 2.2) * 0.06));
    return {
        date: new Date(Date.UTC(2026, index, 1)),
        high: visitors + 600 + (index % 3) * 150,
        label,
        low: visitors - 700 - (index % 4) * 120,
        signups,
        visitors
    };
});

/** A quarter of days on a time axis, enough to pan and zoom. */
export const DAILY_TRAFFIC: readonly TrafficPoint[] = Array.from({ length: 120 }, (_, index) => {
    const date = new Date(Date.UTC(2026, 0, 1 + index));
    const weekly = Math.sin((index / 7) * Math.PI * 2) * 260;
    const visitors = Math.round(1800 + index * 9 + weekly + Math.sin(index / 11) * 300);
    return {
        date,
        high: visitors + 280,
        label: date.toISOString().slice(0, 10),
        low: visitors - 320,
        signups: Math.round(visitors * 0.3 + Math.cos(index / 5) * 60),
        visitors
    };
});

/** The months with two missing readings, to show `connectNulls`. */
export const TRAFFIC_WITH_GAPS: readonly TrafficPoint[] = MONTHLY_TRAFFIC.map((point, index) =>
    index === 4 || index === 8 ? { ...point, high: null, low: null, signups: null, visitors: null } : point
);

export function trafficData(set: TrafficDataSet): readonly TrafficPoint[] {
    switch (set) {
        case "daily":
            return DAILY_TRAFFIC;
        case "empty":
            return [];
        case "gaps":
            return TRAFFIC_WITH_GAPS;
        case "monthly":
            return MONTHLY_TRAFFIC;
    }
}
