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
