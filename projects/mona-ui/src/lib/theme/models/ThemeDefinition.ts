import type { ThemeStyle, ThemeVariant } from "./Theme";

export type ThemeVariables = Record<`--${string}`, string>;
export type ThemeDefinition = Readonly<Record<ThemeVariant, ThemeVariables>>;
export type ThemeDefinitionRegistry = Readonly<Record<ThemeStyle, ThemeDefinition>>;
