import type { BuiltInThemeName } from "../models/Theme";
import type { ThemeFamilyRegistration } from "../models/ThemeDefinition";
import { annaTheme } from "./anna-theme";
import { monaTheme } from "./mona-theme";

export const builtInThemes = Object.freeze({
    anna: annaTheme,
    mona: monaTheme
} satisfies Readonly<Record<BuiltInThemeName, ThemeFamilyRegistration>>);
