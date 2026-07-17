import { inject, InjectionToken } from "@angular/core";
import type { ThemeColorRegistration } from "../models/ThemeDefinition";
import { DefaultThemeColorStrategy } from "../strategies/default-theme-color.strategy";
import type { ThemeColorStrategy } from "../strategies/theme-color.strategy";

export const THEME_COLOR_REGISTRATIONS = new InjectionToken<readonly ThemeColorRegistration[]>(
    "Mona UI theme color registrations"
);

export const THEME_COLOR_STRATEGY = new InjectionToken<ThemeColorStrategy>("Mona UI theme color strategy", {
    providedIn: "root",
    factory: () => new DefaultThemeColorStrategy(inject(THEME_COLOR_REGISTRATIONS, { optional: true }) ?? [])
});
