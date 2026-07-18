import type { ThemeStyle } from "../models/Theme";

export type ThemeStrategy<TStyle> = Readonly<Record<ThemeStyle, TStyle>>;

/**
 * Creates an exhaustive theme resolver. Adding a ThemeStyle requires every registry to
 * provide an explicit implementation, preventing silent fallback to another theme.
 */
export function createThemeStrategy<TStyle>(styles: ThemeStrategy<TStyle>) {
    return (theme: ThemeStyle): TStyle => styles[theme];
}
