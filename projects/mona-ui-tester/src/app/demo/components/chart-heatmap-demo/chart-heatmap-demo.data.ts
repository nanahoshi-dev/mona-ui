/** One cell of the Heatmap playground: a weekday row, an hour column and the value that colors it. */
export interface HourlyCell {
    readonly day: string;
    readonly hour: string;
    readonly value: number | null;
}

export type HourlyDataSet = "activity" | "change" | "empty" | "gaps";

export const DAYS: readonly string[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const HOURS: readonly string[] = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, "0")}:00`);

function bell(hour: number, peak: number, width: number): number {
    return Math.exp(-((hour - peak) ** 2) / width);
}

/** Average visits per hour: office peaks on weekdays and an evening peak at the weekend. */
export const HOURLY_ACTIVITY: readonly HourlyCell[] = DAYS.flatMap((day, dayIndex) =>
    HOURS.map((hour, hourIndex) => {
        const weekend = dayIndex >= 5;
        const base = weekend
            ? 12 + 70 * bell(hourIndex, 20, 10) + 25 * bell(hourIndex, 11, 8)
            : 6 + 85 * bell(hourIndex, 10.5, 6) + 70 * bell(hourIndex, 15, 5) + 20 * bell(hourIndex, 21, 6);
        return { day, hour, value: Math.round(base + ((dayIndex * 7 + hourIndex * 3) % 9)) };
    })
);

/** The change against the week before, in percent, which runs both ways from zero. */
export const HOURLY_CHANGE: readonly HourlyCell[] = DAYS.flatMap((day, dayIndex) =>
    HOURS.map((hour, hourIndex) => ({
        day,
        hour,
        value: Math.round(
            32 * Math.sin((hourIndex + dayIndex * 3) / 4) * Math.cos(dayIndex / 2.5) + ((hourIndex * 5) % 7) - 3
        )
    }))
);

/** The activity with some readings missing and some rows absent, which leave empty cells. */
export const HOURLY_WITH_GAPS: readonly HourlyCell[] = HOURLY_ACTIVITY.filter((_, index) => index % 11 !== 3).map(
    cell => (cell.day === "Sun" && cell.hour < "06:00" ? { ...cell, value: null } : cell)
);

export function hourlyData(set: HourlyDataSet): readonly HourlyCell[] {
    switch (set) {
        case "activity":
            return HOURLY_ACTIVITY;
        case "change":
            return HOURLY_CHANGE;
        case "empty":
            return [];
        case "gaps":
            return HOURLY_WITH_GAPS;
    }
}
