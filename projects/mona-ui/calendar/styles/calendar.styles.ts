import { VariantInputs } from "@mirei/mona-ui/common";
import { ThemeStyle } from "@mirei/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    calendarBaseVariants as monaCalendarBaseVariants,
    calendarDecadeViewCellVariants as monaCalendarDecadeViewCellVariants,
    calendarDecadeViewGridVariants as monaCalendarDecadeViewGridVariants,
    calendarHeaderVariants as monaCalendarHeaderVariants,
    calendarMonthViewDayVariants as monaCalendarMonthViewDayVariants,
    calendarMonthViewGridHeaderVariants as monaCalendarMonthViewGridHeaderVariants,
    calendarMonthViewGridVariants as monaCalendarMonthViewGridVariants,
    calendarYearViewCellVariants as monaCalendarYearViewCellVariants,
    calendarYearViewGridVariants as monaCalendarYearViewGridVariants
} from "./calendar.mona.styles";

export const calendarBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaCalendarBaseVariants;
        default:
            return monaCalendarBaseVariants;
    }
};

export const calendarHeaderThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaCalendarHeaderVariants;
        default:
            return monaCalendarHeaderVariants;
    }
};

export const calendarDecadeViewGridThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaCalendarDecadeViewGridVariants;
        default:
            return monaCalendarDecadeViewGridVariants;
    }
};

export const calendarDecadeViewCellThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaCalendarDecadeViewCellVariants;
        default:
            return monaCalendarDecadeViewCellVariants;
    }
};

export const calendarMonthViewDayThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaCalendarMonthViewDayVariants;
        default:
            return monaCalendarMonthViewDayVariants;
    }
};

export const calendarMonthViewGridThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaCalendarMonthViewGridVariants;
        default:
            return monaCalendarMonthViewGridVariants;
    }
};

export const calendarMonthViewGridHeaderThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaCalendarMonthViewGridHeaderVariants;
        default:
            return monaCalendarMonthViewGridHeaderVariants;
    }
};

export const calendarYearViewGridThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaCalendarYearViewGridVariants;
        default:
            return monaCalendarYearViewGridVariants;
    }
};

export const calendarYearViewCellThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaCalendarYearViewCellVariants;
        default:
            return monaCalendarYearViewCellVariants;
    }
};

type CalendarBaseVariantProps = VariantProps<ReturnType<typeof calendarBaseThemeVariants>>;
type CalendarBaseVariantInput = VariantInputs<CalendarBaseVariantProps>;

type CalendarHeaderVariantProps = VariantProps<ReturnType<typeof calendarHeaderThemeVariants>>;
type CalendarHeaderVariantInput = VariantInputs<CalendarHeaderVariantProps>;

type CalendarDecadeViewGridVariantProps = VariantProps<ReturnType<typeof calendarDecadeViewGridThemeVariants>>;
type CalendarDecadeViewGridVariantInput = VariantInputs<CalendarDecadeViewGridVariantProps>;

type CalendarDecadeViewCellVariantProps = VariantProps<ReturnType<typeof calendarDecadeViewCellThemeVariants>>;
type CalendarDecadeViewCellVariantInput = VariantInputs<CalendarDecadeViewCellVariantProps>;

type CalendarMonthViewDayVariantProps = VariantProps<ReturnType<typeof calendarMonthViewDayThemeVariants>>;
type CalendarMonthViewDayVariantInput = VariantInputs<CalendarMonthViewDayVariantProps>;

type CalendarMonthViewGridVariantProps = VariantProps<ReturnType<typeof calendarMonthViewGridThemeVariants>>;
type CalendarMonthViewGridVariantInput = VariantInputs<CalendarMonthViewGridVariantProps>;

type CalendarMonthViewGridHeaderVariantProps = VariantProps<
    ReturnType<typeof calendarMonthViewGridHeaderThemeVariants>
>;
type CalendarMonthViewGridHeaderVariantInput = VariantInputs<CalendarMonthViewGridHeaderVariantProps>;

type CalendarYearViewGridVariantProps = VariantProps<ReturnType<typeof calendarYearViewGridThemeVariants>>;
type CalendarYearViewGridVariantInput = VariantInputs<CalendarYearViewGridVariantProps>;

type CalendarYearViewCellVariantProps = VariantProps<ReturnType<typeof calendarYearViewCellThemeVariants>>;
type CalendarYearViewCellVariantInput = VariantInputs<CalendarYearViewCellVariantProps>;

export type CalendarVariantProps = CalendarBaseVariantProps &
    CalendarHeaderVariantProps &
    CalendarDecadeViewGridVariantProps &
    CalendarDecadeViewCellVariantProps &
    CalendarMonthViewDayVariantProps &
    CalendarMonthViewGridVariantProps &
    CalendarMonthViewGridHeaderVariantProps &
    CalendarYearViewGridVariantProps &
    CalendarYearViewCellVariantProps;
export type CalendarVariantInput = CalendarBaseVariantInput &
    CalendarHeaderVariantInput &
    CalendarDecadeViewGridVariantInput &
    Omit<CalendarDecadeViewCellVariantInput, "focused"> &
    Omit<CalendarMonthViewDayVariantInput, "disabled" | "focused" | "outside" | "rangePreview" | "selected" | "today"> &
    CalendarMonthViewGridVariantInput &
    CalendarMonthViewGridHeaderVariantInput &
    CalendarYearViewGridVariantInput &
    Omit<CalendarYearViewCellVariantInput, "focused">;
