import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createIndicatorIconStyleStrategy } from "./indicator-icon.style-strategy";
import type {
    IndicatorIconStyleOverrides,
    IndicatorIconStylesProviderConfig,
    IndicatorIconStyleStrategy
} from "./indicator-icon.types";

export const INDICATOR_ICON_STYLE_OVERRIDES = new InjectionToken<readonly IndicatorIconStyleOverrides[]>(
    "INDICATOR_ICON_STYLE_OVERRIDES"
);

export const INDICATOR_ICON_STYLE_STRATEGY = new InjectionToken<IndicatorIconStyleStrategy>(
    "INDICATOR_ICON_STYLE_STRATEGY",
    {
        providedIn: "root",
        factory: () =>
            createIndicatorIconStyleStrategy(inject(INDICATOR_ICON_STYLE_OVERRIDES, { optional: true }) ?? [])
    }
);

export function provideIndicatorIconStyles(config: IndicatorIconStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: INDICATOR_ICON_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: INDICATOR_ICON_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
