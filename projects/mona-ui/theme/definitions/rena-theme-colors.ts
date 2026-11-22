import type { ThemeColors, ThemeDefinition } from "../models/ThemeDefinition";
import { generateThemeColorPalette } from "../utils/generate-theme-color-palette";
import { createSidebarColorRoles } from "./theme-primitives";

// Rena takes its hues from Tailwind CSS's default palette (MIT, see THIRD_PARTY_NOTICES.md): cool gray neutrals and
// an indigo accent. The dark variant's surfaces are white laid over gray-900 at low opacity, worked out to opaque hex
// so the contrast checks can read them.
const generatedRoles = generateThemeColorPalette({
    primary: "#4f46e5",
    secondary: "#6b7280",
    success: "#16a34a",
    error: "#dc2626",
    warning: "#d97706",
    info: "#2563eb"
});

// What both variants share: the roles that only point at other roles.
const sharedRoles: ThemeColors = Object.freeze({
    "--color-card": "var(--color-surface-raised)",
    "--color-card-foreground": "var(--color-foreground)",
    "--color-input-foreground": "var(--color-foreground)",
    "--color-accent-dark": "var(--color-accent-active)",
    // The time list shows focus by its fill alone, so it takes the accent tint rather than a neutral step.
    "--color-focus-surface": "var(--color-accent)",
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
    "--color-scrollbar-thumb-focus": "var(--color-focus-indicator)",
    "--color-scrollbar-track": "var(--color-canvas)",
    "--color-scrollbar-track-focus": "var(--color-accent)",
    "--color-scrollbar-corner": "var(--color-canvas)"
});

// Rena Light puts white panels on a gray-50 page, light enough that the panels don't glare against it, and its headers
// take the same gray-50. Muted text is gray-600 rather than gray-500, which falls short of 4.5:1 on the gray-100 hover
// fill.
const light: ThemeColors = Object.freeze({
    "--color-canvas": "#f9fafb",
    "--color-surface": "#ffffff",
    "--color-surface-muted": "#f9fafb",
    "--color-surface-raised": "#ffffff",
    "--color-surface-overlay": "#ffffff",

    "--color-foreground": "#111827",
    "--color-muted-foreground": "#4b5563",

    "--color-input-background": "#ffffff",
    "--color-border-subtle": "#f3f4f6",
    "--color-border": "#e5e7eb",
    "--color-border-control": "#d1d5db",
    "--color-border-control-hover": "#9ca3af",
    "--color-border-control-contrast": "#6b7280",
    "--color-border-control-contrast-hover": "#4b5563",

    "--color-hover": "#f3f4f6",
    "--color-active": "#e5e7eb",

    "--color-disabled-foreground": "#6b7280",
    "--color-disabled-background": "#f9fafb",
    "--color-disabled-border": "#e5e7eb",

    ...generatedRoles.light,

    // Hover and active go darker: white text on the lighter indigo-500 is just under 4.5:1.
    "--color-primary": "#4f46e5",
    "--color-primary-foreground": "#ffffff",
    "--color-primary-hover": "#4338ca",
    "--color-primary-active": "#3730a3",
    "--color-primary-selected": "#3730a3",
    "--color-primary-subtle": "#eef2ff",
    "--color-primary-subtle-foreground": "#4338ca",
    "--color-primary-border": "#4f46e5",

    "--color-secondary": "#f3f4f6",
    "--color-secondary-foreground": "#111827",
    "--color-secondary-hover": "#e5e7eb",
    "--color-secondary-active": "#d1d5db",
    "--color-secondary-selected": "#d1d5db",
    "--color-secondary-subtle": "#f9fafb",
    "--color-secondary-subtle-foreground": "#374151",
    "--color-secondary-border": "#6b7280",

    "--color-accent": "#eef2ff",
    "--color-accent-foreground": "#4338ca",
    "--color-accent-hover": "#e0e7ff",
    "--color-accent-active": "#c7d2fe",
    "--color-selected": "#eef2ff",
    "--color-selected-foreground": "#4338ca",
    "--color-selected-hover": "#e0e7ff",
    "--color-selected-hover-foreground": "#4338ca",
    "--color-selected-active": "#c7d2fe",
    "--color-selected-active-foreground": "#3730a3",
    "--color-selected-focus": "#e0e7ff",
    "--color-selected-focus-foreground": "#4338ca",
    "--color-selected-border": "#4f46e5",
    "--color-focus-indicator": "#4f46e5",

    ...sharedRoles,
    // The sidebar is a white panel beside the content, as the cards are.
    ...createSidebarColorRoles({ background: "var(--color-surface)" }),

    "--color-chart-1": "#4f46e5",
    "--color-chart-2": "#0891b2",
    "--color-chart-3": "#059669",
    "--color-chart-4": "#d97706",
    "--color-chart-5": "#db2777",

    "--color-scrollbar-thumb": "#6b7280",
    "--color-scrollbar-thumb-hover": "#4b5563",
    "--color-scrollbar-thumb-active": "#374151",
    "--color-scrollbar-track-hover": "#e5e7eb",
    "--color-scrollbar-track-active": "#d1d5db"
});

// Rena Dark is a gray-900 page with panels a little lighter and headers a little darker. Overlays and cards are
// gray-800. Primary stays indigo-600, which keeps white text at 6.3:1; what the primary color draws on its own, and
// text in it, take indigo-400 through the profile's custom variables.
const dark: ThemeColors = Object.freeze({
    "--color-canvas": "#111827",
    "--color-surface": "#171e2c",
    "--color-surface-muted": "#141b2a",
    "--color-surface-raised": "#1f2937",
    "--color-surface-overlay": "#1f2937",

    "--color-foreground": "#f3f4f6",
    "--color-muted-foreground": "#9ca3af",

    "--color-input-background": "#1d2432",
    "--color-border-subtle": "#252c39",
    "--color-border": "#2e3541",
    "--color-border-control": "#373e4a",
    "--color-border-control-hover": "#4a505a",
    "--color-border-control-contrast": "#7d8595",
    "--color-border-control-contrast-hover": "#9ca3af",

    "--color-hover": "#272e3b",
    "--color-active": "#313743",

    "--color-disabled-foreground": "#9ca3af",
    "--color-disabled-background": "#181f2d",
    "--color-disabled-border": "#252c39",

    ...generatedRoles.dark,

    "--color-primary": "#4f46e5",
    "--color-primary-foreground": "#ffffff",
    "--color-primary-hover": "#5956eb",
    "--color-primary-active": "#4338ca",
    "--color-primary-selected": "#4338ca",
    "--color-primary-subtle": "#232a4c",
    "--color-primary-subtle-foreground": "#c7d2fe",
    "--color-primary-border": "#818cf8",

    "--color-secondary": "#374151",
    "--color-secondary-foreground": "#f9fafb",
    "--color-secondary-hover": "#4b5563",
    "--color-secondary-active": "#1f2937",
    "--color-secondary-selected": "#4b5563",
    "--color-secondary-subtle": "#1f2937",
    "--color-secondary-subtle-foreground": "#d1d5db",
    "--color-secondary-border": "#9ca3af",

    "--color-accent": "#232a4c",
    "--color-accent-foreground": "#e0e7ff",
    "--color-accent-hover": "#282e57",
    "--color-accent-active": "#2e3467",
    "--color-selected": "#232a4c",
    "--color-selected-foreground": "#e0e7ff",
    "--color-selected-hover": "#282e57",
    "--color-selected-hover-foreground": "#e0e7ff",
    "--color-selected-active": "#2e3467",
    "--color-selected-active-foreground": "#e0e7ff",
    "--color-selected-focus": "#282e57",
    "--color-selected-focus-foreground": "#e0e7ff",
    "--color-selected-border": "#818cf8",
    "--color-focus-indicator": "#818cf8",

    ...sharedRoles,
    ...createSidebarColorRoles({ background: "var(--color-surface)" }),

    "--color-chart-1": "#818cf8",
    "--color-chart-2": "#22d3ee",
    "--color-chart-3": "#34d399",
    "--color-chart-4": "#fbbf24",
    "--color-chart-5": "#f472b6",

    "--color-scrollbar-thumb": "#6b7280",
    "--color-scrollbar-thumb-hover": "#9ca3af",
    "--color-scrollbar-thumb-active": "#d1d5db",
    "--color-scrollbar-track-hover": "#171e2c",
    "--color-scrollbar-track-active": "#1f2937"
});

export const renaThemeColors = Object.freeze({ light, dark } satisfies ThemeDefinition);
