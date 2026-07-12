import { type ThemeStyle, createInheritedThemeStrategy } from "@nanahoshi/mona-ui/theme";
import { createMonaCalendarVariants, createReinaCalendarVariants } from "./calendar.style-composition";
import type { CalendarStyleOverrides, CalendarStyleStrategy, CalendarVariantsBundle } from "./calendar.types";

const defaultCalendarStrategy = createInheritedThemeStrategy<CalendarVariantsBundle>(
    createMonaCalendarVariants([], "mona"),
    { reina: createReinaCalendarVariants([], "reina") }
);

export const calendarThemeVariants = (theme: ThemeStyle): CalendarVariantsBundle =>
    defaultCalendarStrategy.resolve(theme);

export function createCalendarStyleStrategy(overrides: readonly CalendarStyleOverrides[] = []): CalendarStyleStrategy {
    const mona = createMonaCalendarVariants(overrides, "mona");
    const reina = createReinaCalendarVariants(overrides, "reina");
    return createInheritedThemeStrategy<CalendarVariantsBundle>(mona, { reina: reina });
}
