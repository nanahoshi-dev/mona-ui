import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createButtonStyleStrategy } from "./button.style-strategy";
import type { ButtonStyleOverrides, ButtonStyleStrategy, ButtonStylesProviderConfig } from "./button.types";

export const BUTTON_STYLE_OVERRIDES = new InjectionToken<readonly ButtonStyleOverrides[]>("BUTTON_STYLE_OVERRIDES");

export const BUTTON_STYLE_STRATEGY = new InjectionToken<ButtonStyleStrategy>("BUTTON_STYLE_STRATEGY", {
    providedIn: "root",
    factory: () => createButtonStyleStrategy(inject(BUTTON_STYLE_OVERRIDES, { optional: true }) ?? [])
});

export function provideButtonStyles(config: ButtonStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: BUTTON_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: BUTTON_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
