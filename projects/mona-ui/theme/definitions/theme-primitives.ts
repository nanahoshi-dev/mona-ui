import type { ThemeEffects, ThemeShape } from "../models/ThemeDefinition";

export function createDefaultThemeEffects(): ThemeEffects {
    return Object.freeze({
        "--mona-effect-control-background-color": "var(--color-input-background)",
        "--mona-effect-control-fallback-background-color": "var(--color-input-background)",
        "--mona-effect-control-background-image": "none",
        "--mona-effect-control-backdrop-filter": "none",
        "--mona-effect-raised-background-color": "var(--color-surface-raised)",
        "--mona-effect-raised-fallback-background-color": "var(--color-surface-raised)",
        "--mona-effect-raised-background-image": "none",
        "--mona-effect-raised-backdrop-filter": "none",
        "--mona-effect-overlay-background-color": "var(--color-surface-overlay)",
        "--mona-effect-overlay-fallback-background-color": "var(--color-surface-overlay)",
        "--mona-effect-overlay-background-image": "none",
        "--mona-effect-overlay-backdrop-filter": "none"
    });
}

export function createDefaultThemeShape(): ThemeShape {
    return Object.freeze({
        "--radius-sm": "0.25rem",
        "--radius-md": "0.375rem",
        "--radius-lg": "0.5rem"
    });
}
