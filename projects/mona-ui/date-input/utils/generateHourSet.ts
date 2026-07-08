import { ImmutableSet, select, sequence } from "@mirei/ts-collections";
import { HourFormat } from "../models/HourFormat";
import { Meridiem } from "../models/Meridiem";
import { TimeUnit } from "../models/TimeUnit";

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

export const generateMinuteSet = (step: number = 1): ImmutableSet<TimeUnit> => {
    return select(sequence(0, 59, step), m => ({ value: m, viewValue: m })).toImmutableSet();
};

export const generateSecondSet = (step: number = 1): ImmutableSet<TimeUnit> => {
    return select(sequence(0, 59, step), s => ({ value: s, viewValue: s })).toImmutableSet();
};
