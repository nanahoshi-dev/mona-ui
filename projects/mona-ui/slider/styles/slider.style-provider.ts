import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createSliderStyleStrategy } from "./slider.style-strategy";
import type { SliderStyleOverrides, SliderStyleStrategy, SliderStylesProviderConfig } from "./slider.types";

export const SLIDER_STYLE_OVERRIDES = new InjectionToken<readonly SliderStyleOverrides[]>("SLIDER_STYLE_OVERRIDES");

export const SLIDER_STYLE_STRATEGY = new InjectionToken<SliderStyleStrategy>("SLIDER_STYLE_STRATEGY", {
    providedIn: "root",
    factory: () => createSliderStyleStrategy(inject(SLIDER_STYLE_OVERRIDES, { optional: true }) ?? [])
});

export function provideSliderStyles(config: SliderStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: SLIDER_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: SLIDER_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
