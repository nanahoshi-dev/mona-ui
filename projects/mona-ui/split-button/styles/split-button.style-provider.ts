import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createSplitButtonStyleStrategy } from "./split-button.style-strategy";
import type { SplitButtonStyleOverrides, SplitButtonStyleStrategy, SplitButtonStylesProviderConfig } from "./split-button.types";

export const SPLIT_BUTTON_STYLE_OVERRIDES = new InjectionToken<readonly SplitButtonStyleOverrides[]>(
    "SPLIT_BUTTON_STYLE_OVERRIDES"
);

export const SPLIT_BUTTON_STYLE_STRATEGY = new InjectionToken<SplitButtonStyleStrategy>("SPLIT_BUTTON_STYLE_STRATEGY", {
    providedIn: "root",
    factory: () => createSplitButtonStyleStrategy(inject(SPLIT_BUTTON_STYLE_OVERRIDES, { optional: true }) ?? [])
});

export function provideSplitButtonStyles(config: SplitButtonStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: SPLIT_BUTTON_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: SPLIT_BUTTON_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
