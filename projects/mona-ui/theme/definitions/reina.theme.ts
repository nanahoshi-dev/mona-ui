import { generatePrimaryColorPalette } from "../utils/generateThemeColors";
import { themeColorMap } from "../utils/themeColorMap";
import { monaDarkThemeVariables, monaLightThemeVariables } from "./mona.theme";
import type { ThemeDefinition } from "../models/ThemeDefinition";

export const reinaThemeDefinition: ThemeDefinition = {
    light: {
        ...monaLightThemeVariables(),
        ...generatePrimaryColorPalette(themeColorMap.reina),

        "--color-canvas": "oklch(0.965 0.003 260)",
        "--color-surface": "oklch(1 0 0)",
        "--color-surface-muted": "oklch(0.965 0.003 260)",
        "--color-surface-raised": "oklch(1 0 0)",
        "--color-surface-overlay": "oklch(1 0 0)",

        "--color-background": "oklch(0.965 0.003 260)",
        "--color-background-dark": "oklch(0.94 0.004 260)",
        "--color-foreground": "oklch(0.145 0.005 260)",
        "--color-hover": "oklch(0.95 0.004 260)",
        "--color-active": "oklch(0.905 0.006 260)",
        "--color-selected": "oklch(0.90 0.045 260)",

        "--color-accent": "oklch(0.93 0.006 260)",
        "--color-accent-dark": "oklch(0.885 0.008 260)",
        "--color-accent-foreground": "oklch(0.20 0.006 260)",
        "--color-accent-hover": "oklch(0.91 0.006 260)",
        "--color-accent-active": "oklch(0.87 0.01 260)",

        "--color-input-background": "oklch(1 0 0)",
        "--color-input-border": "oklch(0.84 0.006 260)",
        "--color-input-hover": "oklch(0.96 0.004 260)",
        "--color-input-active": "oklch(0.98 0.003 260)",

        "--color-border-subtle": "oklch(0.91 0.004 260)",
        "--color-border-control": "oklch(0.84 0.006 260)",
        "--color-border-control-hover": "oklch(0.76 0.008 260)",
        "--color-focus-indicator": "oklch(0.60 0.192 259.4)",
        "--color-border": "oklch(0.87 0.005 260)",

        "--color-secondary": "oklch(0.93 0.006 260)",
        "--color-secondary-foreground": "oklch(0.20 0.006 260)",
        "--color-secondary-hover": "oklch(0.91 0.006 260)",
        "--color-secondary-active": "oklch(0.87 0.01 260)",

        "--color-success": "oklch(0.72 0.19 149)",
        "--color-success-foreground": "oklch(0.99 0.005 149)",
        "--color-success-hover": "oklch(0.76 0.19 149)",
        "--color-success-active": "oklch(0.65 0.19 149)",
        "--color-success-selected": "oklch(0.83 0.16 149)",

        "--color-error": "oklch(0.635 0.225 29)",
        "--color-error-foreground": "oklch(0.99 0.005 29)",
        "--color-error-hover": "oklch(0.675 0.225 29)",
        "--color-error-active": "oklch(0.575 0.225 29)",
        "--color-error-selected": "oklch(0.78 0.19 29)",

        "--color-warning": "oklch(0.75 0.17 58)",
        "--color-warning-foreground": "oklch(0.22 0.03 58)",
        "--color-warning-hover": "oklch(0.79 0.17 58)",
        "--color-warning-active": "oklch(0.68 0.17 58)",
        "--color-warning-selected": "oklch(0.85 0.15 58)",

        "--color-info": "oklch(0.585 0.19 263)",
        "--color-info-foreground": "oklch(0.99 0.005 263)",
        "--color-info-hover": "oklch(0.625 0.19 263)",
        "--color-info-active": "oklch(0.525 0.19 263)",
        "--color-info-selected": "oklch(0.75 0.15 263)",

        "--shadow-control": "0 1px 2px rgb(0 0 0 / 0.04)",
        "--shadow-raised": "0 4px 12px rgb(0 0 0 / 0.08)",
        "--shadow-overlay": "0 20px 40px rgb(0 0 0 / 0.16)"
    },
    dark: {
        ...monaDarkThemeVariables(),
        ...generatePrimaryColorPalette(themeColorMap.reina),

        "--color-canvas": "oklch(0.08 0 0)",
        "--color-surface": "oklch(0.13 0.004 260)",
        "--color-surface-muted": "oklch(0.11 0.004 260)",
        "--color-surface-raised": "oklch(0.16 0.005 260)",
        "--color-surface-overlay": "oklch(0.18 0.006 260)",

        "--color-background": "oklch(0.08 0 0)",
        "--color-background-dark": "oklch(0.06 0 0)",
        "--color-foreground": "oklch(0.97 0.003 260)",
        "--color-hover": "oklch(0.19 0.006 260)",
        "--color-active": "oklch(0.23 0.008 260)",
        "--color-selected": "oklch(0.26 0.03 260)",

        "--color-accent": "oklch(0.20 0.008 260)",
        "--color-accent-dark": "oklch(0.24 0.01 260)",
        "--color-accent-foreground": "oklch(0.96 0.003 260)",
        "--color-accent-hover": "oklch(0.23 0.008 260)",
        "--color-accent-active": "oklch(0.27 0.012 260)",

        "--color-input-background": "oklch(0.15 0.005 260)",
        "--color-input-border": "oklch(0.27 0.008 260)",
        "--color-input-hover": "oklch(0.18 0.006 260)",
        "--color-input-active": "oklch(0.20 0.006 260)",

        "--color-border-subtle": "oklch(0.22 0.005 260)",
        "--color-border-control": "oklch(0.30 0.007 260)",
        "--color-border-control-hover": "oklch(0.40 0.009 260)",
        "--color-focus-indicator": "oklch(0.68 0.17 259.4)",
        "--color-border": "oklch(0.24 0.006 260)",

        "--color-secondary": "oklch(0.20 0.008 260)",
        "--color-secondary-foreground": "oklch(0.96 0.003 260)",
        "--color-secondary-hover": "oklch(0.23 0.008 260)",
        "--color-secondary-active": "oklch(0.27 0.012 260)",

        "--color-success": "oklch(0.70 0.19 149)",
        "--color-success-foreground": "oklch(0.12 0.02 149)",
        "--color-success-hover": "oklch(0.74 0.19 149)",
        "--color-success-active": "oklch(0.63 0.19 149)",
        "--color-success-selected": "oklch(0.80 0.16 149)",

        "--color-error": "oklch(0.65 0.22 29)",
        "--color-error-foreground": "oklch(0.13 0.02 29)",
        "--color-error-hover": "oklch(0.69 0.22 29)",
        "--color-error-active": "oklch(0.58 0.22 29)",
        "--color-error-selected": "oklch(0.79 0.18 29)",

        "--color-warning": "oklch(0.76 0.17 58)",
        "--color-warning-foreground": "oklch(0.16 0.02 58)",
        "--color-warning-hover": "oklch(0.80 0.17 58)",
        "--color-warning-active": "oklch(0.69 0.17 58)",
        "--color-warning-selected": "oklch(0.85 0.15 58)",

        "--color-info": "oklch(0.66 0.18 263)",
        "--color-info-foreground": "oklch(0.13 0.02 263)",
        "--color-info-hover": "oklch(0.70 0.18 263)",
        "--color-info-active": "oklch(0.60 0.18 263)",
        "--color-info-selected": "oklch(0.79 0.15 263)",

        "--shadow-control": "0 1px 2px rgb(0 0 0 / 0.30)",
        "--shadow-raised": "0 4px 16px rgb(0 0 0 / 0.45)",
        "--shadow-overlay": "0 20px 48px rgb(0 0 0 / 0.55)"
    }
};
