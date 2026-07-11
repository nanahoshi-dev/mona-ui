import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createCalendarStyleStrategy } from "./calendar.style-strategy";
import type { CalendarStyleOverrides, CalendarStyleStrategy, CalendarStylesProviderConfig } from "./calendar.types";

export const CALENDAR_STYLE_OVERRIDES = new InjectionToken<readonly CalendarStyleOverrides[]>(
    "CALENDAR_STYLE_OVERRIDES"
);

export const CALENDAR_STYLE_STRATEGY = new InjectionToken<CalendarStyleStrategy>("CALENDAR_STYLE_STRATEGY", {
    providedIn: "root",
    factory: () => createCalendarStyleStrategy(inject(CALENDAR_STYLE_OVERRIDES, { optional: true }) ?? [])
});

export function provideCalendarStyles(config: CalendarStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: CALENDAR_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: CALENDAR_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
