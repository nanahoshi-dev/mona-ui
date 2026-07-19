import { generateThemeColorPalette, type ThemeFamilyRegistration } from "@nanahoshi/mona-ui/theme";

const generated = generateThemeColorPalette({
    primary: "#22d3ee",
    secondary: "#8b5cf6",
    success: "#34d399",
    error: "#fb7185",
    warning: "#fbbf24",
    info: "#60a5fa"
}).dark;

export const auroraTheme = Object.freeze({
    name: "aurora",
    variants: {
        dark: Object.freeze({
            colors: Object.freeze({
                "--color-canvas": "#07131b",
                "--color-surface": "#0b1b25",
                "--color-surface-muted": "#102631",
                "--color-surface-raised": "#15313d",
                "--color-surface-overlay": "#102631",
                "--color-foreground": "#e6f8fb",
                "--color-muted-foreground": "#9abcc4",
                "--color-input-background": "#0b1b25",
                "--color-input-foreground": "var(--color-foreground)",
                "--color-border-subtle": "#183540",
                "--color-border": "#214550",
                "--color-border-control": "#2b5661",
                "--color-border-control-hover": "#39717d",
                "--color-hover": "#15313d",
                "--color-active": "#1d414d",
                "--color-disabled-foreground": "#73949c",
                "--color-disabled-background": "#10232c",
                "--color-disabled-border": "#183540",
                ...generated,
                "--color-accent": "#164653",
                "--color-accent-foreground": "#dffbff",
                "--color-accent-hover": "#1b5967",
                "--color-accent-active": "#226b79",
                "--color-accent-dark": "var(--color-accent-active)",
                "--color-selected": "var(--color-primary)",
                "--color-selected-foreground": "var(--color-primary-foreground)",
                "--color-selected-hover": "var(--color-primary-hover)",
                "--color-selected-hover-foreground": "var(--color-primary-foreground)",
                "--color-selected-active": "var(--color-primary-active)",
                "--color-selected-active-foreground": "var(--color-primary-foreground)",
                "--color-selected-focus": "var(--color-primary)",
                "--color-selected-focus-foreground": "var(--color-primary-foreground)",
                "--color-selected-border": "var(--color-primary-border)",
                "--color-focus-indicator": "#67e8f9",
                "--color-focus-surface": "var(--color-surface-muted)",
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
                "--color-chart-1": "#22d3ee",
                "--color-chart-2": "#8b5cf6",
                "--color-chart-3": "#34d399",
                "--color-chart-4": "#fbbf24",
                "--color-chart-5": "#fb7185",
                "--color-scrollbar-thumb": "#2b5661",
                "--color-scrollbar-thumb-hover": "#39717d",
                "--color-scrollbar-thumb-active": "#4b8995",
                "--color-scrollbar-thumb-focus": "var(--color-focus-indicator)",
                "--color-scrollbar-track": "var(--color-canvas)",
                "--color-scrollbar-track-hover": "var(--color-surface-muted)",
                "--color-scrollbar-track-active": "var(--color-hover)",
                "--color-scrollbar-track-focus": "var(--color-accent)",
                "--color-scrollbar-corner": "var(--color-canvas)",
                "--color-page-background": "var(--color-canvas)",
                "--color-demo-background": "var(--color-surface)"
            }),
            shadows: Object.freeze({
                "--shadow-control": "0 1px 2px rgb(0 0 0 / 0.35)",
                "--shadow-raised": "0 8px 20px -8px rgb(0 0 0 / 0.65)",
                "--shadow-overlay": "0 14px 34px -12px rgb(0 0 0 / 0.78)"
            }),
            motion: Object.freeze({
                "--mona-motion-fast": "170ms",
                "--mona-motion-standard": "240ms"
            }),
            components: Object.freeze({
                "--mona-calendar-shadow": "var(--shadow-raised)",
                "--mona-list-background": "var(--color-surface)",
                "--mona-list-disabled-background": "var(--color-disabled-background)",
                "--mona-list-group-background": "var(--color-surface-muted)",
                "--mona-list-group-border-width": "1px",
                "--mona-list-group-font-weight": "600",
                "--mona-menubar-shadow": "var(--shadow-raised)",
                "--mona-slider-handle-border-color": "var(--color-focus-indicator)",
                "--mona-tab-content-background": "var(--color-surface)"
            })
        })
    }
} satisfies ThemeFamilyRegistration);
