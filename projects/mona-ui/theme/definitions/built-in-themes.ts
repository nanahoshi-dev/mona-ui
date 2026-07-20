import type { BuiltInThemeName } from "../models/Theme";
import type { ThemeFamilyRegistration } from "../models/ThemeDefinition";
import { annaTheme } from "./anna-theme";
import { lunaTheme } from "./luna-theme";
import { monaTheme } from "./mona-theme";

export const builtInThemes = Object.freeze({
    anna: annaTheme,
    luna: lunaTheme,
    mona: monaTheme
} satisfies Readonly<Record<BuiltInThemeName, ThemeFamilyRegistration>>);
