import type { ThemeColors, ThemeDefinition } from "../models/ThemeDefinition";
import { generateThemeColorPalette } from "../utils/generate-theme-color-palette";

const generatedRoles = generateThemeColorPalette({
    primary: "#583573",
    secondary: "#3A3B40",
    success: "#32BEA6",
    error: "#FF3055",
    warning: "#FFDA6B",
    info: "#4DA3FF"
});

const dark: ThemeColors = Object.freeze({
    "--color-canvas": "#202123",
    "--color-surface": "#1D1E20",
    "--color-surface-muted": "#161718",
    "--color-surface-raised": "#242528",
    "--color-surface-overlay": "#161718",

    "--color-foreground": "#D6D6D8",
    "--color-muted-foreground": "#A8A8AD",

    "--color-input-background": "#1D1E20",
    "--color-input-foreground": "var(--color-foreground)",
    "--color-border-subtle": "#0F0F10",
    "--color-border": "#131416",
    "--color-border-control": "#0F0F10",
    "--color-border-control-hover": "#17181A",

    "--color-hover": "#242528",
    "--color-active": "#2A2B2E",

    "--color-disabled-foreground": "#9A9AA0",
    "--color-disabled-background": "#1A1B1D",
    "--color-disabled-border": "#111214",

    ...generatedRoles.dark,

    "--color-primary": "#583573",
    "--color-primary-foreground": "#F5EFF8",
    "--color-primary-hover": "#684484",
    "--color-primary-active": "#472A5E",
    "--color-primary-selected": "#583573",
    "--color-primary-subtle": "#2B2131",
    "--color-primary-subtle-foreground": "#DABFEA",
    "--color-primary-border": "#A174C2",

    "--color-secondary": "#34353A",
    "--color-secondary-foreground": "#F0F0F2",
    "--color-secondary-hover": "#414247",
    "--color-secondary-active": "#292A2E",
    "--color-secondary-selected": "#414247",
    "--color-secondary-subtle": "#232428",
    "--color-secondary-subtle-foreground": "#D6D6D8",
    "--color-secondary-border": "#777880",

    "--color-accent": "#583573",
    "--color-accent-foreground": "#F5EFF8",
    "--color-accent-hover": "#684484",
    "--color-accent-active": "#472A5E",
    "--color-accent-dark": "var(--color-accent-active)",
    "--color-selected": "var(--color-accent)",
    "--color-focus-indicator": "#A174C2",

    "--color-background": "var(--color-surface)",
    "--color-background-dark": "var(--color-surface-muted)",
    "--color-header-background": "var(--color-surface-muted)",
    "--color-header-foreground": "var(--color-foreground)",
    "--color-input-border": "var(--color-border-control)",
    "--color-input-hover": "var(--color-hover)",
    "--color-input-active": "var(--color-surface-raised)",
    "--color-popover": "var(--color-surface-overlay)",
    "--color-popover-foreground": "var(--color-foreground)",
    "--color-muted": "var(--color-surface-muted)",
    "--color-destructive": "var(--color-error)",
    "--color-destructive-foreground": "var(--color-error-foreground)",
    "--color-input": "var(--color-border-control)",
    "--color-disabled": "var(--color-disabled-foreground)",

    "--color-chart-1": "#A174C2",
    "--color-chart-2": "#6F4A8A",
    "--color-chart-3": "#4DA3FF",
    "--color-chart-4": "#32BEA6",
    "--color-chart-5": "#FFDA6B",

    "--color-scrollbar-thumb": "#34353A",
    "--color-scrollbar-thumb-hover": "#4A4B51",
    "--color-scrollbar-thumb-active": "#62636A",
    "--color-scrollbar-thumb-focus": "var(--color-focus-indicator)",
    "--color-scrollbar-track": "#161718",
    "--color-scrollbar-track-hover": "#1D1E20",
    "--color-scrollbar-track-active": "#242528",
    "--color-scrollbar-track-focus": "#2B2131",
    "--color-scrollbar-corner": "#161718"
});

export const annaThemeColors = Object.freeze({ dark } satisfies ThemeDefinition);
