import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createTimeSelectorStyleStrategy } from "./time-selector.style-strategy";
import type {
    TimeSelectorStyleOverrides,
    TimeSelectorStyleStrategy,
    TimeSelectorStylesProviderConfig
} from "./time-selector.types";

export const TIME_SELECTOR_STYLE_OVERRIDES = new InjectionToken<readonly TimeSelectorStyleOverrides[]>(
    "TIME_SELECTOR_STYLE_OVERRIDES"
);

export const TIME_SELECTOR_STYLE_STRATEGY = new InjectionToken<TimeSelectorStyleStrategy>(
    "TIME_SELECTOR_STYLE_STRATEGY",
    {
        providedIn: "root",
        factory: () =>
            createTimeSelectorStyleStrategy(inject(TIME_SELECTOR_STYLE_OVERRIDES, { optional: true }) ?? [])
    }
);

export function provideTimeSelectorStyles(config: TimeSelectorStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: TIME_SELECTOR_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: TIME_SELECTOR_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
