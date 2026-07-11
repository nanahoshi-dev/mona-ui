import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createColorGradientStyleStrategy } from "./color-gradient.style-strategy";
import type {
    ColorGradientStyleOverrides,
    ColorGradientStyleStrategy,
    ColorGradientStylesProviderConfig
} from "./color-gradient.types";

export const COLOR_GRADIENT_STYLE_OVERRIDES = new InjectionToken<readonly ColorGradientStyleOverrides[]>(
    "COLOR_GRADIENT_STYLE_OVERRIDES"
);

export const COLOR_GRADIENT_STYLE_STRATEGY = new InjectionToken<ColorGradientStyleStrategy>(
    "COLOR_GRADIENT_STYLE_STRATEGY",
    {
        providedIn: "root",
        factory: () =>
            createColorGradientStyleStrategy(inject(COLOR_GRADIENT_STYLE_OVERRIDES, { optional: true }) ?? [])
    }
);

export function provideColorGradientStyles(config: ColorGradientStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: COLOR_GRADIENT_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: COLOR_GRADIENT_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
