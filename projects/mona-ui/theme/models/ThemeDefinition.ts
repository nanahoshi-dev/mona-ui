import type { ThemeName, ThemePreference, ThemeVariant } from "./Theme";

export type ThemeColorVariable = `--color-${string}`;
export type ThemeColors = Readonly<Record<ThemeColorVariable, string>>;
export type ThemeShadowVariable = `--shadow-${string}`;
export type ThemeShadows = Readonly<Record<ThemeShadowVariable, string>>;
export type ThemeVariable = `--${string}`;
export type ThemeVariables = Readonly<Record<ThemeVariable, string>>;
export type ThemeDefinition = Readonly<Partial<Record<ThemeVariant, ThemeColors>>>;
export type ThemeDefinitionRegistry = Readonly<Record<string, ThemeDefinition>>;
export type ThemeShadowDefinition = Readonly<Partial<Record<ThemeVariant, ThemeShadows>>>;
export type ThemeShadowDefinitionRegistry = Readonly<Record<string, ThemeShadowDefinition>>;

export type ThemeMotionVariable = "--mona-motion-fast" | "--mona-motion-standard";
export type ThemeMotion = Readonly<Record<ThemeMotionVariable, string>>;

export type ThemeEffectLevel = "control" | "overlay" | "raised";
export type ThemeEffectVariable =
    | `--mona-effect-${ThemeEffectLevel}-background-color`
    | `--mona-effect-${ThemeEffectLevel}-fallback-background-color`
    | `--mona-effect-${ThemeEffectLevel}-background-image`
    | `--mona-effect-${ThemeEffectLevel}-backdrop-filter`;
export type ThemeEffects = Readonly<Record<ThemeEffectVariable, string>>;

export type ThemeShapeVariable = "--radius-sm" | "--radius-md" | "--radius-lg";
export type ThemeShape = Readonly<Record<ThemeShapeVariable, string>>;

export type ThemeComponentVariable =
    | "--mona-calendar-background"
    | "--mona-calendar-shadow"
    | "--mona-list-background"
    | "--mona-list-disabled-background"
    | "--mona-list-group-background"
    | "--mona-list-group-border-width"
    | "--mona-list-group-font-weight"
    | "--mona-menubar-background"
    | "--mona-menubar-shadow"
    | "--mona-pager-background"
    | "--mona-slider-handle-border-color";
export type ThemeComponents = Readonly<Record<ThemeComponentVariable, string>>;

export interface ThemeProfile {
    readonly colors: ThemeColors;
    readonly components: ThemeComponents;
    readonly custom?: ThemeVariables;
    readonly effects: ThemeEffects;
    readonly motion: ThemeMotion;
    readonly shadows: ThemeShadows;
    readonly shape: ThemeShape;
}

export interface ThemeProfileOverrides {
    readonly colors?: ThemeColors;
    readonly components?: Partial<ThemeComponents>;
    readonly custom?: ThemeVariables;
    readonly effects?: Partial<ThemeEffects>;
    readonly motion?: Partial<ThemeMotion>;
    readonly shadows?: ThemeShadows;
    readonly shape?: Partial<ThemeShape>;
}

export type ThemeFamilyVariants = Readonly<
    | { readonly dark: ThemeProfile; readonly light?: ThemeProfile }
    | { readonly dark?: ThemeProfile; readonly light: ThemeProfile }
>;

export interface ThemeFamilyRegistration {
    readonly name: ThemeName;
    readonly variants: ThemeFamilyVariants;
}

export interface ThemeOverrideRegistration {
    readonly common?: ThemeProfileOverrides;
    readonly dark?: ThemeProfileOverrides;
    /**
     * Set for a generated palette, which always has both variants, so that one a theme doesn't have is skipped
     * rather than reported.
     * @internal
     */
    readonly generated?: boolean;
    readonly light?: ThemeProfileOverrides;
    readonly theme: ThemeName;
}

export interface ThemeOptions {
    readonly initialTheme: ThemePreference;
    /**
     * Remembers the theme under this key, in `THEME_STORAGE`, and restores it in place of `initialTheme`. Nothing is
     * stored without one. A runtime color palette isn't part of what's remembered.
     */
    readonly persistKey?: string;
}

export interface ThemeColorPaletteSeeds {
    readonly error?: string;
    readonly info?: string;
    readonly primary: string;
    readonly secondary?: string;
    readonly success?: string;
    readonly warning?: string;
}

export type GeneratedThemeColorPalette = Readonly<Record<ThemeVariant, ThemeColors>>;

/**
 * Inputs to the sidebar colour roles. Everything but the background falls back to the theme's
 * corresponding page role, so a theme only states what it wants the sidebar to do differently.
 */
export interface SidebarColorRoleSeeds {
    readonly accent?: string;
    readonly accentForeground?: string;
    readonly background: string;
    readonly border?: string;
    readonly foreground?: string;
    readonly primary?: string;
    readonly primaryForeground?: string;
    readonly ring?: string;
}

export interface ThemeColorPaletteRegistration {
    readonly seeds: ThemeColorPaletteSeeds;
    readonly theme: ThemeName;
}

export function flattenThemeProfile(profile: ThemeProfile): ThemeVariables {
    return {
        ...profile.colors,
        ...profile.shadows,
        ...profile.motion,
        ...profile.effects,
        ...profile.shape,
        ...profile.components,
        ...profile.custom
    };
}
