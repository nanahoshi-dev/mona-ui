import type { ThemeAvailability, ThemeSelection } from "../models/Theme";
import type { ThemeProfile } from "../models/ThemeDefinition";

export interface ThemeStrategy {
    /** The registered themes and their variants, for `ThemeService.availableThemes()`. */
    availableThemes?(): readonly ThemeAvailability[];

    resolve(selection: ThemeSelection): ThemeProfile;
}
