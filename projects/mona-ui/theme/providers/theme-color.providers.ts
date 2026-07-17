import { makeEnvironmentProviders, type EnvironmentProviders } from "@angular/core";
import type { ThemeColorPaletteRegistration, ThemeColorRegistration } from "../models/ThemeDefinition";
import { THEME_COLOR_REGISTRATIONS } from "../tokens/theme-color.tokens";
import { generateThemeColorPalette } from "../utils/generate-theme-color-palette";

/**
 * Registers root-level color additions and overrides for a Mona UI theme.
 * Later registrations take precedence over earlier registrations.
 */
export function provideThemeColors(registration: ThemeColorRegistration): EnvironmentProviders {
    return makeEnvironmentProviders([
        {
            provide: THEME_COLOR_REGISTRATIONS,
            multi: true,
            useValue: registration
        }
    ]);
}

/**
 * Registers seed-generated theme colors through the same ordered override pipeline as explicit colors.
 */
export function provideThemeColorPalette(registration: ThemeColorPaletteRegistration): EnvironmentProviders {
    return provideThemeColors({
        theme: registration.theme,
        colors: generateThemeColorPalette(registration.seeds)
    });
}
