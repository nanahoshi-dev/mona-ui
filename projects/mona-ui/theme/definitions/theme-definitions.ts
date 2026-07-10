import type { ThemeDefinitionRegistry } from "../models/ThemeDefinition";
import { monaThemeDefinition } from "./mona.theme";
import { reinaThemeDefinition } from "./reina.theme";

export const themeDefinitions: ThemeDefinitionRegistry = {
    mona: monaThemeDefinition,
    reina: reinaThemeDefinition
};
