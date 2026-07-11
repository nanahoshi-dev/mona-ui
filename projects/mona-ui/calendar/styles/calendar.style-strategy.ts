import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { createMonaCalendarVariants, createReinaCalendarVariants } from "./calendar.style-composition";
import type { CalendarStyleOverrides, CalendarStyleStrategy, CalendarVariantsBundle } from "./calendar.types";

const defaultCalendarStrategy = createThemeStrategy<CalendarVariantsBundle>(
    {
        mona: createMonaCalendarVariants([], "mona"),
        reina: createReinaCalendarVariants([], "reina")
    },
    createMonaCalendarVariants([], "mona")
);

export const calendarThemeVariants = (theme: ThemeStyle): CalendarVariantsBundle =>
    defaultCalendarStrategy.resolve(theme);

export function createCalendarStyleStrategy(overrides: readonly CalendarStyleOverrides[] = []): CalendarStyleStrategy {
    const mona = createMonaCalendarVariants(overrides, "mona");
    const reina = createReinaCalendarVariants(overrides, "reina");
    return createThemeStrategy<CalendarVariantsBundle>({ mona, reina }, mona);
}
