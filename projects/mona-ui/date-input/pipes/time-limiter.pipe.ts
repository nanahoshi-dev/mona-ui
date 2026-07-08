import { Pipe, PipeTransform } from "@angular/core";
import { ImmutableSet, toImmutableSet, where } from "@mirei/ts-collections";
import { DateTime } from "luxon";
import { TimeUnit } from "../models/TimeUnit";

@Pipe({
    name: "timeLimiter"
})
export class TimeLimiterPipe implements PipeTransform {
    public transform(
        timeValues: Iterable<TimeUnit>,
        type: "h" | "m" | "s",
        currentDate: DateTime,
        min?: DateTime | null,
        max?: DateTime | null
    ): ImmutableSet<TimeUnit> {
        if (!min && !max) {
            return toImmutableSet(timeValues);
        }
        const normalizedMin = min
            ? min.set({ year: currentDate.year, month: currentDate.month, day: currentDate.day })
            : null;
        const normalizedMax = max
            ? max.set({ year: currentDate.year, month: currentDate.month, day: currentDate.day })
            : null;
        const unitMap = { h: "hour", m: "minute", s: "second" } as const;
        const luxonUnit = unitMap[type];
        const result = where(timeValues, timeUnit => {
            const testDate = currentDate.set({ [luxonUnit]: timeUnit.value });
            const isAfterMin = normalizedMin ? testDate >= normalizedMin.startOf(luxonUnit) : true;
            const isBeforeMax = normalizedMax ? testDate <= normalizedMax.endOf(luxonUnit) : true;
            return isAfterMin && isBeforeMax;
        });
        return result.toImmutableSet();
    }
}
