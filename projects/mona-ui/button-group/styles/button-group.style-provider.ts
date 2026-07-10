import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createButtonGroupStyleStrategy } from "./button-group.style-strategy";
import type { ButtonGroupStyleOverrides, ButtonGroupStyleStrategy, ButtonGroupStylesProviderConfig } from "./button-group.types";

export const BUTTON_GROUP_STYLE_OVERRIDES = new InjectionToken<readonly ButtonGroupStyleOverrides[]>(
    "BUTTON_GROUP_STYLE_OVERRIDES"
);

export const BUTTON_GROUP_STYLE_STRATEGY = new InjectionToken<ButtonGroupStyleStrategy>("BUTTON_GROUP_STYLE_STRATEGY", {
    providedIn: "root",
    factory: () => createButtonGroupStyleStrategy(inject(BUTTON_GROUP_STYLE_OVERRIDES, { optional: true }) ?? [])
});

export function provideButtonGroupStyles(config: ButtonGroupStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: BUTTON_GROUP_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: BUTTON_GROUP_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
