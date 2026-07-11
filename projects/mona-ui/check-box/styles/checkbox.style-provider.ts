import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createCheckboxStyleStrategy } from "./checkbox.style-strategy";
import type { CheckboxStyleOverrides, CheckboxStyleStrategy, CheckboxStylesProviderConfig } from "./checkbox.types";

export const CHECKBOX_STYLE_OVERRIDES = new InjectionToken<readonly CheckboxStyleOverrides[]>(
    "CHECKBOX_STYLE_OVERRIDES"
);

export const CHECKBOX_STYLE_STRATEGY = new InjectionToken<CheckboxStyleStrategy>("CHECKBOX_STYLE_STRATEGY", {
    providedIn: "root",
    factory: () => createCheckboxStyleStrategy(inject(CHECKBOX_STYLE_OVERRIDES, { optional: true }) ?? [])
});

export function provideCheckboxStyles(config: CheckboxStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: CHECKBOX_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: CHECKBOX_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
