import type { ThemeColors, ThemeDefinition } from "../models/ThemeDefinition";
import { generateThemeColorPalette } from "../utils/generate-theme-color-palette";
import { createSidebarColorRoles } from "./theme-primitives";

const generatedRoles = generateThemeColorPalette({
    primary: "#583573",
    secondary: "#3A3B40",
    success: "#32BEA6",
    error: "#FF3055",
    warning: "#FFDA6B",
    info: "#4DA3FF"
});

// What both variants share: the roles that only point at other roles, and the sidebar. Anna's sidebar takes the muted
// surface and recedes behind the content rather than lifting off it, as its scrollbar track does.
const sharedRoles: ThemeColors = Object.freeze({
    "--color-card": "var(--color-surface-raised)",
    "--color-card-foreground": "var(--color-foreground)",
    "--color-input-foreground": "var(--color-foreground)",
    "--color-accent-dark": "var(--color-accent-active)",
    "--color-focus-surface": "var(--color-surface)",
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
    ...createSidebarColorRoles({ background: "var(--color-surface-muted)" }),
    "--color-scrollbar-thumb-focus": "var(--color-focus-indicator)"
});

// Anna Light keeps the dark variant's structure: graphite surfaces, with every control a step brighter than any of them.
// Here the controls are white, so the surfaces are soft grays. Selection becomes a violet tint, since secondary text
// must stay readable on it.
const light: ThemeColors = Object.freeze({
    "--color-canvas": "#E9E9EC",
    "--color-surface": "#EFEFF1",
    "--color-surface-muted": "#E4E4E7",
    "--color-surface-raised": "#F3F3F5",
    "--color-surface-overlay": "#F3F3F5",

    "--color-foreground": "#1E1F22",
    "--color-muted-foreground": "#53545A",

    "--color-input-background": "#FFFFFF",
    "--color-border-subtle": "#DFDFE3",
    "--color-border": "#D5D5DA",
    "--color-border-control": "#C4C5CA",
    "--color-border-control-hover": "#A9AAB0",
    "--color-border-control-contrast": "#7A7B82",
    "--color-border-control-contrast-hover": "#68696F",

    "--color-hover": "#E2E2E6",
    "--color-active": "#D8D8DD",

    "--color-disabled-foreground": "#5A5B61",
    "--color-disabled-background": "#E6E6E9",
    "--color-disabled-border": "#D5D5DA",

    ...generatedRoles.light,

    "--color-primary": "#583573",
    "--color-primary-foreground": "#FFFFFF",
    "--color-primary-hover": "#4A2B61",
    "--color-primary-active": "#3D2350",
    "--color-primary-selected": "#3D2350",
    "--color-primary-subtle": "#EFE7F6",
    "--color-primary-subtle-foreground": "#4A2B61",
    "--color-primary-border": "#76489C",

    "--color-secondary": "#DCDCE0",
    "--color-secondary-foreground": "#1E1F22",
    "--color-secondary-hover": "#CFCFD4",
    "--color-secondary-active": "#C3C3C9",
    "--color-secondary-selected": "#C3C3C9",
    "--color-secondary-subtle": "#E9E9EC",
    "--color-secondary-subtle-foreground": "#2E2F33",
    "--color-secondary-border": "#7A7B82",

    "--color-accent": "#EFE7F6",
    "--color-accent-foreground": "#4A2B61",
    "--color-accent-hover": "#E6DAF1",
    "--color-accent-active": "#DCCCEB",
    "--color-selected": "#E9DDF2",
    "--color-selected-foreground": "#40245A",
    "--color-selected-hover": "#E1D2EE",
    "--color-selected-hover-foreground": "#40245A",
    "--color-selected-active": "#D7C4E8",
    "--color-selected-active-foreground": "#40245A",
    "--color-selected-focus": "#E1D2EE",
    "--color-selected-focus-foreground": "#40245A",
    "--color-selected-border": "var(--color-primary)",
    "--color-focus-indicator": "#76489C",

    ...sharedRoles,

    "--color-chart-1": "#6B3F8E",
    "--color-chart-2": "#9B66C2",
    "--color-chart-3": "#2F6DB5",
    "--color-chart-4": "#13806F",
    "--color-chart-5": "#9A6500",

    "--color-scrollbar-thumb": "#7A7B82",
    "--color-scrollbar-thumb-hover": "#68696F",
    "--color-scrollbar-thumb-active": "#55565C",
    "--color-scrollbar-track": "#E4E4E7",
    "--color-scrollbar-track-hover": "#DCDCE0",
    "--color-scrollbar-track-active": "#D3D3D8",
    "--color-scrollbar-track-focus": "#EFE7F6",
    "--color-scrollbar-corner": "#E4E4E7"
});

const dark: ThemeColors = Object.freeze({
    "--color-canvas": "#202123",
    "--color-surface": "#1D1E20",
    "--color-surface-muted": "#161718",
    "--color-surface-raised": "#242528",
    "--color-surface-overlay": "#161718",

    "--color-foreground": "#D6D6D8",
    "--color-muted-foreground": "#B4B4B9",

    // Fields and other controls sit a step above every surface, sunken ones included, so they read by their fill and
    // not by the near-black border alone. Hover and active go on up from there.
    "--color-input-background": "#2A2B2E",
    "--color-border-subtle": "#0F0F10",
    "--color-border": "#131416",
    "--color-border-control": "#0F0F10",
    "--color-border-control-hover": "#17181A",
    "--color-border-control-contrast": "#74757B",
    "--color-border-control-contrast-hover": "#818289",

    "--color-hover": "#313236",
    "--color-active": "#38393D",

    "--color-disabled-foreground": "#9A9AA0",
    "--color-disabled-background": "#1A1B1D",
    "--color-disabled-border": "#111214",

    ...generatedRoles.dark,

    "--color-primary": "#583573",
    "--color-primary-foreground": "#F5EFF8",
    "--color-primary-hover": "#684484",
    "--color-primary-active": "#472A5E",
    "--color-primary-selected": "#583573",
    "--color-primary-subtle": "#2B2131",
    "--color-primary-subtle-foreground": "#DABFEA",
    "--color-primary-border": "#A174C2",

    "--color-secondary": "#34353A",
    "--color-secondary-foreground": "#F0F0F2",
    "--color-secondary-hover": "#414247",
    "--color-secondary-active": "#292A2E",
    "--color-secondary-selected": "#414247",
    "--color-secondary-subtle": "#232428",
    "--color-secondary-subtle-foreground": "#D6D6D8",
    "--color-secondary-border": "#777880",

    "--color-accent": "#583573",
    "--color-accent-foreground": "#F5EFF8",
    "--color-accent-hover": "#684484",
    "--color-accent-active": "#472A5E",
    "--color-selected": "var(--color-primary)",
    "--color-selected-foreground": "var(--color-primary-foreground)",
    "--color-selected-hover": "var(--color-primary-hover)",
    "--color-selected-hover-foreground": "var(--color-primary-foreground)",
    "--color-selected-active": "var(--color-active)",
    "--color-selected-active-foreground": "var(--color-foreground)",
    "--color-selected-focus": "var(--color-primary)",
    "--color-selected-focus-foreground": "var(--color-primary-foreground)",
    "--color-selected-border": "var(--color-focus-indicator)",
    "--color-focus-indicator": "#BC94DB",

    ...sharedRoles,

    "--color-chart-1": "#A174C2",
    "--color-chart-2": "#C39BDF",
    "--color-chart-3": "#4DA3FF",
    "--color-chart-4": "#32BEA6",
    "--color-chart-5": "#FFDA6B",

    "--color-scrollbar-thumb": "#686970",
    "--color-scrollbar-thumb-hover": "#7B7C83",
    "--color-scrollbar-thumb-active": "#94959C",
    "--color-scrollbar-track": "#161718",
    "--color-scrollbar-track-hover": "#1D1E20",
    "--color-scrollbar-track-active": "#242528",
    "--color-scrollbar-track-focus": "#2B2131",
    "--color-scrollbar-corner": "#161718"
});

export const annaThemeColors = Object.freeze({ light, dark } satisfies ThemeDefinition);
