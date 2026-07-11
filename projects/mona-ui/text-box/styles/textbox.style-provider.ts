import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createTextBoxStyleStrategy } from "./textbox.style-strategy";
import type { TextBoxStyleOverrides, TextBoxStyleStrategy, TextBoxStylesProviderConfig } from "./textbox.types";

export const TEXT_BOX_STYLE_OVERRIDES = new InjectionToken<readonly TextBoxStyleOverrides[]>(
    "TEXT_BOX_STYLE_OVERRIDES"
);

export const TEXT_BOX_STYLE_STRATEGY = new InjectionToken<TextBoxStyleStrategy>("TEXT_BOX_STYLE_STRATEGY", {
    providedIn: "root",
    factory: () => createTextBoxStyleStrategy(inject(TEXT_BOX_STYLE_OVERRIDES, { optional: true }) ?? [])
});

export function provideTextBoxStyles(config: TextBoxStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: TEXT_BOX_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: TEXT_BOX_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
