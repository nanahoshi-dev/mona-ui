import type { ThemeStyle } from "../models/Theme";

export interface ThemeStrategy<TStyle> {
    readonly resolve: (theme: ThemeStyle) => TStyle;
}

export function createThemeStrategy<TStyle>(
    styles: Partial<Record<ThemeStyle, TStyle>>,
    fallback: TStyle
): ThemeStrategy<TStyle> {
    return {
        resolve: (theme: ThemeStyle) => styles[theme] ?? fallback
    };
}

/**
 * Creates a strategy whose unspecified themes inherit the canonical Mona style.
 * Theme-specific styles are expected to have already been composed from the
 * Mona recipe, so application-provided style layers can be applied afterwards.
 */
export function createInheritedThemeStrategy<TStyle>(
    mona: TStyle,
    inheritedStyles: Partial<Record<Exclude<ThemeStyle, "mona">, TStyle>>
): ThemeStrategy<TStyle> {
    return createThemeStrategy({ mona, ...inheritedStyles }, mona);
}
