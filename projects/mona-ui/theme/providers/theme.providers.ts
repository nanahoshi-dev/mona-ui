import { makeEnvironmentProviders, type EnvironmentProviders } from "@angular/core";
import type {
    ThemeColorPaletteRegistration,
    ThemeFamilyRegistration,
    ThemeOptions,
    ThemeOverrideRegistration
} from "../models/ThemeDefinition";
import { THEME_FAMILY_REGISTRATIONS, THEME_OPTIONS, THEME_OVERRIDE_REGISTRATIONS } from "../tokens/theme.tokens";
import { generateThemeColorPalette } from "../utils/generate-theme-color-palette";

export function provideThemeFamily(registration: ThemeFamilyRegistration): EnvironmentProviders {
    return makeEnvironmentProviders([{ provide: THEME_FAMILY_REGISTRATIONS, multi: true, useValue: registration }]);
}

export function provideThemeOverrides(registration: ThemeOverrideRegistration): EnvironmentProviders {
    return makeEnvironmentProviders([{ provide: THEME_OVERRIDE_REGISTRATIONS, multi: true, useValue: registration }]);
}

export function provideThemeOptions(options: ThemeOptions): EnvironmentProviders {
    return makeEnvironmentProviders([{ provide: THEME_OPTIONS, useValue: options }]);
}

export function provideThemeColorPalette(registration: ThemeColorPaletteRegistration): EnvironmentProviders {
    const colors = generateThemeColorPalette(registration.seeds);
    return provideThemeOverrides({
        theme: registration.theme,
        light: { colors: colors.light },
        dark: { colors: colors.dark }
    });
}
