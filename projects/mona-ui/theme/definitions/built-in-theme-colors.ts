import type { ThemeDefinitionRegistry } from "../models/ThemeDefinition";
import { annaThemeColors } from "./anna-theme-colors";
import { monaThemeColors } from "./mona-theme-colors";

export const builtInThemeColors = Object.freeze({
    anna: annaThemeColors,
    mona: monaThemeColors
} satisfies ThemeDefinitionRegistry);
