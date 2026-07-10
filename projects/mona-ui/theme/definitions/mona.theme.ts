import { generatePrimaryColorPalette } from "../utils/generateThemeColors";
import { themeColorMap } from "../utils/themeColorMap";
import type { ThemeDefinition, ThemeVariables } from "../models/ThemeDefinition";

export function monaDarkThemeVariables(): ThemeVariables {
    return {
        "--color-canvas": "oklch(0.21 0 0)",
        "--color-surface": "oklch(0.21 0 0)",
        "--color-surface-muted": "oklch(0.18 0 0)",
        "--color-surface-raised": "oklch(0.24 0 0)",
        "--color-surface-overlay": "oklch(0.27 0 0)",
        "--color-border-subtle": "oklch(0.24 0.002 286.18)",
        "--color-border-control": "oklch(0.32 0.004 286.18)",
        "--color-border-control-hover": "oklch(0.42 0.006 286.18)",
        "--color-focus-indicator": "oklch(0.72 0.12 265)",
        "--color-disabled": "oklch(0.55 0.006 286.32)",
        "--color-disabled-background": "oklch(0.26 0.003 286.32)",
        "--color-success-subtle": "oklch(0.28 0.06 149.214)",
        "--color-success-border": "oklch(0.45 0.12 149.214)",
        "--color-error-subtle": "oklch(0.28 0.05 27.325)",
        "--color-error-border": "oklch(0.45 0.12 27.325)",
        "--color-warning-subtle": "oklch(0.30 0.06 58.318)",
        "--color-warning-border": "oklch(0.50 0.11 58.318)",
        "--color-info-subtle": "oklch(0.27 0.06 262.881)",
        "--color-info-border": "oklch(0.45 0.10 262.881)",
        "--shadow-control": "0 1px 2px rgb(0 0 0 / 0.20)",
        "--shadow-raised": "0 2px 6px rgb(0 0 0 / 0.30)",
        "--shadow-overlay": "0 8px 24px rgb(0 0 0 / 0.40)",

        "--color-background": "oklch(0.21 0 0)",
        "--color-background-dark": "oklch(0.19 0 0)",
        "--color-foreground": "oklch(100% 0.001 106.424)",
        "--color-hover": "oklch(22.5% 0 0)",
        "--color-active": "oklch(19.5% 0 0)",
        "--color-selected": "oklch(24% 0 0)",

        "--color-header-background": "oklch(0.18 0 0)",
        "--color-header-foreground": "oklch(0.20 0 0)",

        "--color-accent": "oklch(24.5% 0 0)",
        "--color-accent-dark": "oklch(21.5% 0 0)",
        "--color-accent-foreground": "oklch(97% 0 0)",
        "--color-accent-hover": "oklch(26.5% 0 0)",
        "--color-accent-active": "oklch(31.5% 0 0)",

        "--color-input-background": "oklch(0.20 0 0)",
        "--color-input-border": "oklch(0.12 0 0)",
        "--color-input-hover": "oklch(0.22 0 0)",
        "--color-input-active": "oklch(0.21 0 0)",

        "--color-popover": "#fff",
        "--color-popover-foreground": "#09090b",

        ...generatePrimaryColorPalette(themeColorMap.flora),

        "--color-secondary": "oklch(0.27 0 0)",
        "--color-secondary-foreground": "oklch(97.7% 0.001 106.424)",
        "--color-secondary-hover": "oklch(0.29 0 0)",
        "--color-secondary-active": "oklch(0.31 0 0)",

        "--color-success": "oklch(62.7% 0.194 149.214)",
        "--color-success-foreground": "oklch(94.3% 0.029 294.588)",
        "--color-success-hover": "oklch(66.7% 0.194 149.214)",
        "--color-success-active": "oklch(54.7% 0.194 149.214)",
        "--color-success-selected": "oklch(76.7% 0.194 149.214)",

        "--color-error": "oklch(57.7% 0.245 27.325)",
        "--color-error-foreground": "oklch(94.3% 0.029 294.588)",
        "--color-error-hover": "oklch(61.7% 0.245 27.325)",
        "--color-error-active": "oklch(53.7% 0.245 27.325)",
        "--color-error-selected": "oklch(71.7% 0.245 27.325)",

        "--color-warning": "oklch(66.6% 0.179 58.318)",
        "--color-warning-foreground": "oklch(94.3% 0.029 294.588)",
        "--color-warning-hover": "oklch(70.6% 0.179 58.318)",
        "--color-warning-active": "oklch(58.6% 0.179 58.318)",
        "--color-warning-selected": "oklch(80.6% 0.179 58.318)",

        "--color-info": "oklch(54.6% 0.245 262.881)",
        "--color-info-foreground": "oklch(94.3% 0.029 294.588)",
        "--color-info-hover": "oklch(58.6% 0.245 262.881)",
        "--color-info-active": "oklch(46.6% 0.245 262.881)",
        "--color-info-selected": "oklch(68.6% 0.245 262.881)",

        "--color-muted": "#f4f4f5",
        "--color-muted-foreground": "#71717a",

        "--color-border": "oklch(0.1689 0.0021 286.18)",
        "--color-input": "#e4e4e7",

        "--color-chart-1": "#e76e50",
        "--color-chart-2": "#2a9d90",
        "--color-chart-3": "#274754",
        "--color-chart-4": "#e8c468",
        "--color-chart-5": "#f4a462",

        "--color-scrollbar-thumb": "#d1d5db",
        "--color-scrollbar-thumb-hover": "#9ca3af",
        "--color-scrollbar-thumb-active": "#6b7280",
        "--color-scrollbar-thumb-focus": "#9ca3af",
        "--color-scrollbar-track": "#f9fafb",
        "--color-scrollbar-track-hover": "#f4f5f7",
        "--color-scrollbar-track-active": "#e5e7eb",
        "--color-scrollbar-track-focus": "#f4f5f7",
        "--color-scrollbar-corner": "#f9fafb",
        "--page-background": "#1a1b1c",
    };
}

export function monaLightThemeVariables(): ThemeVariables {
    return {
        "--color-canvas": "oklch(1 0 0)",
        "--color-surface": "oklch(1 0 0)",
        "--color-surface-muted": "oklch(0.98 0.003 286.32)",
        "--color-surface-raised": "oklch(1 0 0)",
        "--color-surface-overlay": "oklch(1 0 0)",
        "--color-border-subtle": "oklch(0.92 0.004 286.32)",
        "--color-border-control": "oklch(0.84 0.004 286.32)",
        "--color-border-control-hover": "oklch(0.76 0.006 286.32)",
        "--color-focus-indicator": "oklch(0.50 0.008 286.32)",
        "--color-disabled": "oklch(0.55 0.006 286.32)",
        "--color-disabled-background": "oklch(0.94 0.003 286.32)",
        "--color-success-subtle": "oklch(93% 0.06 149.214)",
        "--color-success-border": "oklch(76% 0.12 149.214)",
        "--color-error-subtle": "oklch(94% 0.035 27.325)",
        "--color-error-border": "oklch(76% 0.12 27.325)",
        "--color-warning-subtle": "oklch(94% 0.05 58.318)",
        "--color-warning-border": "oklch(78% 0.11 58.318)",
        "--color-info-subtle": "oklch(94% 0.03 262.881)",
        "--color-info-border": "oklch(75% 0.10 262.881)",
        "--shadow-control": "0 1px 2px rgb(9 9 11 / 0.03)",
        "--shadow-raised": "0 2px 6px rgb(9 9 11 / 0.10)",
        "--shadow-overlay": "0 8px 24px rgb(9 9 11 / 0.14)",

        "--color-background": "oklch(1 0 0)",
        "--color-background-dark": "oklch(0.99 0 0)",
        "--color-foreground": "oklch(0.1407 0.0044 285.82)",
        "--color-hover": "oklch(0.96 0 0)",
        "--color-active": "oklch(0.94 0 0)",
        "--color-selected": "#f4f5f7",

        "--color-header-background": "oklch(0.97 0 0)",
        "--color-header-foreground": "oklch(0.99 0 0)",

        "--color-accent": "oklch(0.96 0 0)",
        "--color-accent-dark": "oklch(0.93 0 0)",
        "--color-accent-foreground": "oklch(0.21 0 0)",
        "--color-accent-hover": "oklch(0.95 0 0)",
        "--color-accent-active": "oklch(0.90 0 0)",

        "--color-input-background": "oklch(1 0 0)",
        "--color-input-border": "oklch(0.92 0 0)",
        "--color-input-hover": "oklch(0.95 0 0)",
        "--color-input-active": "oklch(0.98 0 0)",

        "--color-popover": "#fff",
        "--color-popover-foreground": "#09090b",

        ...generatePrimaryColorPalette("oklch(0.21 0.01 0)"),

        "--color-secondary": "oklch(.97 0 0)",
        "--color-secondary-foreground": "oklch(0.21 0 0)",
        "--color-secondary-hover": "oklch(0.95 0 0)",
        "--color-secondary-active": "oklch(0.90 0 0)",

        "--color-success": "oklch(62.7% 0.194 149.214)",
        "--color-success-foreground": "oklch(97.7% 0.001 106.424)",
        "--color-success-hover": "oklch(66.7% 0.194 149.214)",
        "--color-success-active": "oklch(54.7% 0.194 149.214)",
        "--color-success-selected": "oklch(76.7% 0.194 149.214)",

        "--color-error": "oklch(57.7% 0.245 27.325)",
        "--color-error-foreground": "oklch(94.3% 0.029 294.588)",
        "--color-error-hover": "oklch(61.7% 0.245 27.325)",
        "--color-error-active": "oklch(53.7% 0.245 27.325)",
        "--color-error-selected": "oklch(71.7% 0.245 27.325)",

        "--color-warning": "oklch(66.6% 0.179 58.318)",
        "--color-warning-foreground": "oklch(94.3% 0.029 294.588)",
        "--color-warning-hover": "oklch(70.6% 0.179 58.318)",
        "--color-warning-active": "oklch(58.6% 0.179 58.318)",
        "--color-warning-selected": "oklch(80.6% 0.179 58.318)",

        "--color-info": "oklch(54.6% 0.245 262.881)",
        "--color-info-foreground": "oklch(94.3% 0.029 294.588)",
        "--color-info-hover": "oklch(58.6% 0.245 262.881)",
        "--color-info-active": "oklch(46.6% 0.245 262.881)",
        "--color-info-selected": "oklch(68.6% 0.245 262.881)",

        "--color-muted": "#f4f4f5",
        "--color-muted-foreground": "#71717a",

        "--color-destructive": "#ef4444",
        "--color-destructive-foreground": "#fafafa",

        "--color-border": "oklch(0.9197 0.004 286.32)",
        "--color-input": "#e4e4e7",

        "--color-chart-1": "#e76e50",
        "--color-chart-2": "#2a9d90",
        "--color-chart-3": "#274754",
        "--color-chart-4": "#e8c468",
        "--color-chart-5": "#f4a462",

        "--color-scrollbar-thumb": "#d1d5db",
        "--color-scrollbar-thumb-hover": "#9ca3af",
        "--color-scrollbar-thumb-active": "#6b7280",
        "--color-scrollbar-thumb-focus": "#9ca3af",
        "--color-scrollbar-track": "#f9fafb",
        "--color-scrollbar-track-hover": "#f4f5f7",
        "--color-scrollbar-track-active": "#e5e7eb",
        "--color-scrollbar-track-focus": "#f4f5f7",
        "--color-scrollbar-corner": "#f9fafb",

        "--page-background": "#fff",
    };
}

export const monaThemeDefinition: ThemeDefinition = {
    light: monaLightThemeVariables(),
    dark: monaDarkThemeVariables()
};
