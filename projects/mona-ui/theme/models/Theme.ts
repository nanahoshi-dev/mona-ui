export type BuiltInThemeName = "anna" | "mona";
export type ThemeName = string;
export type ThemeVariant = "light" | "dark";

export interface ThemeSelection {
    readonly name: ThemeName;
    readonly variant: ThemeVariant;
}
