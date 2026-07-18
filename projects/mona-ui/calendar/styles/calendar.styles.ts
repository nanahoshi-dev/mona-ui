import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    calendarBaseVariants as annaCalendarBaseVariants,
    calendarDecadeViewCellVariants as annaCalendarDecadeViewCellVariants,
    calendarDecadeViewGridVariants as annaCalendarDecadeViewGridVariants,
    calendarHeaderVariants as annaCalendarHeaderVariants,
    calendarMonthViewDayVariants as annaCalendarMonthViewDayVariants,
    calendarMonthViewGridHeaderVariants as annaCalendarMonthViewGridHeaderVariants,
    calendarMonthViewGridVariants as annaCalendarMonthViewGridVariants,
    calendarYearViewCellVariants as annaCalendarYearViewCellVariants,
    calendarYearViewGridVariants as annaCalendarYearViewGridVariants
} from "./calendar.anna.styles";
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

export const calendarBaseThemeVariants = createThemeStrategy({
    anna: annaCalendarBaseVariants,
    mona: monaCalendarBaseVariants
});

export const calendarHeaderThemeVariants = createThemeStrategy({
    anna: annaCalendarHeaderVariants,
    mona: monaCalendarHeaderVariants
});

export const calendarDecadeViewGridThemeVariants = createThemeStrategy({
    anna: annaCalendarDecadeViewGridVariants,
    mona: monaCalendarDecadeViewGridVariants
});

export const calendarDecadeViewCellThemeVariants = createThemeStrategy({
    anna: annaCalendarDecadeViewCellVariants,
    mona: monaCalendarDecadeViewCellVariants
});

export const calendarMonthViewDayThemeVariants = createThemeStrategy({
    anna: annaCalendarMonthViewDayVariants,
    mona: monaCalendarMonthViewDayVariants
});

export const calendarMonthViewGridThemeVariants = createThemeStrategy({
    anna: annaCalendarMonthViewGridVariants,
    mona: monaCalendarMonthViewGridVariants
});

export const calendarMonthViewGridHeaderThemeVariants = createThemeStrategy({
    anna: annaCalendarMonthViewGridHeaderVariants,
    mona: monaCalendarMonthViewGridHeaderVariants
});

export const calendarYearViewGridThemeVariants = createThemeStrategy({
    anna: annaCalendarYearViewGridVariants,
    mona: monaCalendarYearViewGridVariants
});

export const calendarYearViewCellThemeVariants = createThemeStrategy({
    anna: annaCalendarYearViewCellVariants,
    mona: monaCalendarYearViewCellVariants
});

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
