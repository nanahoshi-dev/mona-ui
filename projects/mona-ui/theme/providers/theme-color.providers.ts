import { makeEnvironmentProviders, type EnvironmentProviders } from "@angular/core";
import type { ThemeColorRegistration } from "../models/ThemeDefinition";
import { THEME_COLOR_REGISTRATIONS } from "../tokens/theme-color.tokens";

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
