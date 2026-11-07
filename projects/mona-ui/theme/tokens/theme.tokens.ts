import { DOCUMENT, inject, InjectionToken, PLATFORM_ID } from "@angular/core";
import type { ThemeFamilyRegistration, ThemeOptions, ThemeOverrideRegistration } from "../models/ThemeDefinition";
import type { ThemeStorage } from "../models/ThemeStorage";
import { DefaultThemeStrategy } from "../strategies/default-theme.strategy";
import { LocalStorageThemeStorage } from "../strategies/local-storage-theme.strategy";
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
/**
 * The element the theme is written to. Defaults to `<html>`. Replace it with `provideThemeRoot()`.
 */
export const THEME_ROOT = new InjectionToken<HTMLElement | null>("Mona UI theme root", {
    providedIn: "root",
    factory: () => inject(DOCUMENT).documentElement ?? null
});
/**
 * Where the theme is remembered when `provideThemeOptions()` has a `persistKey`. Defaults to `localStorage`.
 * Replace it with `provideThemeStorage()`.
 */
export const THEME_STORAGE = new InjectionToken<ThemeStorage>("Mona UI theme storage", {
    providedIn: "root",
    factory: () => new LocalStorageThemeStorage(inject(PLATFORM_ID))
});
export const THEME_STRATEGY = new InjectionToken<ThemeStrategy>("Mona UI theme strategy", {
    providedIn: "root",
    factory: () =>
        new DefaultThemeStrategy(
            inject(THEME_FAMILY_REGISTRATIONS, { optional: true }) ?? [],
            inject(THEME_OVERRIDE_REGISTRATIONS, { optional: true }) ?? []
        )
});
