export type BuiltInThemeName = "anna" | "luna" | "mona";
export type ThemeName = string;
export type ThemeVariant = "light" | "dark";
/** A variant, or `"system"` to follow the operating system's light or dark setting. */
export type ThemeVariantPreference = ThemeVariant | "system";

/** A registered theme and the variants it has. */
export interface ThemeAvailability {
    readonly name: ThemeName;
    readonly variants: readonly ThemeVariant[];
}

/** What's asked for: a theme and a variant, which can be `"system"`. */
export interface ThemePreference {
    readonly name: ThemeName;
    readonly variant: ThemeVariantPreference;
}

/** What's in effect: a theme and the variant it came to. */
export interface ThemeSelection {
    readonly name: ThemeName;
    readonly variant: ThemeVariant;
}
