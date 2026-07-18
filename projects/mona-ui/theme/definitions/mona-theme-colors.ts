import type { ThemeColors, ThemeDefinition } from "../models/ThemeDefinition";
import { generateThemeColorPalette } from "../utils/generate-theme-color-palette";

// The public seed API requires a primary color. Mona replaces the generated identity roles with
// the neutral definitions below and keeps the generated output only for chromatic status roles.
const generatedRoles = generateThemeColorPalette({
    primary: "oklch(20.5% 0.006 285.885)",
    secondary: "oklch(55.2% 0.010 285.938)",
    success: "oklch(62% 0.14 150)",
    error: "oklch(58% 0.19 25)",
    warning: "oklch(72% 0.14 75)",
    info: "oklch(60% 0.15 255)"
});

const lightNeutralRoles: ThemeColors = Object.freeze({
    "--color-primary": "oklch(20.5% 0.006 285.885)",
    "--color-primary-foreground": "oklch(98.5% 0 0)",
    "--color-primary-hover": "oklch(26.9% 0.006 285.885)",
    "--color-primary-active": "oklch(14.1% 0.005 285.823)",
    "--color-primary-selected": "oklch(14.1% 0.005 285.823)",
    "--color-primary-subtle": "oklch(96.7% 0.001 286.375)",
    "--color-primary-subtle-foreground": "oklch(26.9% 0.006 285.885)",
    "--color-primary-border": "oklch(55.2% 0.010 285.938)",

    "--color-secondary": "oklch(92.2% 0.004 286.320)",
    "--color-secondary-foreground": "oklch(20.5% 0.006 285.885)",
    "--color-secondary-hover": "oklch(87.1% 0.006 286.286)",
    "--color-secondary-active": "oklch(80.5% 0.008 286.067)",
    "--color-secondary-selected": "oklch(80.5% 0.008 286.067)",
    "--color-secondary-subtle": "oklch(96.7% 0.001 286.375)",
    "--color-secondary-subtle-foreground": "oklch(26.9% 0.006 285.885)",
    "--color-secondary-border": "oklch(55.2% 0.010 285.938)",

    "--color-accent": "oklch(96.7% 0.001 286.375)",
    "--color-accent-foreground": "oklch(20.5% 0.006 285.885)",
    "--color-accent-hover": "oklch(92.2% 0.004 286.320)",
    "--color-accent-active": "oklch(87.1% 0.006 286.286)",
    "--color-accent-dark": "var(--color-accent-active)",
    "--color-selected": "var(--color-accent)",
    "--color-focus-indicator": "var(--color-primary)"
});

const darkNeutralRoles: ThemeColors = Object.freeze({
    "--color-primary": "oklch(92.2% 0.004 286.320)",
    "--color-primary-foreground": "oklch(20.5% 0.006 285.885)",
    "--color-primary-hover": "oklch(87.1% 0.006 286.286)",
    "--color-primary-active": "oklch(80.5% 0.008 286.067)",
    "--color-primary-selected": "oklch(80.5% 0.008 286.067)",
    "--color-primary-subtle": "oklch(27.4% 0.006 286.033)",
    "--color-primary-subtle-foreground": "oklch(92.2% 0.004 286.320)",
    "--color-primary-border": "oklch(65% 0.010 286.067)",

    "--color-secondary": "oklch(27.4% 0.006 286.033)",
    "--color-secondary-foreground": "oklch(98.5% 0 0)",
    "--color-secondary-hover": "oklch(37.1% 0.008 285.805)",
    "--color-secondary-active": "oklch(43.9% 0.010 285.938)",
    "--color-secondary-selected": "oklch(43.9% 0.010 285.938)",
    "--color-secondary-subtle": "oklch(27.4% 0.006 286.033)",
    "--color-secondary-subtle-foreground": "oklch(92.2% 0.004 286.320)",
    "--color-secondary-border": "oklch(65% 0.010 286.067)",

    "--color-accent": "oklch(27.4% 0.006 286.033)",
    "--color-accent-foreground": "oklch(98.5% 0 0)",
    "--color-accent-hover": "oklch(37.1% 0.008 285.805)",
    "--color-accent-active": "oklch(43.9% 0.010 285.938)",
    "--color-accent-dark": "var(--color-accent-active)",
    "--color-selected": "var(--color-accent)",
    "--color-focus-indicator": "var(--color-primary)"
});

const light: ThemeColors = Object.freeze({
    "--color-canvas": "oklch(98.5% 0 0)",
    "--color-surface": "oklch(100% 0 0)",
    "--color-surface-muted": "oklch(96.7% 0.001 286.375)",
    "--color-surface-raised": "oklch(100% 0 0)",
    "--color-surface-overlay": "oklch(100% 0 0)",

    "--color-foreground": "oklch(14.1% 0.005 285.823)",
    "--color-muted-foreground": "oklch(55.2% 0.016 285.938)",

    "--color-input-background": "oklch(100% 0 0)",
    "--color-input-foreground": "var(--color-foreground)",
    "--color-border-subtle": "oklch(94% 0.002 286.320)",
    "--color-border": "oklch(92.2% 0.004 286.320)",
    "--color-border-control": "oklch(87.1% 0.006 286.286)",
    "--color-border-control-hover": "oklch(80.5% 0.008 286.067)",

    "--color-hover": "oklch(96.7% 0.001 286.375)",
    "--color-active": "oklch(92.2% 0.004 286.320)",

    "--color-disabled-foreground": "oklch(46% 0.010 285.938)",
    "--color-disabled-background": "oklch(96.7% 0.001 286.375)",
    "--color-disabled-border": "oklch(92.2% 0.004 286.320)",

    ...generatedRoles.light,
    ...lightNeutralRoles,

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

    "--color-chart-1": "oklch(20.5% 0.006 285.885)",
    "--color-chart-2": "oklch(37.1% 0.008 285.805)",
    "--color-chart-3": "oklch(55.2% 0.010 285.938)",
    "--color-chart-4": "oklch(70.5% 0.010 286.067)",
    "--color-chart-5": "oklch(87.1% 0.006 286.286)",

    "--color-scrollbar-thumb": "oklch(80.5% 0.008 286.067)",
    "--color-scrollbar-thumb-hover": "oklch(70.5% 0.010 286.067)",
    "--color-scrollbar-thumb-active": "oklch(55.2% 0.010 285.938)",
    "--color-scrollbar-thumb-focus": "var(--color-primary)",
    "--color-scrollbar-track": "var(--color-canvas)",
    "--color-scrollbar-track-hover": "var(--color-surface-muted)",
    "--color-scrollbar-track-active": "var(--color-hover)",
    "--color-scrollbar-track-focus": "var(--color-accent)",
    "--color-scrollbar-corner": "var(--color-canvas)"
});

const dark: ThemeColors = Object.freeze({
    "--color-canvas": "oklch(14.1% 0.005 285.823)",
    "--color-surface": "oklch(18% 0.006 285.885)",
    "--color-surface-muted": "oklch(20.5% 0.006 285.885)",
    "--color-surface-raised": "oklch(24% 0.006 286.033)",
    "--color-surface-overlay": "oklch(27.4% 0.006 286.033)",

    "--color-foreground": "oklch(98.5% 0 0)",
    "--color-muted-foreground": "oklch(70.5% 0.015 286.067)",

    "--color-input-background": "oklch(20.5% 0.006 285.885)",
    "--color-input-foreground": "var(--color-foreground)",
    "--color-border-subtle": "oklch(24% 0.006 286.033)",
    "--color-border": "oklch(30% 0.007 286.033)",
    "--color-border-control": "oklch(32% 0.008 285.938)",
    "--color-border-control-hover": "oklch(37.1% 0.008 285.805)",

    "--color-hover": "oklch(27.4% 0.006 286.033)",
    "--color-active": "oklch(37.1% 0.008 285.805)",

    "--color-disabled-foreground": "oklch(70.5% 0.010 286.067)",
    "--color-disabled-background": "oklch(27.4% 0.006 286.033)",
    "--color-disabled-border": "oklch(30% 0.007 286.033)",

    ...generatedRoles.dark,
    ...darkNeutralRoles,

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

    "--color-chart-1": "oklch(92.2% 0.004 286.320)",
    "--color-chart-2": "oklch(80.5% 0.008 286.067)",
    "--color-chart-3": "oklch(70.5% 0.010 286.067)",
    "--color-chart-4": "oklch(55.2% 0.010 285.938)",
    "--color-chart-5": "oklch(43.9% 0.010 285.938)",

    "--color-scrollbar-thumb": "oklch(37.1% 0.008 285.805)",
    "--color-scrollbar-thumb-hover": "oklch(52% 0.010 285.938)",
    "--color-scrollbar-thumb-active": "oklch(65% 0.010 286.067)",
    "--color-scrollbar-thumb-focus": "var(--color-primary)",
    "--color-scrollbar-track": "var(--color-canvas)",
    "--color-scrollbar-track-hover": "var(--color-surface-muted)",
    "--color-scrollbar-track-active": "var(--color-hover)",
    "--color-scrollbar-track-focus": "var(--color-accent)",
    "--color-scrollbar-corner": "var(--color-canvas)"
});

export const monaThemeColors = Object.freeze({ light, dark } satisfies ThemeDefinition);
