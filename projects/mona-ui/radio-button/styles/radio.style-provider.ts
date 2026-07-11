import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createRadioButtonStyleStrategy } from "./radio.style-strategy";
import type {
    RadioButtonStyleOverrides,
    RadioButtonStyleStrategy,
    RadioButtonStylesProviderConfig
} from "./radio.types";

export const RADIO_BUTTON_STYLE_OVERRIDES = new InjectionToken<readonly RadioButtonStyleOverrides[]>(
    "RADIO_BUTTON_STYLE_OVERRIDES"
);

export const RADIO_BUTTON_STYLE_STRATEGY = new InjectionToken<RadioButtonStyleStrategy>("RADIO_BUTTON_STYLE_STRATEGY", {
    providedIn: "root",
    factory: () => createRadioButtonStyleStrategy(inject(RADIO_BUTTON_STYLE_OVERRIDES, { optional: true }) ?? [])
});

export function provideRadioButtonStyles(config: RadioButtonStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: RADIO_BUTTON_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: RADIO_BUTTON_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
