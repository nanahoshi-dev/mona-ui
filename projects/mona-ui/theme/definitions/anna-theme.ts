import type { ThemeFamilyRegistration, ThemeComponents, ThemeMotion } from "../models/ThemeDefinition";
import { annaThemeColors } from "./anna-theme-colors";
import { annaThemeShadows } from "./anna-theme-shadows";
import { createDefaultThemeEffects, createDefaultThemeShape } from "./theme-primitives";

const motion: ThemeMotion = Object.freeze({
    "--mona-motion-fast": "150ms",
    "--mona-motion-standard": "150ms"
});

const components: ThemeComponents = Object.freeze({
    "--mona-calendar-background": "var(--color-input-background)",
    "--mona-calendar-shadow": "none",
    "--mona-list-background": "var(--color-surface)",
    "--mona-list-disabled-background": "var(--color-disabled-background)",
    "--mona-list-group-background": "var(--color-surface-muted)",
    "--mona-list-group-border-width": "1px",
    "--mona-list-group-font-weight": "600",
    "--mona-menubar-background": "var(--color-surface-muted)",
    "--mona-menubar-shadow": "none",
    "--mona-pager-background": "var(--color-surface-muted)",
    "--mona-slider-handle-border-color": "var(--color-focus-indicator)",
    "--mona-tab-list-background": "var(--color-surface-muted)",
    "--mona-tab-content-background": "transparent"
});

export const annaTheme = Object.freeze({
    name: "anna",
    variants: {
        dark: Object.freeze({
            colors: annaThemeColors.dark,
            components,
            effects: createDefaultThemeEffects(),
            motion,
            shape: createDefaultThemeShape(),
            shadows: annaThemeShadows.dark
        })
    }
} satisfies ThemeFamilyRegistration);
