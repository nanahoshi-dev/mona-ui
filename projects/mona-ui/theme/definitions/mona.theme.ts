import type { ThemeDefinition, ThemeVariables } from "../models/ThemeDefinition";

export function monaDarkThemeVariables(): ThemeVariables {
    return {
        /* --- Core Canvas & Surfaces (Progressive elevation lighting) --- */
        "--color-canvas": "oklch(0.12 0.008 286.32)" /* Deep dark base canvas */,
        "--color-background": "oklch(0.12 0.008 286.32)" /* Matches canvas */,
        "--color-background-dark": "oklch(0.09 0.008 286.32)" /* Ultra-dark inset canvas */,
        "--color-surface": "oklch(0.16 0.008 286.32)" /* Standard surface (cards, sheets) */,
        "--color-surface-muted": "oklch(0.14 0.008 286.32)" /* Inset wells, table headers */,
        "--color-surface-raised": "oklch(0.20 0.008 286.32)" /* Elevated cards, modals */,
        "--color-surface-overlay": "oklch(0.24 0.008 286.32)" /* Top-tier dropdowns, tooltips */,

        /* --- Global Text & Interactive Overlays --- */
        "--color-foreground": "oklch(0.93 0.004 286.32)" /* Crisp, low-glare light gray text */,
        "--color-hover": "oklch(1 0 0 / 0.05)" /* Universal hover white alpha overlay */,
        "--color-active": "oklch(1 0 0 / 0.10)" /* Universal press white alpha overlay */,
        "--color-selected": "oklch(0.26 0.01 286.32)" /* Selection highlight bounding well */,

        /* --- Layout Header --- */
        "--color-header-background": "oklch(0.14 0.008 286.32)",
        "--color-header-foreground": "oklch(0.95 0.004 286.32)",

        /* --- Form Inputs & Controls --- */
        "--color-input-background": "oklch(0.11 0.008 286.32)" /* Inset dark field background */,
        "--color-input-border": "oklch(0.24 0.008 286.32)",
        "--color-input-hover": "oklch(0.14 0.008 286.32)",
        "--color-input-active": "oklch(0.16 0.008 286.32)",
        "--color-input": "oklch(0.24 0.008 286.32)",

        /* --- Popovers & Dropdowns --- */
        "--color-popover": "oklch(0.20 0.008 286.32)",
        "--color-popover-foreground": "oklch(0.93 0.004 286.32)",

        /* --- Borders & Separation Rules --- */
        "--color-border": "oklch(0.24 0.008 286.32)" /* Standard boundary separation stroke */,
        "--color-border-subtle": "oklch(0.19 0.008 286.32)" /* Muted structural lines */,
        "--color-border-control": "oklch(0.28 0.008 286.32)" /* Form element rest border */,
        "--color-border-control-hover": "oklch(0.40 0.008 286.32)",

        /* --- Global System Accessibility States --- */
        "--color-focus-indicator": "oklch(0.65 0.16 259.40)" /* Vibrant brand-matching focus track */,
        "--color-disabled": "oklch(0.45 0.005 286.32)" /* Visible but distinctly dead text */,
        "--color-disabled-background": "oklch(0.18 0.005 286.32)",

        /* --- Muted Structural Tokens --- */
        "--color-muted": "oklch(0.18 0.008 286.32)",
        "--color-muted-foreground": "oklch(0.62 0.006 286.32)",

        /* --- Main Brand/Primary Track (Slightly illuminated for dark mode glow) --- */
        "--color-primary": "oklch(0.64 0.192 259.40)" /* Bumped lightness slightly to pop on dark */,
        "--color-primary-foreground": "oklch(0.98 0.005 276.62)",
        "--color-primary-hover": "oklch(0.70 0.192 259.40)" /* Hover brightens the control in dark mode */,
        "--color-primary-active": "oklch(0.58 0.192 259.40)" /* Active compresses it down */,
        "--color-primary-selected": "oklch(0.74 0.192 259.40)",

        /* --- Secondary State (Dark fill variant) --- */
        "--color-secondary": "oklch(0.20 0.008 286.32)",
        "--color-secondary-foreground": "oklch(0.93 0.004 286.32)",
        "--color-secondary-hover": "oklch(0.25 0.008 286.32)",
        "--color-secondary-active": "oklch(0.28 0.008 286.32)",

        /* --- Accent System --- */
        "--color-accent": "oklch(0.20 0.008 286.32)",
        "--color-accent-dark": "oklch(0.25 0.008 286.32)",
        "--color-accent-foreground": "oklch(0.93 0.004 286.32)",
        "--color-accent-hover": "oklch(0.23 0.008 286.32)",
        "--color-accent-active": "oklch(0.28 0.008 286.32)",

        /* --- Semantic Functional Tracks (Illuminated for dark canvases + deep wells) --- */
        "--color-success": "oklch(0.68 0.17 149.214)",
        "--color-success-foreground": "oklch(0.12 0.02 149.214)" /* Dark text on vibrant green capsule */,
        "--color-success-hover": "oklch(0.74 0.17 149.214)",
        "--color-success-active": "oklch(0.62 0.17 149.214)",
        "--color-success-selected": "oklch(0.78 0.17 149.214)",
        "--color-success-subtle": "oklch(0.16 0.02 149.214)" /* Deep semantic alert backdrop */,
        "--color-success-border": "oklch(0.28 0.05 149.214)",

        "--color-error": "oklch(0.62 0.22 27.325)",
        "--color-error-foreground": "oklch(0.98 0.01 27.325)",
        "--color-error-hover": "oklch(0.68 0.22 27.325)",
        "--color-error-active": "oklch(0.56 0.22 27.325)",
        "--color-error-selected": "oklch(0.72 0.22 27.325)",
        "--color-error-subtle": "oklch(0.15 0.02 27.325)",
        "--color-error-border": "oklch(0.30 0.06 27.325)",
        "--color-destructive": "oklch(0.62 0.22 27.325)",
        "--color-destructive-foreground": "oklch(0.98 0.01 27.325)",

        "--color-warning": "oklch(0.72 0.15 58.318)",
        "--color-warning-foreground": "oklch(0.13 0.02 58.318)" /* Dark text for accessible contrast */,
        "--color-warning-hover": "oklch(0.78 0.15 58.318)",
        "--color-warning-active": "oklch(0.66 0.15 58.318)",
        "--color-warning-selected": "oklch(0.82 0.15 58.318)",
        "--color-warning-subtle": "oklch(0.17 0.02 58.318)",
        "--color-warning-border": "oklch(0.32 0.05 58.318)",

        "--color-info": "oklch(0.60 0.22 262.881)",
        "--color-info-foreground": "oklch(0.98 0.01 262.881)",
        "--color-info-hover": "oklch(0.66 0.22 262.881)",
        "--color-info-active": "oklch(0.54 0.22 262.881)",
        "--color-info-selected": "oklch(0.70 0.22 262.881)",
        "--color-info-subtle": "oklch(0.15 0.03 262.881)",
        "--color-info-border": "oklch(0.28 0.06 262.881)",

        /* --- Scrollbars (Harmonized to dark theme values) --- */
        "--color-scrollbar-thumb": "oklch(0.32 0.008 286.32)",
        "--color-scrollbar-thumb-hover": "oklch(0.40 0.008 286.32)",
        "--color-scrollbar-thumb-active": "oklch(0.48 0.008 286.32)",
        "--color-scrollbar-thumb-focus": "oklch(0.40 0.008 286.32)",
        "--color-scrollbar-track": "oklch(0.14 0.008 286.32)",
        "--color-scrollbar-track-hover": "oklch(0.16 0.008 286.32)",
        "--color-scrollbar-track-active": "oklch(0.18 0.008 286.32)",
        "--color-scrollbar-track-focus": "oklch(0.16 0.008 286.32)",
        "--color-scrollbar-corner": "oklch(0.14 0.008 286.32)",

        /* --- Charts (Preserved raw hex mappings for data isolation) --- */
        "--color-chart-1": "#e76e50",
        "--color-chart-2": "#2a9d90",
        "--color-chart-3": "#274754",
        "--color-chart-4": "#e8c468",
        "--color-chart-5": "#f4a462",

        /* --- Ambient Dark Elevations (Inverse opacity mapping to prevent muddy glows) --- */
        "--shadow-control": "0 1px 2px oklch(0 0 0 / 0.25)",
        "--shadow-raised": "0 4px 12px oklch(0 0 0 / 0.35)",
        "--shadow-overlay": "0 12px 32px oklch(0 0 0 / 0.50)"
    };
}

export function monaLightThemeVariables(): ThemeVariables {
    return {
        /* --- Core Canvas & Surfaces (With subtle elevation steps) --- */
        "--color-canvas": "oklch(0.99 0.002 286.32)" /* Off-white page body background */,
        "--color-background": "oklch(0.99 0.002 286.32)" /* Matches canvas */,
        "--color-background-dark": "oklch(0.97 0.003 286.32)" /* Fallback section background */,
        "--color-surface": "oklch(1 0 0)" /* Pure white surface (cards, sheets) */,
        "--color-surface-muted": "oklch(0.96 0.004 286.32)" /* Inset wells, tables */,
        "--color-surface-raised": "oklch(1 0 0)" /* Elevated layout components */,
        "--color-surface-overlay": "oklch(1 0 0)" /* High priority flyouts, dialogs */,

        /* --- Global Text & Interactive Overlays --- */
        "--color-foreground": "oklch(0.14 0.004 285.82)" /* Crisp slate-charcoal typography */,
        "--color-hover": "oklch(0.14 0.004 285.82 / 0.04)" /* Universal hover alpha overlay */,
        "--color-active": "oklch(0.14 0.004 285.82 / 0.08)" /* Universal press alpha overlay */,
        "--color-selected": "oklch(0.94 0.005 286.32)" /* Selection background highlighting */,

        /* --- Layout Header (Fixed Contrast) --- */
        "--color-header-background": "oklch(0.96 0.003 286.32)",
        "--color-header-foreground": "oklch(0.14 0.004 285.82)" /* Fixed from white to dark slate */,

        /* --- Form Inputs & Controls --- */
        "--color-input-background": "oklch(1 0 0)",
        "--color-input-border": "oklch(0.88 0.004 286.32)",
        "--color-input-hover": "oklch(0.98 0.003 286.32)",
        "--color-input-active": "oklch(0.95 0.004 286.32)",
        "--color-input": "oklch(0.88 0.004 286.32)" /* Unified hex fallback to OKLCH */,

        /* --- Popovers & Dropdowns --- */
        "--color-popover": "oklch(1 0 0)",
        "--color-popover-foreground": "oklch(0.14 0.004 285.82)",

        /* --- Borders & Separation Rules --- */
        "--color-border": "oklch(0.88 0.004 286.32)" /* Standard hairline boundary divider */,
        "--color-border-subtle": "oklch(0.93 0.003 286.32)" /* Light table rules, interior dividers */,
        "--color-border-control": "oklch(0.84 0.004 286.32)" /* Form control normal boundary */,
        "--color-border-control-hover": "oklch(0.72 0.006 286.32)",

        /* --- Global System Accessibility States --- */
        "--color-focus-indicator": "oklch(0.50 0.008 286.32)",
        "--color-disabled": "oklch(0.42 0.006 286.32)" /* Darkened for WCAG AA 4.5:1 text contrast */,
        "--color-disabled-background": "oklch(0.94 0.003 286.32)",

        /* --- Muted Structural Tokens (Unified Hues) --- */
        "--color-muted": "oklch(0.95 0.003 286.32)" /* Fixed from warm hex to cool OKLCH */,
        "--color-muted-foreground": "oklch(0.52 0.01 286.32)" /* Fixed from warm hex to cool OKLCH */,

        /* --- Main Brand/Primary Track --- */
        "--color-primary": "oklch(0.60 0.192 259.40)",
        "--color-primary-foreground": "oklch(0.975 0.005 276.62)",
        "--color-primary-hover": "oklch(0.54 0.192 259.40)" /* Swapped to properly darken on interaction */,
        "--color-primary-active": "oklch(0.48 0.192 259.40)" /* Deeper compression value */,
        "--color-primary-selected": "oklch(0.69 0.192 259.40)",

        /* --- Secondary State --- */
        "--color-secondary": "oklch(0.95 0.003 286.32)",
        "--color-secondary-foreground": "oklch(0.21 0.005 286.32)",
        "--color-secondary-hover": "oklch(0.91 0.004 286.32)",
        "--color-secondary-active": "oklch(0.86 0.005 286.32)",

        /* --- Accent System (Standardized Context Layer) --- */
        "--color-accent": "oklch(0.95 0.003 286.32)",
        "--color-accent-dark": "oklch(0.91 0.004 286.32)",
        "--color-accent-foreground": "oklch(0.21 0.005 286.32)",
        "--color-accent-hover": "oklch(0.93 0.003 286.32)",
        "--color-accent-active": "oklch(0.88 0.005 286.32)",

        /* --- Semantic Functional Tracks (Unified % tokens to standard decimals) --- */
        "--color-success": "oklch(0.627 0.194 149.214)",
        "--color-success-foreground": "oklch(0.977 0.001 106.424)",
        "--color-success-hover": "oklch(0.567 0.194 149.214)",
        "--color-success-active": "oklch(0.507 0.194 149.214)",
        "--color-success-selected": "oklch(0.767 0.194 149.214)",
        "--color-success-subtle": "oklch(0.95 0.02 149.214)",
        "--color-success-border": "oklch(0.82 0.06 149.214)",

        "--color-error": "oklch(0.577 0.245 27.325)",
        "--color-error-foreground": "oklch(0.943 0.029 294.588)",
        "--color-error-hover": "oklch(0.517 0.245 27.325)",
        "--color-error-active": "oklch(0.457 0.245 27.325)",
        "--color-error-selected": "oklch(0.717 0.245 27.325)",
        "--color-error-subtle": "oklch(0.96 0.015 27.325)",
        "--color-error-border": "oklch(0.85 0.06 27.325)",
        "--color-destructive": "oklch(0.577 0.245 27.325)" /* Tied directly to standardized error */,
        "--color-destructive-foreground": "oklch(0.943 0.029 294.588)" /* Tied directly to standardized error */,

        "--color-warning": "oklch(0.666 0.179 58.318)",
        "--color-warning-foreground": "oklch(0.20 0.04 58.318)" /* Fixed contrast for dark text on yellow */,
        "--color-warning-hover": "oklch(0.606 0.179 58.318)",
        "--color-warning-active": "oklch(0.546 0.179 58.318)",
        "--color-warning-selected": "oklch(0.806 0.179 58.318)",
        "--color-warning-subtle": "oklch(0.95 0.03 58.318)",
        "--color-warning-border": "oklch(0.84 0.08 58.318)",

        "--color-info": "oklch(0.546 0.245 262.881)",
        "--color-info-foreground": "oklch(0.943 0.029 294.588)",
        "--color-info-hover": "oklch(0.486 0.245 262.881)",
        "--color-info-active": "oklch(0.426 0.245 262.881)",
        "--color-info-selected": "oklch(0.686 0.245 262.881)",
        "--color-info-subtle": "oklch(0.94 0.03 262.881)",
        "--color-info-border": "oklch(0.82 0.08 262.881)",

        /* --- Scrollbars (Standardized to core theme hues) --- */
        "--color-scrollbar-thumb": "oklch(0.82 0.005 286.32)",
        "--color-scrollbar-thumb-hover": "oklch(0.70 0.006 286.32)",
        "--color-scrollbar-thumb-active": "oklch(0.58 0.007 286.32)",
        "--color-scrollbar-thumb-focus": "oklch(0.70 0.006 286.32)",
        "--color-scrollbar-track": "oklch(0.97 0.002 286.32)",
        "--color-scrollbar-track-hover": "oklch(0.95 0.003 286.32)",
        "--color-scrollbar-track-active": "oklch(0.91 0.004 286.32)",
        "--color-scrollbar-track-focus": "oklch(0.95 0.003 286.32)",
        "--color-scrollbar-corner": "oklch(0.97 0.002 286.32)",

        /* --- Charts (Preserved raw hex mappings for data isolation) --- */
        "--color-chart-1": "#e76e50",
        "--color-chart-2": "#2a9d90",
        "--color-chart-3": "#274754",
        "--color-chart-4": "#e8c468",
        "--color-chart-5": "#f4a462",

        /* --- Elevated Elevations --- */
        "--shadow-control": "0 1px 2px oklch(0.14 0.004 285.82 / 0.03)",
        "--shadow-raised": "0 2px 6px oklch(0.14 0.004 285.82 / 0.08)",
        "--shadow-overlay": "0 8px 24px oklch(0.14 0.004 285.82 / 0.12)"
    };
}

export const monaThemeDefinition: ThemeDefinition = {
    light: monaLightThemeVariables(),
    dark: monaDarkThemeVariables()
};
