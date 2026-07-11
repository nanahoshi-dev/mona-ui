import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createExpansionPanelStyleStrategy } from "./expansion-panel.style-strategy";
import type {
    ExpansionPanelStyleOverrides,
    ExpansionPanelStyleStrategy,
    ExpansionPanelStylesProviderConfig
} from "./expansion-panel.types";

export const EXPANSION_PANEL_STYLE_OVERRIDES = new InjectionToken<readonly ExpansionPanelStyleOverrides[]>(
    "EXPANSION_PANEL_STYLE_OVERRIDES"
);

export const EXPANSION_PANEL_STYLE_STRATEGY = new InjectionToken<ExpansionPanelStyleStrategy>(
    "EXPANSION_PANEL_STYLE_STRATEGY",
    {
        providedIn: "root",
        factory: () => createExpansionPanelStyleStrategy(inject(EXPANSION_PANEL_STYLE_OVERRIDES, { optional: true }) ?? [])
    }
);

export function provideExpansionPanelStyles(config: ExpansionPanelStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: EXPANSION_PANEL_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: EXPANSION_PANEL_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
