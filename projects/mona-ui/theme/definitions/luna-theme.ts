import type { ThemeFamilyRegistration } from "../models/ThemeDefinition";
import { lunaThemeColors } from "./luna-theme-colors";
import { lunaThemeShadows } from "./luna-theme-shadows";

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
                "--mona-effect-control-background-color": "rgb(255 255 255 / 0.52)",
                "--mona-effect-control-fallback-background-color": "oklch(95.5% 0.025 275)",
                "--mona-effect-control-background-image":
                    "linear-gradient(145deg, rgb(255 255 255 / 0.62), rgb(255 255 255 / 0.12) 52%, rgb(116 134 255 / 0.1))",
                "--mona-effect-control-backdrop-filter": "blur(16px) saturate(140%)",
                "--mona-effect-raised-background-color": "rgb(255 255 255 / 0.62)",
                "--mona-effect-raised-fallback-background-color": "oklch(97% 0.02 275)",
                "--mona-effect-raised-background-image":
                    "linear-gradient(145deg, rgb(255 255 255 / 0.7), rgb(255 255 255 / 0.12) 48%, rgb(116 134 255 / 0.12))",
                "--mona-effect-raised-backdrop-filter": "blur(24px) saturate(150%)",
                "--mona-effect-overlay-background-color": "rgb(255 255 255 / 0.72)",
                "--mona-effect-overlay-fallback-background-color": "oklch(98% 0.018 275)",
                "--mona-effect-overlay-background-image":
                    "linear-gradient(145deg, rgb(255 255 255 / 0.76), rgb(255 255 255 / 0.14) 45%, rgb(116 134 255 / 0.14))",
                "--mona-effect-overlay-backdrop-filter": "blur(32px) saturate(165%)"
            }),
            shape: Object.freeze({
                "--radius-sm": "0.5rem",
                "--radius-md": "0.75rem",
                "--radius-lg": "1rem"
            }),
            components: Object.freeze({
                "--mona-calendar-background": "var(--mona-effect-raised-background-color)",
                "--mona-calendar-shadow": "var(--shadow-raised)",
                "--mona-list-background": "var(--color-surface)",
                "--mona-list-disabled-background": "var(--color-disabled-background)",
                "--mona-list-group-background": "var(--color-surface-muted)",
                "--mona-list-group-border-width": "1px",
                "--mona-list-group-font-weight": "650",
                "--mona-menubar-background": "var(--mona-effect-raised-background-color)",
                "--mona-menubar-shadow": "var(--shadow-raised)",
                "--mona-pager-background": "var(--mona-effect-raised-background-color)",
                "--mona-slider-handle-border-color": "color-mix(in srgb, var(--color-focus-indicator) 58%, white)",
                "--mona-tab-list-background": "var(--mona-effect-raised-background-color)",
                "--mona-tab-content-background": "var(--mona-effect-raised-background-color)"
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
                "--mona-effect-control-background-color": "rgb(28 31 50 / 0.55)",
                "--mona-effect-control-fallback-background-color": "oklch(21% 0.035 275)",
                "--mona-effect-control-background-image":
                    "linear-gradient(145deg, rgb(255 255 255 / 0.14), rgb(255 255 255 / 0.025) 52%, rgb(116 134 255 / 0.12))",
                "--mona-effect-control-backdrop-filter": "blur(16px) saturate(140%)",
                "--mona-effect-raised-background-color": "rgb(31 34 55 / 0.64)",
                "--mona-effect-raised-fallback-background-color": "oklch(24% 0.04 275)",
                "--mona-effect-raised-background-image":
                    "linear-gradient(145deg, rgb(255 255 255 / 0.16), rgb(255 255 255 / 0.03) 48%, rgb(116 134 255 / 0.14))",
                "--mona-effect-raised-backdrop-filter": "blur(24px) saturate(150%)",
                "--mona-effect-overlay-background-color": "rgb(36 39 62 / 0.72)",
                "--mona-effect-overlay-fallback-background-color": "oklch(27% 0.045 275)",
                "--mona-effect-overlay-background-image":
                    "linear-gradient(145deg, rgb(255 255 255 / 0.18), rgb(255 255 255 / 0.035) 45%, rgb(116 134 255 / 0.16))",
                "--mona-effect-overlay-backdrop-filter": "blur(32px) saturate(165%)"
            }),
            shape: Object.freeze({
                "--radius-sm": "0.5rem",
                "--radius-md": "0.75rem",
                "--radius-lg": "1rem"
            }),
            components: Object.freeze({
                "--mona-calendar-background": "var(--mona-effect-raised-background-color)",
                "--mona-calendar-shadow": "var(--shadow-raised)",
                "--mona-list-background": "var(--color-surface)",
                "--mona-list-disabled-background": "var(--color-disabled-background)",
                "--mona-list-group-background": "var(--color-surface-muted)",
                "--mona-list-group-border-width": "1px",
                "--mona-list-group-font-weight": "650",
                "--mona-menubar-background": "var(--mona-effect-raised-background-color)",
                "--mona-menubar-shadow": "var(--shadow-raised)",
                "--mona-pager-background": "var(--mona-effect-raised-background-color)",
                "--mona-slider-handle-border-color": "color-mix(in srgb, var(--color-focus-indicator) 58%, white)",
                "--mona-tab-list-background": "var(--mona-effect-raised-background-color)",
                "--mona-tab-content-background": "var(--mona-effect-raised-background-color)"
            })
        })
    }
} satisfies ThemeFamilyRegistration);
