import type { ThemeName, ThemeSelection, ThemeVariant } from "./Theme";

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
    | "--mona-slider-handle-border-color"
    | "--mona-tab-list-background"
    | "--mona-tab-content-background";
export type ThemeComponents = Readonly<Record<ThemeComponentVariable, string>>;

export interface ThemeProfile {
    readonly colors: ThemeColors;
    readonly components: ThemeComponents;
    readonly custom?: ThemeVariables;
    readonly effects: ThemeEffects;
    readonly motion: ThemeMotion;
    readonly shape: ThemeShape;
    readonly shadows: ThemeShadows;
}

export interface ThemeProfileOverrides {
    readonly colors?: ThemeColors;
    readonly components?: Partial<ThemeComponents>;
    readonly custom?: ThemeVariables;
    readonly effects?: Partial<ThemeEffects>;
    readonly motion?: Partial<ThemeMotion>;
    readonly shape?: Partial<ThemeShape>;
    readonly shadows?: ThemeShadows;
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
    readonly light?: ThemeProfileOverrides;
    readonly theme: ThemeName;
}

export interface ThemeOptions {
    readonly initialTheme: ThemeSelection;
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
