import type { ThemeFamilyRegistration, ThemeComponents, ThemeMotion } from "../models/ThemeDefinition";
import { monaThemeColors } from "./mona-theme-colors";
import { monaThemeShadows } from "./mona-theme-shadows";

const motion: ThemeMotion = Object.freeze({
    "--mona-motion-fast": "200ms",
    "--mona-motion-standard": "300ms"
});

function createComponents(): ThemeComponents {
    return Object.freeze({
        "--mona-calendar-shadow": "var(--shadow-raised)",
        "--mona-list-background": "transparent",
        "--mona-list-disabled-background": "transparent",
        "--mona-list-group-background": "transparent",
        "--mona-list-group-border-width": "0px",
        "--mona-list-group-font-weight": "700",
        "--mona-menubar-shadow": "var(--shadow-raised)",
        "--mona-slider-handle-border-color": "color-mix(in srgb, var(--color-focus-indicator) 50%, transparent)",
        "--mona-tab-content-background": "var(--color-surface)"
    });
}

export const monaTheme = Object.freeze({
    name: "mona",
    variants: {
        light: Object.freeze({
            colors: monaThemeColors.light,
            components: createComponents(),
            motion,
            shadows: monaThemeShadows.light
        }),
        dark: Object.freeze({
            colors: monaThemeColors.dark,
            components: createComponents(),
            motion,
            shadows: monaThemeShadows.dark
        })
    }
} satisfies ThemeFamilyRegistration);
