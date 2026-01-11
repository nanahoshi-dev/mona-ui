import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "../../../theme/models/Theme";
import { VariantInputs } from "../../../utils/VariantInputs";
import {
    calendarBaseVariants as monaCalendarBaseVariants,
    calendarDecadeViewCellVariants as monaCalendarDecadeViewCellVariants,
    calendarDecadeViewTableVariants as monaCalendarDecadeViewTableVariants,
    calendarHeaderVariants as monaCalendarHeaderVariants,
    calendarMonthViewDayVariants as monaCalendarMonthViewDayVariants,
    calendarMonthViewTableVariants as monaCalendarMonthViewTableVariants,
    calendarYearViewCellVariants as monaCalendarYearViewCellVariants,
    calendarYearViewTableVariants as monaCalendarYearViewTableVariants
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

export const calendarDecadeViewTableThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaCalendarDecadeViewTableVariants;
        default:
            return monaCalendarDecadeViewTableVariants;
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

export const calendarMonthViewTableThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaCalendarMonthViewTableVariants;
        default:
            return monaCalendarMonthViewTableVariants;
    }
};

export const calendarYearViewTableThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaCalendarYearViewTableVariants;
        default:
            return monaCalendarYearViewTableVariants;
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

type CalendarDecadeViewTableVariantProps = VariantProps<ReturnType<typeof calendarDecadeViewTableThemeVariants>>;
type CalendarDecadeViewTableVariantInput = VariantInputs<CalendarDecadeViewTableVariantProps>;

type CalendarDecadeViewCellVariantProps = VariantProps<ReturnType<typeof calendarDecadeViewCellThemeVariants>>;
type CalendarDecadeViewCellVariantInput = VariantInputs<CalendarDecadeViewCellVariantProps>;

type CalendarMonthViewDayVariantProps = VariantProps<ReturnType<typeof calendarMonthViewDayThemeVariants>>;
type CalendarMonthViewDayVariantInput = VariantInputs<CalendarMonthViewDayVariantProps>;

type CalendarMonthViewTableVariantProps = VariantProps<ReturnType<typeof calendarMonthViewTableThemeVariants>>;
type CalendarMonthViewTableVariantInput = VariantInputs<CalendarMonthViewTableVariantProps>;

type CalendarYearViewTableVariantProps = VariantProps<ReturnType<typeof calendarYearViewTableThemeVariants>>;
type CalendarYearViewTableVariantInput = VariantInputs<CalendarYearViewTableVariantProps>;

type CalendarYearViewCellVariantProps = VariantProps<ReturnType<typeof calendarYearViewCellThemeVariants>>;
type CalendarYearViewCellVariantInput = VariantInputs<CalendarYearViewCellVariantProps>;

export type CalendarVariantProps = CalendarBaseVariantProps &
    CalendarHeaderVariantProps &
    CalendarDecadeViewTableVariantProps &
    CalendarDecadeViewCellVariantProps &
    CalendarMonthViewDayVariantProps &
    CalendarMonthViewTableVariantProps &
    CalendarYearViewTableVariantProps &
    CalendarYearViewCellVariantProps;
export type CalendarVariantInput = CalendarBaseVariantInput &
    CalendarHeaderVariantInput &
    CalendarDecadeViewTableVariantInput &
    Omit<CalendarDecadeViewCellVariantInput, "focused"> &
    Omit<CalendarMonthViewDayVariantInput, "disabled" | "focused" | "outside" | "selected"> &
    CalendarMonthViewTableVariantInput &
    CalendarYearViewTableVariantInput &
    Omit<CalendarYearViewCellVariantInput, "focused">;

