import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from "@angular/core";
import { createTextAreaStyleStrategy } from "./textarea.style-strategy";
import type { TextAreaStyleOverrides, TextAreaStyleStrategy, TextAreaStylesProviderConfig } from "./textarea.types";

export const TEXT_AREA_STYLE_OVERRIDES = new InjectionToken<readonly TextAreaStyleOverrides[]>(
    "TEXT_AREA_STYLE_OVERRIDES"
);

export const TEXT_AREA_STYLE_STRATEGY = new InjectionToken<TextAreaStyleStrategy>("TEXT_AREA_STYLE_STRATEGY", {
    providedIn: "root",
    factory: () => createTextAreaStyleStrategy(inject(TEXT_AREA_STYLE_OVERRIDES, { optional: true }) ?? [])
});

export function provideTextAreaStyles(config: TextAreaStylesProviderConfig): EnvironmentProviders {
    if ("strategy" in config) {
        return makeEnvironmentProviders([{ provide: TEXT_AREA_STYLE_STRATEGY, useValue: config.strategy }]);
    }

    return makeEnvironmentProviders([{ provide: TEXT_AREA_STYLE_OVERRIDES, useValue: config, multi: true }]);
}
