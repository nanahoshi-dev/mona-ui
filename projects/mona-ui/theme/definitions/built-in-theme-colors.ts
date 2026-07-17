import type { ThemeDefinitionRegistry } from "../models/ThemeDefinition";
import { monaThemeColors } from "./mona-theme-colors";

export const builtInThemeColors = Object.freeze({
    mona: monaThemeColors
} satisfies ThemeDefinitionRegistry);
