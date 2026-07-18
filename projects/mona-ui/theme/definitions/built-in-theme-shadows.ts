import type { ThemeShadowDefinitionRegistry } from "../models/ThemeDefinition";
import { annaThemeShadows } from "./anna-theme-shadows";
import { monaThemeShadows } from "./mona-theme-shadows";

export const builtInThemeShadows = Object.freeze({
    anna: annaThemeShadows,
    mona: monaThemeShadows
} satisfies ThemeShadowDefinitionRegistry);
