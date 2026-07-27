import type { SidebarColorRoleSeeds, ThemeColors, ThemeEffects, ThemeShape } from "../models/ThemeDefinition";

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

/**
 * Builds the sidebar's own colour roles. The sidebar is a persistent chrome region rather than page
 * content, so it is given a surface of its own instead of borrowing the page's — which is what lets a
 * theme sit it slightly apart from the content beside it without every consumer restyling it.
 *
 * Only `background` has to be chosen per theme. Hover defaults to the neutral interaction roles, while
 * the sidebar's primary pair follows the selected-state roles. This keeps ordinary navigation quiet,
 * reserves identity colour for the current item, and makes runtime primary-palette changes flow through
 * without rebuilding the sidebar recipe.
 */
export function createSidebarColorRoles(seeds: SidebarColorRoleSeeds): ThemeColors {
    return Object.freeze({
        "--color-sidebar": seeds.background,
        "--color-sidebar-foreground": seeds.foreground ?? "var(--color-foreground)",
        "--color-sidebar-primary": seeds.primary ?? "var(--color-selected)",
        "--color-sidebar-primary-foreground": seeds.primaryForeground ?? "var(--color-selected-foreground)",
        "--color-sidebar-accent": seeds.accent ?? "var(--color-hover)",
        "--color-sidebar-accent-foreground": seeds.accentForeground ?? "var(--color-foreground)",
        "--color-sidebar-border": seeds.border ?? "var(--color-border)",
        "--color-sidebar-ring": seeds.ring ?? "var(--color-focus-indicator)"
    });
}
