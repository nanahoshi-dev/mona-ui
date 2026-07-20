import type { ThemeSelection } from "../models/Theme";
import type { ThemeProfile } from "../models/ThemeDefinition";

export interface ThemeStrategy {
    resolve(selection: ThemeSelection): ThemeProfile;
}
