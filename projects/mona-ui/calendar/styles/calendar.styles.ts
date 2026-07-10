import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
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

const calendarBaseThemeVariantsStrategy = createThemeStrategy(
    { mona: monaCalendarBaseVariants },
    monaCalendarBaseVariants
);

export const calendarBaseThemeVariants = (theme: ThemeStyle) => calendarBaseThemeVariantsStrategy.resolve(theme);

const calendarHeaderThemeVariantsStrategy = createThemeStrategy(
    { mona: monaCalendarHeaderVariants },
    monaCalendarHeaderVariants
);

export const calendarHeaderThemeVariants = (theme: ThemeStyle) => calendarHeaderThemeVariantsStrategy.resolve(theme);

const calendarDecadeViewGridThemeVariantsStrategy = createThemeStrategy(
    { mona: monaCalendarDecadeViewGridVariants },
    monaCalendarDecadeViewGridVariants
);

export const calendarDecadeViewGridThemeVariants = (theme: ThemeStyle) =>
    calendarDecadeViewGridThemeVariantsStrategy.resolve(theme);

const calendarDecadeViewCellThemeVariantsStrategy = createThemeStrategy(
    { mona: monaCalendarDecadeViewCellVariants },
    monaCalendarDecadeViewCellVariants
);

export const calendarDecadeViewCellThemeVariants = (theme: ThemeStyle) =>
    calendarDecadeViewCellThemeVariantsStrategy.resolve(theme);

const calendarMonthViewDayThemeVariantsStrategy = createThemeStrategy(
    { mona: monaCalendarMonthViewDayVariants },
    monaCalendarMonthViewDayVariants
);

export const calendarMonthViewDayThemeVariants = (theme: ThemeStyle) =>
    calendarMonthViewDayThemeVariantsStrategy.resolve(theme);

const calendarMonthViewGridThemeVariantsStrategy = createThemeStrategy(
    { mona: monaCalendarMonthViewGridVariants },
    monaCalendarMonthViewGridVariants
);

export const calendarMonthViewGridThemeVariants = (theme: ThemeStyle) =>
    calendarMonthViewGridThemeVariantsStrategy.resolve(theme);

const calendarMonthViewGridHeaderThemeVariantsStrategy = createThemeStrategy(
    { mona: monaCalendarMonthViewGridHeaderVariants },
    monaCalendarMonthViewGridHeaderVariants
);

export const calendarMonthViewGridHeaderThemeVariants = (theme: ThemeStyle) =>
    calendarMonthViewGridHeaderThemeVariantsStrategy.resolve(theme);

const calendarYearViewGridThemeVariantsStrategy = createThemeStrategy(
    { mona: monaCalendarYearViewGridVariants },
    monaCalendarYearViewGridVariants
);

export const calendarYearViewGridThemeVariants = (theme: ThemeStyle) =>
    calendarYearViewGridThemeVariantsStrategy.resolve(theme);

const calendarYearViewCellThemeVariantsStrategy = createThemeStrategy(
    { mona: monaCalendarYearViewCellVariants },
    monaCalendarYearViewCellVariants
);

export const calendarYearViewCellThemeVariants = (theme: ThemeStyle) =>
    calendarYearViewCellThemeVariantsStrategy.resolve(theme);

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
