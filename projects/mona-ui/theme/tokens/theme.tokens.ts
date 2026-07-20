import { inject, InjectionToken } from "@angular/core";
import type { ThemeFamilyRegistration, ThemeOptions, ThemeOverrideRegistration } from "../models/ThemeDefinition";
import { DefaultThemeStrategy } from "../strategies/default-theme.strategy";
import type { ThemeStrategy } from "../strategies/theme.strategy";

export const THEME_FAMILY_REGISTRATIONS = new InjectionToken<readonly ThemeFamilyRegistration[]>(
    "Mona UI theme family registrations"
);
export const THEME_OVERRIDE_REGISTRATIONS = new InjectionToken<readonly ThemeOverrideRegistration[]>(
    "Mona UI theme override registrations"
);
export const THEME_OPTIONS = new InjectionToken<ThemeOptions>("Mona UI theme options", {
    providedIn: "root",
    factory: () => ({ initialTheme: { name: "mona", variant: "light" } })
});
export const THEME_STRATEGY = new InjectionToken<ThemeStrategy>("Mona UI theme strategy", {
    providedIn: "root",
    factory: () =>
        new DefaultThemeStrategy(
            inject(THEME_FAMILY_REGISTRATIONS, { optional: true }) ?? [],
            inject(THEME_OVERRIDE_REGISTRATIONS, { optional: true }) ?? []
        )
});
