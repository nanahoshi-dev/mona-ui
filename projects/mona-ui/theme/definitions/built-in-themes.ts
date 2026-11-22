import type { BuiltInThemeName } from "../models/Theme";
import type { ThemeFamilyRegistration } from "../models/ThemeDefinition";
import { annaTheme } from "./anna-theme";
import { lunaTheme } from "./luna-theme";
import { monaTheme } from "./mona-theme";
import { renaTheme } from "./rena-theme";

export const builtInThemes = Object.freeze({
    anna: annaTheme,
    luna: lunaTheme,
    mona: monaTheme,
    rena: renaTheme
} satisfies Readonly<Record<BuiltInThemeName, ThemeFamilyRegistration>>);
