import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "../../../theme/models/Theme";
import { VariantInputs } from "../../../utils/VariantInputs";
import {
    calendarBaseVariants as monaCalendarBaseVariants,
    calendarDecadeViewTableVariants as monaCalendarDecadeViewTableVariants,
    calendarHeaderVariants as monaCalendarHeaderVariants,
    calendarMonthViewDayVariants as monaCalendarMonthViewDayVariants,
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

export const calendarMonthViewDayThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaCalendarMonthViewDayVariants;
        default:
            return monaCalendarMonthViewDayVariants;
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

type CalendarBaseVariantProps = VariantProps<ReturnType<typeof calendarBaseThemeVariants>>;
type CalendarBaseVariantInput = VariantInputs<CalendarBaseVariantProps>;

type CalendarHeaderVariantProps = VariantProps<ReturnType<typeof calendarHeaderThemeVariants>>;
type CalendarHeaderVariantInput = VariantInputs<CalendarHeaderVariantProps>;

type CalendarDecadeViewTableVariantProps = VariantProps<ReturnType<typeof calendarDecadeViewTableThemeVariants>>;
type CalendarDecadeViewTableVariantInput = VariantInputs<CalendarDecadeViewTableVariantProps>;

type CalendarMonthViewDayVariantProps = VariantProps<ReturnType<typeof calendarMonthViewDayThemeVariants>>;
type CalendarMonthViewDayVariantInput = VariantInputs<CalendarMonthViewDayVariantProps>;

type CalendarYearViewTableVariantProps = VariantProps<ReturnType<typeof calendarYearViewTableThemeVariants>>;
type CalendarYearViewTableVariantInput = VariantInputs<CalendarYearViewTableVariantProps>;

export type CalendarVariantProps = CalendarBaseVariantProps &
    CalendarHeaderVariantProps &
    CalendarDecadeViewTableVariantProps &
    CalendarMonthViewDayVariantProps &
    CalendarYearViewTableVariantProps;
export type CalendarVariantInput = CalendarBaseVariantInput &
    CalendarHeaderVariantInput &
    CalendarDecadeViewTableVariantInput &
    Omit<CalendarMonthViewDayVariantInput, "disabled" | "focused" | "outside" | "selected"> &
    CalendarYearViewTableVariantInput;
