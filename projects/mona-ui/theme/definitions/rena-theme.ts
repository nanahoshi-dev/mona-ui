import type { ThemeComponents, ThemeFamilyRegistration, ThemeMotion } from "../models/ThemeDefinition";
import { renaThemeColors } from "./rena-theme-colors";
import { renaThemeShadows } from "./rena-theme-shadows";
import { createDefaultThemeEffects, createDefaultThemeShape } from "./theme-primitives";

// 150ms is Tailwind CSS's default transition, and a short standard keeps menus and popups brisk.
const motion: ThemeMotion = Object.freeze({
    "--mona-motion-fast": "150ms",
    "--mona-motion-standard": "200ms"
});

const components: ThemeComponents = Object.freeze({
    "--mona-calendar-background": "var(--color-surface)",
    "--mona-calendar-shadow": "var(--shadow-raised)",
    "--mona-list-background": "var(--color-surface)",
    "--mona-list-disabled-background": "var(--color-disabled-background)",
    "--mona-list-group-background": "var(--color-surface-muted)",
    "--mona-list-group-border-width": "1px",
    "--mona-list-group-font-weight": "600",
    "--mona-menubar-background": "var(--color-surface)",
    "--mona-menubar-shadow": "var(--shadow-control)",
    "--mona-pager-background": "var(--color-surface)",
    "--mona-slider-handle-border-color": "var(--color-focus-indicator)"
});

// A focused or invalid control gets a solid 1px ring outside its recolored border, which together read as one 2px
// line, in place of the translucent 2px halo the other themes draw.
const focusRing = Object.freeze({
    "--mona-focus-ring-opacity": "100%",
    "--mona-focus-ring-width": "1px"
});

export const renaTheme = Object.freeze({
    name: "rena",
    variants: {
        light: Object.freeze({
            colors: renaThemeColors.light,
            components,
            // Indigo-600 is 6.3:1 on white, so it serves as it is. These are set anyway, so that a part of the page in
            // Rena Light doesn't inherit the dark variant's lighter indigo.
            custom: Object.freeze({
                ...focusRing,
                "--mona-indicator-color": "var(--color-primary)",
                "--mona-indicator-foreground": "var(--color-primary-foreground)",
                "--mona-primary-text-color": "var(--color-primary)"
            }),
            effects: createDefaultThemeEffects(),
            motion,
            shape: createDefaultThemeShape(),
            shadows: renaThemeShadows.light
        }),
        dark: Object.freeze({
            colors: renaThemeColors.dark,
            components,
            // Indigo-600 is 2.6:1 on Rena Dark's surface: fine under white text, not as the only thing showing a value.
            // Fills and text in the primary color take indigo-400 instead, which is 4.9:1 or more on every surface.
            custom: Object.freeze({
                ...focusRing,
                "--mona-indicator-color": "var(--color-focus-indicator)",
                "--mona-indicator-foreground": "#111827",
                "--mona-primary-text-color": "var(--color-focus-indicator)"
            }),
            effects: createDefaultThemeEffects(),
            motion,
            shape: createDefaultThemeShape(),
            shadows: renaThemeShadows.dark
        })
    }
} satisfies ThemeFamilyRegistration);
