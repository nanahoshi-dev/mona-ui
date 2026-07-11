import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createMultiSelectStyleStrategy } from "./multi-select.style-strategy";
import type {
    MultiSelectStyleOverrides,
    MultiSelectStyleStrategy,
    MultiSelectStylesProviderConfig
} from "./multi-select.types";

export const MULTI_SELECT_STYLE_OVERRIDES = new InjectionToken<readonly MultiSelectStyleOverrides[]>(
    "MULTI_SELECT_STYLE_OVERRIDES"
);

export const MULTI_SELECT_STYLE_STRATEGY = new InjectionToken<MultiSelectStyleStrategy>(
    "MULTI_SELECT_STYLE_STRATEGY",
    {
        providedIn: "root",
        factory: () => createMultiSelectStyleStrategy(inject(MULTI_SELECT_STYLE_OVERRIDES, { optional: true }) ?? [])
    }
);

export function provideMultiSelectStyles(config: MultiSelectStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: MULTI_SELECT_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: MULTI_SELECT_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
