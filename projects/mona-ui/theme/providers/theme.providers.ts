import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import type { ThemeId } from "../models/Theme";
import type { ThemeVariables } from "../models/ThemeDefinition";

export interface MonaUiThemeConfig {
    readonly defaultThemeId?: ThemeId;
    readonly variableOverrides?: Partial<Record<ThemeId, Partial<ThemeVariables>>>;
}

export const MONA_UI_THEME_CONFIG = new InjectionToken<MonaUiThemeConfig>("MONA_UI_THEME_CONFIG", {
    providedIn: "root",
    factory: () => ({})
});

export function provideMonaUiTheme(config: MonaUiThemeConfig): EnvironmentProviders {
    return makeEnvironmentProviders([{ provide: MONA_UI_THEME_CONFIG, useValue: config }]);
}
