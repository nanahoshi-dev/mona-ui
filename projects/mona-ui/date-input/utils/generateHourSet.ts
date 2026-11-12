import { ImmutableSet, select, sequence } from "@mirei/ts-collections";
import type { HourFormat } from "../models/HourFormat";
import type { Meridiem } from "../models/Meridiem";
import type { TimeUnit } from "../models/TimeUnit";

/** @hidden Exported for Mona UI's other entry points; applications don't need it. */
export const generateHourSet = (
    hourFormat: HourFormat,
    meridiem: Meridiem,
    step: number = 1
): ImmutableSet<TimeUnit> => {
    if (hourFormat === "24") {
        return select(sequence(0, 23, step), h => ({ value: h, viewValue: h })).toImmutableSet();
    }
    if (meridiem === "AM") {
        return select(sequence(1, 11, step), h => ({ value: h, viewValue: h }))
            .prepend({ value: 0, viewValue: 12 })
            .toImmutableSet();
    }
    return select(sequence(1, 11, step), h => ({ value: h + 12, viewValue: h }))
        .prepend({ value: 12, viewValue: 12 })
        .toImmutableSet();
};

/** @hidden Exported for Mona UI's other entry points; applications don't need it. */
export const generateMinuteSet = (step: number = 1): ImmutableSet<TimeUnit> => {
    return select(sequence(0, 59, step), m => ({ value: m, viewValue: m })).toImmutableSet();
};

/** @hidden Exported for Mona UI's other entry points; applications don't need it. */
export const generateSecondSet = (step: number = 1): ImmutableSet<TimeUnit> => {
    return select(sequence(0, 59, step), s => ({ value: s, viewValue: s })).toImmutableSet();
};
