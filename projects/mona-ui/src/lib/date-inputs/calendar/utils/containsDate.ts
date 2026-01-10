import { select } from "@mirei/ts-collections";
import { DateTime } from "luxon";

export const containsDate = (date: Date, dates: Iterable<Date>): boolean => {
    const dateTime = DateTime.fromJSDate(date);
    return select(dates, d => DateTime.fromJSDate(d)).any(
        d => d.hasSame(dateTime, "day") && d.hasSame(dateTime, "month") && d.hasSame(dateTime, "year")
    );
};
