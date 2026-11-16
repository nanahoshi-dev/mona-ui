import type { ThemeComponents, ThemeFamilyRegistration, ThemeMotion } from "../models/ThemeDefinition";
import { annaThemeColors } from "./anna-theme-colors";
import { annaThemeShadows } from "./anna-theme-shadows";
import { createDefaultThemeEffects, createDefaultThemeShape } from "./theme-primitives";

const motion: ThemeMotion = Object.freeze({
    "--mona-motion-fast": "150ms",
    "--mona-motion-standard": "150ms"
});

const components: ThemeComponents = Object.freeze({
    // A calendar is a panel, not a field, so it keeps the surface rather than the lifted control fill.
    "--mona-calendar-background": "var(--color-surface)",
    "--mona-calendar-shadow": "none",
    "--mona-list-background": "var(--color-surface)",
    "--mona-list-disabled-background": "var(--color-disabled-background)",
    "--mona-list-group-background": "var(--color-surface-muted)",
    "--mona-list-group-border-width": "1px",
    "--mona-list-group-font-weight": "600",
    "--mona-menubar-background": "var(--color-surface-muted)",
    "--mona-menubar-shadow": "none",
    "--mona-pager-background": "var(--color-surface-muted)",
    "--mona-slider-handle-border-color": "var(--color-focus-indicator)"
});

export const annaTheme = Object.freeze({
    name: "anna",
    variants: {
        light: Object.freeze({
            colors: annaThemeColors.light,
            components,
            // The deep violet is 8.4:1 on the light surface, so what's drawn by a fill alone takes it as it is. It's
            // set here anyway, so that a part of the page in Anna Light doesn't inherit the dark variant's lighter one.
            custom: Object.freeze({
                "--mona-indicator-color": "var(--color-primary)",
                "--mona-indicator-foreground": "var(--color-primary-foreground)"
            }),
            effects: createDefaultThemeEffects(),
            motion,
            shape: createDefaultThemeShape(),
            shadows: annaThemeShadows.light
        }),
        dark: Object.freeze({
            colors: annaThemeColors.dark,
            components,
            // The violet fill is 1.73:1 on Anna's surface, which is fine under a label and not as the only thing
            // showing a value. What's drawn by a fill alone takes the lighter violet instead.
            custom: Object.freeze({
                "--mona-indicator-color": "var(--color-primary-border)",
                "--mona-indicator-foreground": "#161718"
            }),
            effects: createDefaultThemeEffects(),
            motion,
            shape: createDefaultThemeShape(),
            shadows: annaThemeShadows.dark
        })
    }
} satisfies ThemeFamilyRegistration);
