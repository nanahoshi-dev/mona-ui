import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createSwitchStyleStrategy } from "./switch.style-strategy";
import type { SwitchStyleOverrides, SwitchStyleStrategy, SwitchStylesProviderConfig } from "./switch.types";

export const SWITCH_STYLE_OVERRIDES = new InjectionToken<readonly SwitchStyleOverrides[]>("SWITCH_STYLE_OVERRIDES");

export const SWITCH_STYLE_STRATEGY = new InjectionToken<SwitchStyleStrategy>("SWITCH_STYLE_STRATEGY", {
    providedIn: "root",
    factory: () => createSwitchStyleStrategy(inject(SWITCH_STYLE_OVERRIDES, { optional: true }) ?? [])
});

export function provideSwitchStyles(config: SwitchStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: SWITCH_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: SWITCH_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
