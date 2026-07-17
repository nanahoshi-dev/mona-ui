import type { ThemeStyle, ThemeVariant } from "./Theme";

export type ThemeColorVariable = `--color-${string}`;
export type ThemeColors = Readonly<Record<ThemeColorVariable, string>>;

export interface ThemeColorOverrides {
    readonly common?: ThemeColors;
    readonly light?: ThemeColors;
    readonly dark?: ThemeColors;
}

export interface ThemeColorRegistration {
    readonly theme: ThemeStyle;
    readonly colors: ThemeColorOverrides;
}

export interface ThemeColorPaletteSeeds {
    readonly primary: string;
    readonly secondary?: string;
    readonly success?: string;
    readonly error?: string;
    readonly warning?: string;
    readonly info?: string;
}

export type GeneratedThemeColorPalette = Readonly<Record<ThemeVariant, ThemeColors>>;

export interface ThemeColorPaletteRegistration {
    readonly theme: ThemeStyle;
    readonly seeds: ThemeColorPaletteSeeds;
}

export type ThemeVariables = Readonly<Record<`--${string}`, string>>;
export type ThemeDefinition = Readonly<Record<ThemeVariant, ThemeColors>>;
export type ThemeDefinitionRegistry = Readonly<Record<ThemeStyle, ThemeDefinition>>;
