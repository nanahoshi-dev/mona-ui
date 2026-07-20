import type { ThemeFamilyRegistration } from "../models/ThemeDefinition";
import { lunaThemeColors } from "./luna-theme-colors";
import { lunaThemeShadows } from "./luna-theme-shadows";
import { createDefaultThemeShape } from "./theme-primitives";

export const lunaTheme = Object.freeze({
    name: "luna",
    variants: {
        light: Object.freeze({
            colors: lunaThemeColors.light,
            shadows: lunaThemeShadows.light,
            motion: Object.freeze({
                "--mona-motion-fast": "180ms",
                "--mona-motion-standard": "320ms"
            }),
            effects: Object.freeze({
                "--mona-effect-control-background-color": "rgb(243 244 245 / 0.78)",
                "--mona-effect-control-fallback-background-color": "#f3f4f5",
                "--mona-effect-control-background-image": "none",
                "--mona-effect-control-backdrop-filter": "blur(16px) saturate(110%)",
                "--mona-effect-raised-background-color": "rgb(252 252 252 / 0.76)",
                "--mona-effect-raised-fallback-background-color": "#fbfbfb",
                "--mona-effect-raised-background-image": "none",
                "--mona-effect-raised-backdrop-filter": "blur(22px) saturate(112%)",
                "--mona-effect-overlay-background-color": "rgb(249 249 250 / 0.72)",
                "--mona-effect-overlay-fallback-background-color": "#f9f9fa",
                "--mona-effect-overlay-background-image": "none",
                "--mona-effect-overlay-backdrop-filter": "blur(28px) saturate(115%)"
            }),
            shape: createDefaultThemeShape(),
            custom: Object.freeze({
                "--mona-date-popup-calendar-backdrop-filter": "none",
                "--mona-date-popup-calendar-background": "transparent",
                "--mona-date-popup-calendar-background-image": "none",
                "--mona-dropdown-popup-list-background": "transparent",
                "--mona-input-addon-background":
                    "color-mix(in srgb, var(--color-input-background), var(--color-foreground) 8%)",
                "--mona-menu-item-hover-background": "rgb(37 37 37 / 0.06)",
                "--mona-menu-item-hover-foreground": "var(--color-foreground)",
                "--mona-menubar-backdrop-filter": "var(--mona-effect-control-backdrop-filter)",
                "--mona-menubar-background-image": "var(--mona-effect-control-background-image)"
            }),
            components: Object.freeze({
                "--mona-calendar-background": "var(--mona-effect-raised-background-color)",
                "--mona-calendar-shadow": "var(--shadow-raised)",
                "--mona-list-background": "var(--color-surface)",
                "--mona-list-disabled-background": "var(--color-disabled-background)",
                "--mona-list-group-background": "var(--color-surface-muted)",
                "--mona-list-group-border-width": "1px",
                "--mona-list-group-font-weight": "650",
                "--mona-menubar-background": "var(--mona-effect-control-background-color)",
                "--mona-menubar-shadow": "var(--shadow-control)",
                "--mona-pager-background": "var(--mona-effect-raised-background-color)",
                "--mona-slider-handle-border-color": "var(--color-border-control)",
                "--mona-tab-list-background": "#f5f5f6",
                "--mona-tab-content-background": "var(--color-surface)"
            })
        }),
        dark: Object.freeze({
            colors: lunaThemeColors.dark,
            shadows: lunaThemeShadows.dark,
            motion: Object.freeze({
                "--mona-motion-fast": "180ms",
                "--mona-motion-standard": "320ms"
            }),
            effects: Object.freeze({
                "--mona-effect-control-background-color": "rgb(37 37 39 / 0.74)",
                "--mona-effect-control-fallback-background-color": "#252527",
                "--mona-effect-control-background-image": "none",
                "--mona-effect-control-backdrop-filter": "blur(16px) saturate(110%)",
                "--mona-effect-raised-background-color": "rgb(32 32 34 / 0.78)",
                "--mona-effect-raised-fallback-background-color": "#202022",
                "--mona-effect-raised-background-image": "none",
                "--mona-effect-raised-backdrop-filter": "blur(22px) saturate(112%)",
                "--mona-effect-overlay-background-color": "rgb(38 38 40 / 0.74)",
                "--mona-effect-overlay-fallback-background-color": "#262628",
                "--mona-effect-overlay-background-image": "none",
                "--mona-effect-overlay-backdrop-filter": "blur(28px) saturate(115%)"
            }),
            shape: createDefaultThemeShape(),
            custom: Object.freeze({
                "--mona-date-popup-calendar-backdrop-filter": "none",
                "--mona-date-popup-calendar-background": "transparent",
                "--mona-date-popup-calendar-background-image": "none",
                "--mona-dropdown-popup-list-background": "transparent",
                "--mona-input-addon-background":
                    "color-mix(in srgb, var(--color-input-background), var(--color-foreground) 8%)",
                "--mona-menubar-backdrop-filter": "var(--mona-effect-control-backdrop-filter)",
                "--mona-menubar-background-image": "var(--mona-effect-control-background-image)"
            }),
            components: Object.freeze({
                "--mona-calendar-background": "var(--mona-effect-raised-background-color)",
                "--mona-calendar-shadow": "var(--shadow-raised)",
                "--mona-list-background": "var(--color-surface)",
                "--mona-list-disabled-background": "var(--color-disabled-background)",
                "--mona-list-group-background": "var(--color-surface-muted)",
                "--mona-list-group-border-width": "1px",
                "--mona-list-group-font-weight": "650",
                "--mona-menubar-background": "var(--mona-effect-control-background-color)",
                "--mona-menubar-shadow": "var(--shadow-control)",
                "--mona-pager-background": "var(--mona-effect-raised-background-color)",
                "--mona-slider-handle-border-color": "var(--color-border-control)",
                "--mona-tab-list-background": "var(--mona-effect-raised-background-color)",
                "--mona-tab-content-background": "var(--color-surface)"
            })
        })
    }
} satisfies ThemeFamilyRegistration);
