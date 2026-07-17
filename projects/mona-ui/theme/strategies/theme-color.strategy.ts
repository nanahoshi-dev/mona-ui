import type { ThemeStyle, ThemeVariant } from "../models/Theme";
import type { ThemeColors } from "../models/ThemeDefinition";

export interface ThemeColorStrategy {
    resolve(theme: ThemeStyle, variant: ThemeVariant): ThemeColors;
}
