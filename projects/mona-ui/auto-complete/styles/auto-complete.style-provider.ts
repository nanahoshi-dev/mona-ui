import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createAutoCompleteStyleStrategy } from "./auto-complete.style-strategy";
import type {
    AutoCompleteStyleOverrides,
    AutoCompleteStyleStrategy,
    AutoCompleteStylesProviderConfig
} from "./auto-complete.types";

export const AUTO_COMPLETE_STYLE_OVERRIDES = new InjectionToken<readonly AutoCompleteStyleOverrides[]>(
    "AUTO_COMPLETE_STYLE_OVERRIDES"
);

export const AUTO_COMPLETE_STYLE_STRATEGY = new InjectionToken<AutoCompleteStyleStrategy>(
    "AUTO_COMPLETE_STYLE_STRATEGY",
    {
        providedIn: "root",
        factory: () => createAutoCompleteStyleStrategy(inject(AUTO_COMPLETE_STYLE_OVERRIDES, { optional: true }) ?? [])
    }
);

export function provideAutoCompleteStyles(config: AutoCompleteStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: AUTO_COMPLETE_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: AUTO_COMPLETE_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
