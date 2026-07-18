/*
 * Public API Surface of @nanahoshi/mona-ui/theme
 */

export * from "./services/theme.service";
export * from "./models/Theme";
export type {
    ThemeColorOverrides,
    ThemeColorPaletteRegistration,
    ThemeColorPaletteSeeds,
    ThemeColorRegistration,
    ThemeColors,
    ThemeColorVariable,
    ThemeShadows,
    ThemeShadowVariable,
    ThemeVariable,
    ThemeVariables,
    GeneratedThemeColorPalette
} from "./models/ThemeDefinition";
export * from "./providers/theme-color.providers";
export type { ThemeColorStrategy } from "./strategies/theme-color.strategy";
export { THEME_COLOR_STRATEGY } from "./tokens/theme-color.tokens";
export { generateThemeColorPalette } from "./utils/generate-theme-color-palette";
export { createThemeStrategy, type ThemeStrategy } from "./utils/theme-strategy";
