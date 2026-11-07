import {
    inject,
    makeEnvironmentProviders,
    provideEnvironmentInitializer,
    type EnvironmentProviders
} from "@angular/core";
import type {
    ThemeColorPaletteRegistration,
    ThemeFamilyRegistration,
    ThemeOptions,
    ThemeOverrideRegistration
} from "../models/ThemeDefinition";
import type { ThemeStorage } from "../models/ThemeStorage";
import { ThemeService } from "../services/theme.service";
import {
    THEME_FAMILY_REGISTRATIONS,
    THEME_OPTIONS,
    THEME_OVERRIDE_REGISTRATIONS,
    THEME_ROOT,
    THEME_STORAGE
} from "../tokens/theme.tokens";
import { generateThemeColorPalette } from "../utils/generate-theme-color-palette";

/**
 * Every theme provider applies the theme at startup, so it doesn't depend on something injecting `ThemeService`,
 * and a configuration that can't be applied fails at bootstrap rather than in whichever component came first.
 */
function applyThemeAtStartup(): EnvironmentProviders {
    return provideEnvironmentInitializer(() => {
        inject(ThemeService);
    });
}

export function provideThemeFamily(registration: ThemeFamilyRegistration): EnvironmentProviders {
    return makeEnvironmentProviders([
        { provide: THEME_FAMILY_REGISTRATIONS, multi: true, useValue: registration },
        applyThemeAtStartup()
    ]);
}

export function provideThemeOverrides(registration: ThemeOverrideRegistration): EnvironmentProviders {
    return makeEnvironmentProviders([
        { provide: THEME_OVERRIDE_REGISTRATIONS, multi: true, useValue: registration },
        applyThemeAtStartup()
    ]);
}

export function provideThemeOptions(options: ThemeOptions): EnvironmentProviders {
    return makeEnvironmentProviders([{ provide: THEME_OPTIONS, useValue: options }, applyThemeAtStartup()]);
}

/**
 * Generates a light and a dark palette from the seeds, and applies whichever the theme has.
 */
export function provideThemeColorPalette(registration: ThemeColorPaletteRegistration): EnvironmentProviders {
    const colors = generateThemeColorPalette(registration.seeds);
    return provideThemeOverrides({
        generated: true,
        theme: registration.theme,
        light: { colors: colors.light },
        dark: { colors: colors.dark }
    });
}

/**
 * Applies the theme to an element in place of `<html>`, for an application embedded in part of a page. Overlays
 * render outside any such element, so the overlay container gets the theme too. Each application has its own
 * overlay container, so two embedded applications can have two themes.
 * @param root the element, or a factory for it that runs in an injection context. It has to exist at startup.
 */
export function provideThemeRoot(root: HTMLElement | (() => HTMLElement | null)): EnvironmentProviders {
    return makeEnvironmentProviders([
        typeof root === "function"
            ? { provide: THEME_ROOT, useFactory: root }
            : { provide: THEME_ROOT, useValue: root },
        applyThemeAtStartup()
    ]);
}

/**
 * Replaces where the theme is remembered, which is `localStorage` by default. Only used when
 * `provideThemeOptions()` has a `persistKey`. Supply something the server can read too, such as a cookie, to have a
 * server-rendered application render the remembered theme rather than correcting it on hydration.
 * @param storage the storage, or a factory for it that runs in an injection context
 */
export function provideThemeStorage(storage: ThemeStorage | (() => ThemeStorage)): EnvironmentProviders {
    return makeEnvironmentProviders([
        typeof storage === "function"
            ? { provide: THEME_STORAGE, useFactory: storage }
            : { provide: THEME_STORAGE, useValue: storage },
        applyThemeAtStartup()
    ]);
}
